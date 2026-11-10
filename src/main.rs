use digitus::{
    AppState,
    contact::{LogMailer, Mailer, SesMailer},
    router,
};
use std::{env, sync::Arc};
use tower_http::{compression::CompressionLayer, services::ServeDir, trace::TraceLayer};
use tracing_subscriber::EnvFilter;

#[tokio::main]
async fn main() -> Result<(), lambda_http::Error> {
    let on_lambda = env::var_os("AWS_LAMBDA_RUNTIME_API").is_some();

    let filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info,digitus=debug"));
    if on_lambda {
        tracing_subscriber::fmt()
            .json()
            .with_env_filter(filter)
            .without_time()
            .init();
    } else {
        tracing_subscriber::fmt().with_env_filter(filter).init();
    }

    let mailer: Arc<dyn Mailer> = match env::var("CONTACT_FROM").ok().filter(|s| !s.is_empty()) {
        Some(from) => {
            let conf = aws_config::load_from_env().await;
            let to = env::var("CONTACT_TO").unwrap_or_else(|_| "info@digitus.do".into());
            tracing::info!(%from, %to, "contact form -> SES");
            Arc::new(SesMailer {
                client: aws_sdk_sesv2::Client::new(&conf),
                from,
                to,
            })
        }
        None => {
            tracing::warn!("CONTACT_FROM not set: contact form messages are only logged");
            Arc::new(LogMailer)
        }
    };

    let state = AppState {
        mailer,
        site_url: env::var("SITE_URL")
            .unwrap_or_else(|_| "http://localhost:3000".into())
            .trim_end_matches('/')
            .into(),
        asset_version: env::var("ASSET_VERSION")
            .unwrap_or_else(|_| {
                // Locally: fresh per start so browsers pick up CSS/JS edits.
                let t = std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap_or_default();
                format!("dev{}", t.as_secs())
            })
            .into(),
        origin_secret: env::var("ORIGIN_VERIFY_SECRET")
            .ok()
            .filter(|s| !s.is_empty())
            .map(Into::into),
    };

    if on_lambda {
        // CloudFront serves /static/* from S3; the function only renders HTML.
        lambda_http::run(router(state)).await
    } else {
        let app = router(state)
            .nest_service("/static", ServeDir::new("static"))
            .layer(CompressionLayer::new())
            .layer(TraceLayer::new_for_http());
        let port = env::var("PORT").unwrap_or_else(|_| "3000".into());
        let listener = tokio::net::TcpListener::bind(format!("127.0.0.1:{port}")).await?;
        tracing::info!("listening on http://127.0.0.1:{port}");
        axum::serve(listener, app).await?;
        Ok(())
    }
}
