//! Service catalog shared by the cards, the detail modal and the contact form.

pub struct Service {
    /// URL slug for `/{lang}/partials/service/{slug}`.
    pub slug: &'static str,
    /// i18n prefix: `svc.{key}.t`, `.d`, `.x1..x3`.
    pub key: &'static str,
    /// Value submitted by the contact form `<select name="service">`.
    pub form_value: &'static str,
}

pub const SERVICES: &[Service] = &[
    Service {
        slug: "ai-integration",
        key: "ai",
        form_value: "ai",
    },
    Service {
        slug: "software-development",
        key: "dev",
        form_value: "dev",
    },
    Service {
        slug: "deployment",
        key: "dep",
        form_value: "deploy",
    },
    Service {
        slug: "digital-transformation",
        key: "dx",
        form_value: "dx",
    },
    Service {
        slug: "marketing",
        key: "mkt",
        form_value: "marketing",
    },
    Service {
        slug: "cloud",
        key: "cloud",
        form_value: "cloud",
    },
];

pub const SECTORS: &[(&str, &str)] = &[
    ("education", "sec.edu.t"),
    ("public", "sec.gov.t"),
    ("private", "sec.priv.t"),
    ("smb", "sec.smb.t"),
];

pub fn by_slug(slug: &str) -> Option<&'static Service> {
    SERVICES.iter().find(|s| s.slug == slug)
}

pub fn by_key(key: &str) -> &'static Service {
    SERVICES
        .iter()
        .find(|s| s.key == key)
        .expect("unknown service key in template")
}

impl Service {
    pub fn title_key(&self) -> String {
        format!("svc.{}.t", self.key)
    }
    pub fn desc_key(&self) -> String {
        format!("svc.{}.d", self.key)
    }
    pub fn item_keys(&self) -> [String; 3] {
        [1, 2, 3].map(|i| format!("svc.{}.x{i}", self.key))
    }
}
