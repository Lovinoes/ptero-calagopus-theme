use shared::{
    State,
    extensions::{Extension, ExtensionRouteBuilder},
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
        // visitor reads them from /api/auth/extensions/dev.lovinoes.pterodactyl/settings (the
        // login pages are themed as well)
        builder
            .add_admin_api_router(|routes| {
                routes.nest(
                    "/extensions/dev.lovinoes.pterodactyl",
                    routes::admin::router(&state),
                )
            })
            .add_auth_api_router(|routes| {
                routes.nest(
                    "/extensions/dev.lovinoes.pterodactyl",
                    routes::public::router(&state),
                )
            })
    }

    async fn settings_deserializer(
        &self,
        _state: State,
    ) -> shared::extensions::settings::ExtensionSettingsDeserializer {
        Arc::new(settings::ExtensionSettingsDataDeserializer)
    }
}
