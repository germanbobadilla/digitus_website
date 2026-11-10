//! Contact form: validation and delivery (Amazon SES v2).

use crate::{
    i18n::Lang,
    services::{SECTORS, SERVICES},
};
use serde::Deserialize;
use std::{future::Future, pin::Pin};

#[derive(Debug, Default, Clone, Deserialize)]
#[serde(default)]
pub struct ContactInput {
    pub name: String,
    pub email: String,
    pub org: String,
    pub sector: String,
    pub service: String,
    pub message: String,
    pub lang: String,
    /// Honeypot: hidden from humans; bots fill it in.
    pub website: String,
}

#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct FieldErrors {
    pub name: bool,
    pub email: bool,
    pub message: bool,
}

impl FieldErrors {
    pub fn any(&self) -> bool {
        self.name || self.email || self.message
    }
}

pub const MAX_NAME: usize = 120;
pub const MAX_EMAIL: usize = 254;
pub const MAX_ORG: usize = 160;
pub const MAX_MESSAGE: usize = 5000;

impl ContactInput {
    /// Trims fields, clamps lengths and normalizes select values to known options.
    pub fn normalize(mut self) -> Self {
        fn clean(s: &str, max: usize) -> String {
            s.trim()
                .chars()
                .filter(|c| !c.is_control() || *c == '\n')
                .take(max)
                .collect()
        }
        self.name = clean(&self.name, MAX_NAME).replace('\n', " ");
        self.email = clean(&self.email, MAX_EMAIL).replace('\n', "");
        self.org = clean(&self.org, MAX_ORG).replace('\n', " ");
        self.message = clean(&self.message, MAX_MESSAGE);
        if !SECTORS.iter().any(|(v, _)| *v == self.sector) {
            self.sector = SECTORS[0].0.to_string();
        }
        if !SERVICES.iter().any(|s| s.form_value == self.service) {
            self.service = SERVICES[0].form_value.to_string();
        }
        self
    }

    pub fn validate(&self) -> FieldErrors {
        FieldErrors {
            name: self.name.is_empty(),
            email: !looks_like_email(&self.email),
            message: self.message.chars().count() < 5,
        }
    }

    pub fn is_spam(&self) -> bool {
        !self.website.trim().is_empty()
    }

    pub fn lang(&self) -> Lang {
        Lang::parse(&self.lang).unwrap_or(Lang::Es)
    }
}

fn looks_like_email(s: &str) -> bool {
    let Some((local, domain)) = s.split_once('@') else {
        return false;
    };
    !local.is_empty()
        && domain.contains('.')
        && !domain.starts_with('.')
        && !domain.ends_with('.')
        && !s.contains(char::is_whitespace)
        && !domain.contains('@')
}

pub struct Email {
    pub reply_to: String,
    pub subject: String,
    pub body: String,
}

impl Email {
    pub fn from_input(c: &ContactInput) -> Self {
        let subject = format!("[digitus.do] {} — {}", c.name, c.service);
        let body = format!(
            "Nombre / Name: {}\nCorreo / Email: {}\nOrganización / Org: {}\nSector: {}\nServicio / Service: {}\nIdioma / Lang: {}\n\n{}\n",
            c.name,
            c.email,
            if c.org.is_empty() { "—" } else { &c.org },
            c.sector,
            c.service,
            c.lang(),
            c.message
        );
        Email {
            reply_to: c.email.clone(),
            subject,
            body,
        }
    }
}

pub type SendFuture<'a> = Pin<Box<dyn Future<Output = Result<(), String>> + Send + 'a>>;

pub trait Mailer: Send + Sync {
    fn send(&self, email: Email) -> SendFuture<'_>;
}

/// Sends through Amazon SES v2. `from` must be a verified SES identity.
pub struct SesMailer {
    pub client: aws_sdk_sesv2::Client,
    pub from: String,
    pub to: String,
}

impl Mailer for SesMailer {
    fn send(&self, email: Email) -> SendFuture<'_> {
        use aws_sdk_sesv2::types::{Body, Content, Destination, EmailContent, Message};
        Box::pin(async move {
            let content = |s: String| {
                Content::builder()
                    .data(s)
                    .charset("UTF-8")
                    .build()
                    .map_err(|e| e.to_string())
            };
            let message = Message::builder()
                .subject(content(email.subject)?)
                .body(Body::builder().text(content(email.body)?).build())
                .build();
            self.client
                .send_email()
                .from_email_address(&self.from)
                .destination(Destination::builder().to_addresses(&self.to).build())
                .reply_to_addresses(email.reply_to)
                .content(EmailContent::builder().simple(message).build())
                .send()
                .await
                .map(|_| ())
                .map_err(|e| format!("{e:?}"))
        })
    }
}

/// Local development: logs the message instead of sending it.
pub struct LogMailer;

impl Mailer for LogMailer {
    fn send(&self, email: Email) -> SendFuture<'_> {
        Box::pin(async move {
            tracing::info!(subject = %email.subject, reply_to = %email.reply_to, "contact (not sent: LogMailer)\n{}", email.body);
            Ok(())
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn input(name: &str, email: &str, msg: &str) -> ContactInput {
        ContactInput {
            name: name.into(),
            email: email.into(),
            message: msg.into(),
            ..Default::default()
        }
        .normalize()
    }

    #[test]
    fn valid_input_passes() {
        assert!(
            !input("Ana", "ana@example.com", "Necesitamos un chatbot")
                .validate()
                .any()
        );
    }

    #[test]
    fn flags_each_field() {
        let e = input("  ", "nope", "hi").validate();
        assert_eq!(
            e,
            FieldErrors {
                name: true,
                email: true,
                message: true
            }
        );
        assert!(input("A", "a@b", "hello there").validate().email);
        assert!(input("A", "a b@c.com", "hello there").validate().email);
    }

    #[test]
    fn normalizes_selects_and_lengths() {
        let c = ContactInput {
            sector: "evil".into(),
            service: "<script>".into(),
            name: "x".repeat(500),
            ..Default::default()
        }
        .normalize();
        assert_eq!(c.sector, "education");
        assert_eq!(c.service, "ai");
        assert_eq!(c.name.chars().count(), MAX_NAME);
    }

    #[test]
    fn header_injection_stripped() {
        let c = input(
            "Ana\r\nBcc: x@y.com",
            "a@b.com\r\nBcc: x@y.com",
            "hello there",
        );
        assert!(!c.name.contains('\n') && !c.name.contains('\r'));
        assert!(!c.email.contains('\n'));
    }

    #[test]
    fn honeypot() {
        let c = ContactInput {
            website: "http://spam".into(),
            ..Default::default()
        };
        assert!(c.is_spam());
    }
}
