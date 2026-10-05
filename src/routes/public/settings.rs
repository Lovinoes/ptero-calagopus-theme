use shared::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        #[schema(inline)]
        settings: &'a crate::settings::ExtensionSettingsData,
    }

    /// The theme settings for every visitor (the login pages too), nothing in them is secret.
    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState) -> ApiResponseResult {
        let settings = state.settings.get().await?;
        let extension_settings: &crate::settings::ExtensionSettingsData =
            settings.find_extension_settings()?;

        ApiResponse::new_serialized(Response {
            settings: extension_settings,
        })
        .ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
