//! Routes, handlers and template view models.

use crate::{
    contact::{ContactInput, Email, FieldErrors, Mailer},
    i18n::{self, Lang},
    lang,
    services::{self, SECTORS, SERVICES, Service},
};
use askama::Template;
use axum::{
    Form, Router,
    extract::{Path, Query, Request, State},
    http::{HeaderMap, HeaderValue, StatusCode, header},
    middleware::{self, Next},
    response::{Html, IntoResponse, Redirect, Response},
    routing::{get, post},
};
use serde::Deserialize;
use std::sync::Arc;

const PAGE_CACHE: &str = "public, max-age=300, s-maxage=3600";
const NO_STORE: &str = "private, no-store";

#[derive(Clone)]
pub struct AppState {
    pub mailer: Arc<dyn Mailer>,
    /// Absolute origin used for canonical/hreflang URLs, no trailing slash.
    pub site_url: Arc<str>,
    /// Appended to static asset URLs for cache busting (e.g. git SHA).
    pub asset_version: Arc<str>,
    /// When set, every request must carry `x-origin-verify: <secret>` (added by CloudFront).
    pub origin_secret: Option<Arc<str>>,
}

pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/", get(root))
        .route("/healthz", get(|| async { "ok" }))
        .route("/robots.txt", get(robots))
        .route("/sitemap.xml", get(sitemap))
        .route("/set-lang/{lang}", get(set_lang))
        .route("/contact", post(contact))
        .route("/{lang}", get(lang_no_slash))
        .route("/{lang}/", get(home))
        .route("/{lang}/partials/service/{slug}", get(service_partial))
        .fallback(not_found)
        .layer(middleware::map_response(security_headers))
        .layer(middleware::from_fn_with_state(state.clone(), origin_guard))
        .with_state(state)
}

// ---------------------------------------------------------------- view models

#[derive(Clone)]
pub struct Ctx {
    pub lang: Lang,
    pub site_url: Arc<str>,
    pub v: Arc<str>,
    pub year: i32,
}

impl Ctx {
    fn new(state: &AppState, lang: Lang) -> Self {
        Ctx {
            lang,
            site_url: state.site_url.clone(),
            v: state.asset_version.clone(),
            year: current_year(),
        }
    }
    pub fn t<'a>(&self, key: &'a str) -> &'a str {
        i18n::t(self.lang, key)
    }
    pub fn code(&self) -> &'static str {
        self.lang.code()
    }
    pub fn is_es(&self) -> bool {
        self.lang == Lang::Es
    }
}

pub struct SvcView {
    pub slug: &'static str,
    pub form_value: &'static str,
    pub title: &'static str,
    pub desc: &'static str,
    pub items: Vec<&'static str>,
}

/// Resolve a key built at runtime (e.g. `svc.ai.t`).
fn lookup(lang: Lang, key: String) -> &'static str {
    i18n::get(lang, &key).unwrap_or_else(|| {
        tracing::warn!(%key, %lang, "missing translation");
        ""
    })
}

impl SvcView {
    fn new(lang: Lang, s: &'static Service) -> Self {
        SvcView {
            slug: s.slug,
            form_value: s.form_value,
            title: lookup(lang, s.title_key()),
            desc: lookup(lang, s.desc_key()),
            items: s.item_keys().into_iter().map(|k| lookup(lang, k)).collect(),
        }
    }
}

pub struct Opt {
    pub value: &'static str,
    pub label: &'static str,
    pub selected: bool,
}

#[derive(Template)]
#[template(path = "partials/contact_form.html")]
pub struct ContactFormTpl {
    pub c: Ctx,
    pub v: ContactInput,
    pub e: FieldErrors,
    pub send_failed: bool,
    pub sectors: Vec<Opt>,
    pub services: Vec<Opt>,
}

impl ContactFormTpl {
    fn new(c: Ctx, v: ContactInput, e: FieldErrors, send_failed: bool) -> Self {
        let lang = c.lang;
        let sectors = SECTORS
            .iter()
            .map(|(value, key)| Opt {
                value,
                label: i18n::t(lang, key),
                selected: v.sector == *value,
            })
            .collect();
        let services = SERVICES
            .iter()
            .map(|s| Opt {
                value: s.form_value,
                label: lookup(lang, s.title_key()),
                selected: v.service == s.form_value,
            })
            .collect();
        ContactFormTpl {
            c,
            v,
            e,
            send_failed,
            sectors,
            services,
        }
    }
}

#[derive(Template)]
#[template(path = "index.html")]
pub struct IndexTpl {
    pub c: Ctx,
    pub ai: SvcView,
    pub dev: SvcView,
    pub dep: SvcView,
    pub dx: SvcView,
    pub mkt: SvcView,
    pub cloud: SvcView,
    pub form: ContactFormTpl,
}

#[derive(Template)]
#[template(path = "message.html")]
pub struct MessageTpl {
    pub c: Ctx,
    pub title: String,
    pub body: String,
}

#[derive(Template)]
#[template(path = "partials/service_modal.html")]
pub struct ServiceModalTpl {
    pub c: Ctx,
    pub s: SvcView,
}

#[derive(Template)]
#[template(path = "partials/contact_ok.html")]
pub struct ContactOkTpl {
    pub c: Ctx,
}

/// Render a template into a response with the given status and Cache-Control.
fn html<T: Template>(t: &T, status: StatusCode, cache: &'static str) -> Response {
    match t.render() {
        Ok(body) => (status, [(header::CACHE_CONTROL, cache)], Html(body)).into_response(),
        Err(e) => {
            tracing::error!(error = %e, "template render failed");
            (StatusCode::INTERNAL_SERVER_ERROR, "template error").into_response()
        }
    }
}

// ------------------------------------------------------------------- handlers

#[derive(Deserialize)]
struct LangQuery {
    lang: Option<String>,
}

async fn root(headers: HeaderMap, Query(q): Query<LangQuery>) -> Response {
    let lang = lang::detect(&headers, q.lang.as_deref());
    (
        StatusCode::FOUND,
        [
            (header::LOCATION, format!("/{lang}/")),
            (header::CACHE_CONTROL, NO_STORE.to_string()),
            (
                header::VARY,
                "Cookie, CloudFront-Viewer-Country, Accept-Language".to_string(),
            ),
        ],
    )
        .into_response()
}

async fn lang_no_slash(
    Path(code): Path<String>,
    State(st): State<AppState>,
    headers: HeaderMap,
) -> Response {
    match Lang::parse(&code) {
        Some(l) if l.code() == code => Redirect::permanent(&format!("/{l}/")).into_response(),
        _ => not_found(State(st), headers).await,
    }
}

async fn set_lang(
    Path(code): Path<String>,
    State(st): State<AppState>,
    headers: HeaderMap,
) -> Response {
    let Some(lang) = Lang::parse(&code) else {
        return not_found(State(st), headers).await;
    };
    (
        StatusCode::SEE_OTHER,
        [
            (header::LOCATION, format!("/{lang}/")),
            (header::SET_COOKIE, lang::set_cookie_value(lang)),
            (header::CACHE_CONTROL, NO_STORE.to_string()),
        ],
    )
        .into_response()
}

async fn home(
    Path(code): Path<String>,
    State(st): State<AppState>,
    headers: HeaderMap,
) -> Response {
    let Some(lang) = Lang::parse(&code).filter(|l| l.code() == code) else {
        return not_found(State(st), headers).await;
    };
    let c = Ctx::new(&st, lang);
    let v = ContactInput {
        lang: lang.code().into(),
        ..Default::default()
    }
    .normalize();
    let tpl = IndexTpl {
        ai: SvcView::new(lang, services::by_key("ai")),
        dev: SvcView::new(lang, services::by_key("dev")),
        dep: SvcView::new(lang, services::by_key("dep")),
        dx: SvcView::new(lang, services::by_key("dx")),
        mkt: SvcView::new(lang, services::by_key("mkt")),
        cloud: SvcView::new(lang, services::by_key("cloud")),
        form: ContactFormTpl::new(c.clone(), v, FieldErrors::default(), false),
        c,
    };
    html(&tpl, StatusCode::OK, PAGE_CACHE)
}

async fn service_partial(
    Path((code, slug)): Path<(String, String)>,
    State(st): State<AppState>,
    headers: HeaderMap,
) -> Response {
    let (Some(lang), Some(svc)) = (Lang::parse(&code), services::by_slug(&slug)) else {
        return not_found(State(st), headers).await;
    };
    html(
        &ServiceModalTpl {
            c: Ctx::new(&st, lang),
            s: SvcView::new(lang, svc),
        },
        StatusCode::OK,
        PAGE_CACHE,
    )
}

async fn contact(
    State(st): State<AppState>,
    headers: HeaderMap,
    Form(input): Form<ContactInput>,
) -> Response {
    let is_htmx = headers.contains_key("hx-request");
    let input = input.normalize();
    let c = Ctx::new(&st, input.lang());

    if input.is_spam() {
        tracing::info!("contact honeypot triggered");
        return success(&c, is_htmx);
    }

    let errors = input.validate();
    if errors.any() {
        // HTMX only swaps 2xx responses, so validation errors return 200 with the re-rendered form.
        return if is_htmx {
            html(
                &ContactFormTpl::new(c, input, errors, false),
                StatusCode::OK,
                NO_STORE,
            )
        } else {
            message(&c, "f.err.msg", StatusCode::UNPROCESSABLE_ENTITY)
        };
    }

    match st.mailer.send(Email::from_input(&input)).await {
        Ok(()) => success(&c, is_htmx),
        Err(e) => {
            tracing::error!(error = %e, "contact send failed");
            if is_htmx {
                html(
                    &ContactFormTpl::new(c, input, FieldErrors::default(), true),
                    StatusCode::OK,
                    NO_STORE,
                )
            } else {
                message(&c, "f.err.send", StatusCode::BAD_GATEWAY)
            }
        }
    }
}

fn success(c: &Ctx, is_htmx: bool) -> Response {
    if is_htmx {
        html(&ContactOkTpl { c: c.clone() }, StatusCode::OK, NO_STORE)
    } else {
        message(c, "f.ok", StatusCode::OK)
    }
}

fn message(c: &Ctx, body_key: &str, status: StatusCode) -> Response {
    let tpl = MessageTpl {
        c: c.clone(),
        title: c.t("nav.cta").into(),
        body: c.t(body_key).into(),
    };
    html(&tpl, status, NO_STORE)
}

async fn not_found(State(st): State<AppState>, headers: HeaderMap) -> Response {
    let c = Ctx::new(&st, lang::detect(&headers, None));
    let tpl = MessageTpl {
        title: c.t("nf.h1").into(),
        body: c.t("nf.p").into(),
        c,
    };
    html(&tpl, StatusCode::NOT_FOUND, "public, max-age=60")
}

async fn robots(State(st): State<AppState>) -> Response {
    let body = format!(
        "User-agent: *\nAllow: /\nDisallow: /set-lang/\nSitemap: {}/sitemap.xml\n",
        st.site_url
    );
    (
        [
            (header::CONTENT_TYPE, "text/plain; charset=utf-8"),
            (header::CACHE_CONTROL, PAGE_CACHE),
        ],
        body,
    )
        .into_response()
}

async fn sitemap(State(st): State<AppState>) -> Response {
    let base = &st.site_url;
    let alts = Lang::ALL
        .iter()
        .map(|l| format!(r#"<xhtml:link rel="alternate" hreflang="{l}" href="{base}/{l}/"/>"#))
        .collect::<String>();
    let urls = Lang::ALL
        .iter()
        .map(|l| format!("<url><loc>{base}/{l}/</loc>{alts}</url>"))
        .collect::<String>();
    let body = format!(
        r#"<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">{urls}</urlset>"#
    );
    (
        [
            (header::CONTENT_TYPE, "application/xml"),
            (header::CACHE_CONTROL, PAGE_CACHE),
        ],
        body,
    )
        .into_response()
}

// ----------------------------------------------------------------- middleware

async fn origin_guard(State(st): State<AppState>, req: Request, next: Next) -> Response {
    if let Some(secret) = &st.origin_secret {
        let ok = req
            .headers()
            .get("x-origin-verify")
            .and_then(|v| v.to_str().ok())
            == Some(secret.as_ref());
        if !ok {
            return (StatusCode::FORBIDDEN, "forbidden").into_response();
        }
    }
    next.run(req).await
}

async fn security_headers(mut res: Response) -> Response {
    let h = res.headers_mut();
    h.insert(
        "x-content-type-options",
        HeaderValue::from_static("nosniff"),
    );
    h.insert(
        "referrer-policy",
        HeaderValue::from_static("strict-origin-when-cross-origin"),
    );
    h.insert("x-frame-options", HeaderValue::from_static("DENY"));
    h.insert(
        "permissions-policy",
        HeaderValue::from_static("camera=(), microphone=(), geolocation=()"),
    );
    res
}

// ---------------------------------------------------------------------- utils

fn current_year() -> i32 {
    let secs = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);
    // Civil-from-days (Howard Hinnant).
    let z = secs.div_euclid(86_400) + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    (yoe + era * 400 + i64::from(m <= 2)) as i32
}
