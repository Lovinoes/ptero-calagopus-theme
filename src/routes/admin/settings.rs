use shared::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use shared::{GetState, models::user::GetPermissionManager, response::ApiResponseResult};

    use crate::routes::SettingsResponse;

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(SettingsResponse)),
    ))]
    pub async fn route(state: GetState, permissions: GetPermissionManager) -> ApiResponseResult {
        permissions.has_admin_permission("extensions.read")?;

        crate::routes::current_settings(&state).await
    }
}

mod put {
    use axum::http::StatusCode;
    use garde::Validate;
    use serde::Deserialize;
    use shared::{
        ApiError, GetState,
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    use crate::{
        routes::SettingsResponse,
        settings::{
            AnimationSpeed, AuthHeader, ColorPalette, ExtensionSettingsData, FooterPosition,
            MAX_FOOTER_TEXT_LENGTH, MAX_LOADING_BAR_DELAY,
        },
    };

    // the attributes below need the limits as literals, these keep them in step with the constants
    const _: () = assert!(MAX_LOADING_BAR_DELAY == 10_000);
    const _: () = assert!(MAX_FOOTER_TEXT_LENGTH == 255);

    /// Only the given settings change, the others keep their value.
    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[garde(skip)]
        animations: Option<bool>,
        #[garde(skip)]
        #[schema(inline)]
        animation_speed: Option<AnimationSpeed>,

        #[garde(skip)]
        loading_bar: Option<bool>,
        #[garde(range(max = 10000))]
        #[schema(maximum = 10000)]
        loading_bar_delay: Option<u32>,

        #[garde(skip)]
        #[schema(inline)]
        footer_position: Option<FooterPosition>,
        #[garde(length(chars, max = 255))]
        #[schema(max_length = 255)]
        footer_text: Option<compact_str::CompactString>,

        #[garde(skip)]
        #[schema(inline)]
        auth_header: Option<AuthHeader>,

        #[garde(skip)]
        #[schema(inline)]
        color_palette: Option<ColorPalette>,
    }

    impl Payload {
        fn apply_to(self, settings: &mut ExtensionSettingsData) {
            if let Some(animations) = self.animations {
                settings.animations = animations;
            }
            if let Some(animation_speed) = self.animation_speed {
                settings.animation_speed = animation_speed;
            }
            if let Some(loading_bar) = self.loading_bar {
                settings.loading_bar = loading_bar;
            }
            if let Some(loading_bar_delay) = self.loading_bar_delay {
                settings.loading_bar_delay = loading_bar_delay;
            }
            if let Some(footer_position) = self.footer_position {
                settings.footer_position = footer_position;
            }
            if let Some(footer_text) = self.footer_text {
                settings.footer_text = footer_text;
            }
            if let Some(auth_header) = self.auth_header {
                settings.auth_header = auth_header;
            }
            if let Some(color_palette) = self.color_palette {
                settings.color_palette = color_palette;
            }
        }
    }

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(SettingsResponse)),
        (status = BAD_REQUEST, body = ApiError),
    ), request_body = inline(Payload))]
    pub async fn route(
        state: GetState,
        permissions: GetPermissionManager,
        activity_logger: GetAdminActivityLogger,
        shared::Payload(data): shared::Payload<Payload>,
    ) -> ApiResponseResult {
        if let Err(errors) = shared::utils::validate_data(&data) {
            return ApiResponse::new_serialized(ApiError::new_strings_value(errors))
                .with_status(StatusCode::BAD_REQUEST)
                .ok();
        }

        permissions.has_admin_permission("extensions.manage")?;

        let mut settings = state.settings.get_mut().await?;
        let extension_settings: &mut ExtensionSettingsData =
            settings.find_mut_extension_settings()?;

        data.apply_to(extension_settings);

        let updated = extension_settings.clone();
        settings.save().await?;

        activity_logger
            .log(
                "settings:extensions:update",
                serde_json::json!({
                    "extension": crate::PACKAGE_NAME,
                    "settings": updated,
                }),
            )
            .await;

        SettingsResponse::respond(&updated)
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
