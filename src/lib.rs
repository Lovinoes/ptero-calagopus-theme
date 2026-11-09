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
        // the admin form uses /api/admin/extensions/dev.lovinoes.pterodactyl/settings, every
        // visitor (and other extensions) can read them from
        // /api/auth/extensions/dev.lovinoes.pterodactyl/settings, the login pages are themed as well
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
        // The settings rendered into every page, so the frontend (and the boot screen, see
        // frontend/public/assets/ptero-boot-2.js) has them before its first paint. The same shape as
        // the `settings` of the settings routes. Nothing in them is secret.
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
