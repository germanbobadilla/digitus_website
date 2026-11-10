use axum::{
    body::Body,
    http::{Request, StatusCode, header},
};
use digitus::{
    AppState,
    contact::{Email, Mailer, SendFuture},
    router,
};
use http_body_util::BodyExt;
use std::sync::{Arc, Mutex};
use tower::ServiceExt;

#[derive(Default)]
struct MockMailer {
    sent: Mutex<Vec<Email>>,
    fail: bool,
}

impl Mailer for MockMailer {
    fn send(&self, email: Email) -> SendFuture<'_> {
        Box::pin(async move {
            if self.fail {
                return Err("boom".into());
            }
            self.sent.lock().unwrap().push(email);
            Ok(())
        })
    }
}

fn state(mailer: Arc<MockMailer>, secret: Option<&str>) -> AppState {
    AppState {
        mailer,
        site_url: "https://digitus.test".into(),
        asset_version: "t".into(),
        origin_secret: secret.map(Into::into),
    }
}

async fn send(st: AppState, req: Request<Body>) -> (StatusCode, axum::http::HeaderMap, String) {
    let res = router(st).oneshot(req).await.unwrap();
    let status = res.status();
    let headers = res.headers().clone();
    let body = res.into_body().collect().await.unwrap().to_bytes();
    (status, headers, String::from_utf8_lossy(&body).into_owned())
}

fn get(uri: &str) -> Request<Body> {
    Request::get(uri).body(Body::empty()).unwrap()
}

fn st() -> AppState {
    state(Arc::new(MockMailer::default()), None)
}

#[tokio::test]
async fn root_redirects_by_country() {
    let req = Request::get("/")
        .header("cloudfront-viewer-country", "DO")
        .body(Body::empty())
        .unwrap();
    let (s, h, _) = send(st(), req).await;
    assert_eq!(s, StatusCode::FOUND);
    assert_eq!(h[header::LOCATION], "/es/");
    assert!(
        h[header::CACHE_CONTROL]
            .to_str()
            .unwrap()
            .contains("no-store")
    );

    let req = Request::get("/")
        .header("cloudfront-viewer-country", "US")
        .body(Body::empty())
        .unwrap();
    let (_, h, _) = send(st(), req).await;
    assert_eq!(h[header::LOCATION], "/en/");
}

#[tokio::test]
async fn cookie_overrides_country() {
    let req = Request::get("/")
        .header("cloudfront-viewer-country", "DO")
        .header("cookie", "lang=en")
        .body(Body::empty())
        .unwrap();
    let (_, h, _) = send(st(), req).await;
    assert_eq!(h[header::LOCATION], "/en/");
}

#[tokio::test]
async fn home_pages_render_in_each_language() {
    let (s, h, body) = send(st(), get("/es/")).await;
    assert_eq!(s, StatusCode::OK);
    assert!(
        h[header::CACHE_CONTROL]
            .to_str()
            .unwrap()
            .starts_with("public")
    );
    assert!(body.contains(r#"<html lang="es">"#));
    assert!(body.contains("Hablemos"));
    assert!(body.contains(r#"hreflang="en" href="https://digitus.test/en/""#));
    assert!(body.contains(r#"id="contact-form""#));

    let (_, _, body) = send(st(), get("/en/")).await;
    assert!(body.contains(r#"<html lang="en">"#));
    assert!(body.contains("Let&#39;s talk") || body.contains("Let&#x27;s talk"));
    assert!(!body.contains("svc.ai.t"), "untranslated key leaked");
}

#[tokio::test]
async fn unknown_language_is_404() {
    let (s, _, body) = send(st(), get("/fr/")).await;
    assert_eq!(s, StatusCode::NOT_FOUND);
    assert!(body.contains("noindex"));
    let (s, _, _) = send(st(), get("/ES/")).await;
    assert_eq!(s, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn missing_trailing_slash_redirects() {
    let (s, h, _) = send(st(), get("/es")).await;
    assert_eq!(s, StatusCode::PERMANENT_REDIRECT);
    assert_eq!(h[header::LOCATION], "/es/");
}

#[tokio::test]
async fn set_lang_sets_cookie() {
    let (s, h, _) = send(st(), get("/set-lang/en")).await;
    assert_eq!(s, StatusCode::SEE_OTHER);
    assert_eq!(h[header::LOCATION], "/en/");
    assert!(
        h[header::SET_COOKIE]
            .to_str()
            .unwrap()
            .starts_with("lang=en;")
    );
}

#[tokio::test]
async fn service_partial() {
    let (s, _, body) = send(st(), get("/en/partials/service/ai-integration")).await;
    assert_eq!(s, StatusCode::OK);
    assert!(body.contains("AI Integration for Business"));
    assert!(!body.contains("<html"), "partial must not include layout");
    let (s, _, _) = send(st(), get("/en/partials/service/nope")).await;
    assert_eq!(s, StatusCode::NOT_FOUND);
}

fn contact_req(body: &'static str, htmx: bool) -> Request<Body> {
    let mut b =
        Request::post("/contact").header(header::CONTENT_TYPE, "application/x-www-form-urlencoded");
    if htmx {
        b = b.header("hx-request", "true");
    }
    b.body(Body::from(body)).unwrap()
}

const VALID: &str = "name=Ana&email=ana%40example.com&org=&sector=public&service=dev&message=Necesitamos+ayuda&lang=es&website=";

#[tokio::test]
async fn contact_success_sends_email() {
    let m = Arc::new(MockMailer::default());
    let (s, h, body) = send(state(m.clone(), None), contact_req(VALID, true)).await;
    assert_eq!(s, StatusCode::OK);
    assert!(body.contains("form-ok") && body.contains("Gracias"));
    assert!(
        h[header::CACHE_CONTROL]
            .to_str()
            .unwrap()
            .contains("no-store")
    );
    let sent = m.sent.lock().unwrap();
    assert_eq!(sent.len(), 1);
    assert_eq!(sent[0].reply_to, "ana@example.com");
    assert!(sent[0].body.contains("Necesitamos ayuda"));
}

#[tokio::test]
async fn contact_validation_rerenders_form() {
    let m = Arc::new(MockMailer::default());
    let body = "name=&email=bad&message=hi&lang=en&sector=smb&service=cloud";
    let (s, _, html) = send(state(m.clone(), None), contact_req(body, true)).await;
    assert_eq!(s, StatusCode::OK);
    assert!(html.contains("Please enter your name."));
    assert!(html.contains("valid email"));
    assert!(html.contains(r#"value="bad""#), "keeps user input");
    assert!(html.contains(r#"<option value="cloud" selected>"#));
    assert!(m.sent.lock().unwrap().is_empty());
}

#[tokio::test]
async fn contact_escapes_input() {
    let body = "name=%3Cscript%3Ex%3C%2Fscript%3E&email=bad&message=hi&lang=en";
    let (_, _, html) = send(st(), contact_req(body, true)).await;
    assert!(!html.contains("<script>x"));
}

#[tokio::test]
async fn contact_send_failure_shows_error() {
    let m = Arc::new(MockMailer {
        fail: true,
        ..Default::default()
    });
    let (s, _, html) = send(state(m, None), contact_req(VALID, true)).await;
    assert_eq!(s, StatusCode::OK);
    assert!(html.contains("form-err"));
    assert!(html.contains(r#"value="Ana""#));
}

#[tokio::test]
async fn contact_honeypot_does_not_send() {
    let m = Arc::new(MockMailer::default());
    let body = "name=Bot&email=b%40b.com&message=buy+now+please&lang=en&website=http%3A%2F%2Fspam";
    let (s, _, html) = send(state(m.clone(), None), contact_req(body, true)).await;
    assert_eq!(s, StatusCode::OK);
    assert!(html.contains("form-ok"));
    assert!(m.sent.lock().unwrap().is_empty());
}

#[tokio::test]
async fn contact_without_htmx_returns_full_page() {
    let (s, _, html) = send(st(), contact_req(VALID, false)).await;
    assert_eq!(s, StatusCode::OK);
    assert!(html.contains("<html") && html.contains("Gracias"));
}

#[tokio::test]
async fn origin_guard() {
    let st = || state(Arc::new(MockMailer::default()), Some("s3cr3t"));
    let (s, _, _) = send(st(), get("/healthz")).await;
    assert_eq!(s, StatusCode::FORBIDDEN);
    let req = Request::get("/healthz")
        .header("x-origin-verify", "s3cr3t")
        .body(Body::empty())
        .unwrap();
    let (s, _, body) = send(st(), req).await;
    assert_eq!((s, body.as_str()), (StatusCode::OK, "ok"));
}

#[tokio::test]
async fn security_headers_and_seo_files() {
    let (_, h, body) = send(st(), get("/robots.txt")).await;
    assert_eq!(h["x-content-type-options"], "nosniff");
    assert!(body.contains("Sitemap: https://digitus.test/sitemap.xml"));
    let (_, _, body) = send(st(), get("/sitemap.xml")).await;
    assert!(body.contains("<loc>https://digitus.test/es/</loc>"));
}
