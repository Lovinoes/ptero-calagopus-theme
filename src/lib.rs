use shared::{
    State,
    extensions::{Extension, ExtensionRouteBuilder, index_html::IndexHtmlBuilder},
};
use std::sync::Arc;

mod routes;
mod settings;

pub const PACKAGE_NAME: &str = "dev.lovinoes.pterodactyl";

#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::debug!("pterodactyl theme extension loaded");
    }

    async fn initialize_router(
        &mut self,
        state: State,
        builder: ExtensionRouteBuilder,
    ) -> ExtensionRouteBuilder {
        // admin form: /api/admin/..., everyone (login pages, other extensions): /api/auth/...
        let base = format!("/extensions/{PACKAGE_NAME}");

        builder
            .add_admin_api_router(|routes| routes.nest(&base, routes::admin::router(&state)))
            .add_auth_api_router(|routes| routes.nest(&base, routes::public::router(&state)))
    }

    async fn initialize_index_html(
        &mut self,
        _state: State,
        builder: IndexHtmlBuilder,
    ) -> IndexHtmlBuilder {
        // rendered into every page so the frontend and the boot script have them before the first paint;
        // nothing in them is secret
        builder.add_variable("settings", |app_settings| {
            let settings: &settings::ExtensionSettingsData =
                app_settings.find_extension_settings()?;

            Ok(serde_json::to_value(settings)?)
        });

        builder
    }

    async fn settings_deserializer(
        &self,
        _state: State,
    ) -> shared::extensions::settings::ExtensionSettingsDeserializer {
        Arc::new(settings::ExtensionSettingsDataDeserializer)
    }
}
