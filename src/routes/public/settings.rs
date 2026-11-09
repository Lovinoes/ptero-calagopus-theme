use shared::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use shared::{GetState, response::ApiResponseResult};

    use crate::routes::SettingsResponse;

    /// The theme settings for every visitor (the login pages too), nothing in them is secret.
    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(SettingsResponse)),
    ))]
    pub async fn route(state: GetState) -> ApiResponseResult {
        crate::routes::current_settings(&state).await
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .with_state(state.clone())
}
