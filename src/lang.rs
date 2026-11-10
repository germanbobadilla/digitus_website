//! Server-side language detection.
//!
//! Priority: 1) `lang` cookie  2) `?lang=` query  3) `CloudFront-Viewer-Country`
//!           4) `Accept-Language`  5) English.

use crate::i18n::Lang;
use axum::http::{HeaderMap, header};

pub const COOKIE: &str = "lang";

/// ISO 3166-1 alpha-2 codes of Spanish-speaking countries.
pub const ES_COUNTRIES: [&str; 21] = [
    "ES", "MX", "GT", "HN", "SV", "NI", "CR", "PA", "CU", "DO", "PR", "CO", "VE", "EC", "PE", "BO",
    "CL", "AR", "PY", "UY", "GQ",
];

pub fn detect(headers: &HeaderMap, query_lang: Option<&str>) -> Lang {
    cookie_lang(headers)
        .or_else(|| query_lang.and_then(Lang::parse))
        .or_else(|| country_lang(headers))
        .or_else(|| accept_language(headers))
        .unwrap_or(Lang::En)
}

pub fn cookie_lang(headers: &HeaderMap) -> Option<Lang> {
    headers
        .get_all(header::COOKIE)
        .iter()
        .filter_map(|v| v.to_str().ok())
        .flat_map(|v| v.split(';'))
        .filter_map(|pair| pair.trim().split_once('='))
        .find(|(k, _)| *k == COOKIE)
        .and_then(|(_, v)| Lang::parse(v))
}

fn country_lang(headers: &HeaderMap) -> Option<Lang> {
    let cc = headers
        .get("cloudfront-viewer-country")?
        .to_str()
        .ok()?
        .trim()
        .to_ascii_uppercase();
    if cc.len() != 2 {
        return None;
    }
    Some(if ES_COUNTRIES.contains(&cc.as_str()) {
        Lang::Es
    } else {
        Lang::En
    })
}

/// Picks the highest-weighted `es*` or `en*` entry; other languages are ignored.
fn accept_language(headers: &HeaderMap) -> Option<Lang> {
    let raw = headers.get(header::ACCEPT_LANGUAGE)?.to_str().ok()?;
    let mut best: Option<(f32, Lang)> = None;
    for part in raw.split(',') {
        let mut it = part.split(';');
        let tag = it.next().unwrap_or("").trim();
        let q = it
            .find_map(|p| p.trim().strip_prefix("q="))
            .and_then(|q| q.parse::<f32>().ok())
            .unwrap_or(1.0);
        let primary = tag.split('-').next().unwrap_or("");
        if let Some(lang) = Lang::parse(primary)
            && q > 0.0
            && best.is_none_or(|(bq, _)| q > bq)
        {
            best = Some((q, lang));
        }
    }
    best.map(|(_, l)| l)
}

pub fn set_cookie_value(lang: Lang) -> String {
    format!(
        "{COOKIE}={}; Path=/; Max-Age=31536000; SameSite=Lax; Secure",
        lang.code()
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::HeaderValue;

    fn h(pairs: &[(&'static str, &'static str)]) -> HeaderMap {
        let mut m = HeaderMap::new();
        for (k, v) in pairs {
            m.append(*k, HeaderValue::from_static(v));
        }
        m
    }

    #[test]
    fn defaults_to_english() {
        assert_eq!(detect(&HeaderMap::new(), None), Lang::En);
    }

    #[test]
    fn country_decides() {
        assert_eq!(
            detect(&h(&[("cloudfront-viewer-country", "DO")]), None),
            Lang::Es
        );
        assert_eq!(
            detect(&h(&[("cloudfront-viewer-country", "US")]), None),
            Lang::En
        );
        assert_eq!(
            detect(&h(&[("cloudfront-viewer-country", "gq")]), None),
            Lang::Es
        );
    }

    #[test]
    fn country_beats_accept_language() {
        let hm = h(&[
            ("cloudfront-viewer-country", "US"),
            ("accept-language", "es-DO,es;q=0.9"),
        ]);
        assert_eq!(detect(&hm, None), Lang::En);
    }

    #[test]
    fn query_beats_country_and_cookie_beats_query() {
        let hm = h(&[("cloudfront-viewer-country", "DO")]);
        assert_eq!(detect(&hm, Some("en")), Lang::En);
        let hm = h(&[
            ("cloudfront-viewer-country", "DO"),
            ("cookie", "a=1; lang=en"),
        ]);
        assert_eq!(detect(&hm, Some("es")), Lang::En);
    }

    #[test]
    fn invalid_cookie_is_ignored() {
        let hm = h(&[("cookie", "lang=fr"), ("cloudfront-viewer-country", "MX")]);
        assert_eq!(detect(&hm, None), Lang::Es);
    }

    #[test]
    fn accept_language_weights() {
        assert_eq!(
            detect(&h(&[("accept-language", "fr-FR,es;q=0.8,en;q=0.5")]), None),
            Lang::Es
        );
        assert_eq!(
            detect(&h(&[("accept-language", "en-US,en;q=0.9,es;q=0.8")]), None),
            Lang::En
        );
        assert_eq!(detect(&h(&[("accept-language", "de,fr")]), None), Lang::En);
    }
}
