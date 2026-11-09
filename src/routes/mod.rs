use serde::Serialize;
use shared::response::{ApiResponse, ApiResponseResult};
use utoipa::ToSchema;

use crate::settings::ExtensionSettingsData;

pub mod admin;
pub mod public;

/// The body of every settings route.
#[derive(ToSchema, Serialize)]
pub struct SettingsResponse<'a> {
    #[schema(inline)]
    settings: &'a ExtensionSettingsData,
}

impl<'a> SettingsResponse<'a> {
    pub fn respond(settings: &'a ExtensionSettingsData) -> ApiResponseResult {
        ApiResponse::new_serialized(Self { settings }).ok()
    }
}

/// The current theme settings, the defaults until an admin saved them.
pub async fn current_settings(state: &shared::State) -> ApiResponseResult {
    let settings = state.settings.get().await?;
    let extension_settings: &ExtensionSettingsData = settings.find_extension_settings()?;

    SettingsResponse::respond(extension_settings)
}
