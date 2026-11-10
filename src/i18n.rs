//! Translations. All user-facing copy lives in `locales/{es,en}.json` and is
//! compiled into the binary, so the Lambda package has no runtime file reads.

use std::{collections::HashMap, fmt, sync::LazyLock};

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Lang {
    Es,
    En,
}

impl Lang {
    pub const ALL: [Lang; 2] = [Lang::Es, Lang::En];

    pub fn code(self) -> &'static str {
        match self {
            Lang::Es => "es",
            Lang::En => "en",
        }
    }

    pub fn parse(s: &str) -> Option<Lang> {
        match s.trim().to_ascii_lowercase().as_str() {
            "es" => Some(Lang::Es),
            "en" => Some(Lang::En),
            _ => None,
        }
    }

    pub fn other(self) -> Lang {
        match self {
            Lang::Es => Lang::En,
            Lang::En => Lang::Es,
        }
    }
}

impl fmt::Display for Lang {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.code())
    }
}

type Dict = HashMap<String, String>;

fn load(src: &str, name: &str) -> Dict {
    serde_json::from_str(src).unwrap_or_else(|e| panic!("invalid locales/{name}.json: {e}"))
}

static ES: LazyLock<Dict> = LazyLock::new(|| load(include_str!("../locales/es.json"), "es"));
static EN: LazyLock<Dict> = LazyLock::new(|| load(include_str!("../locales/en.json"), "en"));

fn dict(lang: Lang) -> &'static Dict {
    match lang {
        Lang::Es => &ES,
        Lang::En => &EN,
    }
}

/// Value for `key`, borrowed from the process-wide dictionary.
pub fn get(lang: Lang, key: &str) -> Option<&'static str> {
    dict(lang).get(key).map(String::as_str)
}

/// Look up `key`. A missing key returns the key itself, which lets literal
/// tags like "RAG" pass through; `tests::locales_have_same_keys` guards real keys.
pub fn t(lang: Lang, key: &str) -> &str {
    match dict(lang).get(key) {
        Some(v) => v.as_str(),
        None => key,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeSet;

    #[test]
    fn locales_have_same_keys() {
        let es: BTreeSet<_> = dict(Lang::Es).keys().collect();
        let en: BTreeSet<_> = dict(Lang::En).keys().collect();
        let only_es: Vec<_> = es.difference(&en).collect();
        let only_en: Vec<_> = en.difference(&es).collect();
        assert!(
            only_es.is_empty() && only_en.is_empty(),
            "only in es: {only_es:?}; only in en: {only_en:?}"
        );
    }

    #[test]
    fn no_empty_values() {
        for lang in Lang::ALL {
            for (k, v) in dict(lang) {
                assert!(!v.trim().is_empty(), "{lang}:{k} is empty");
            }
        }
    }

    #[test]
    fn lookup_and_fallback() {
        assert_eq!(t(Lang::Es, "nav.cta"), "Hablemos");
        assert_eq!(t(Lang::En, "nav.cta"), "Let's talk");
        assert_eq!(t(Lang::En, "RAG"), "RAG");
    }
}
