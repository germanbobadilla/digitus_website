//! Digitus marketing site: Axum + Askama + HTMX, deployed to AWS Lambda.

pub mod contact;
pub mod i18n;
pub mod lang;
pub mod services;
pub mod web;

pub use web::{AppState, router};
