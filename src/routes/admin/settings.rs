use shared::State;
use utoipa_axum::{router::OpenApiRouter, routes};

mod get {
    use serde::Serialize;
    use shared::{
        GetState,
        models::user::GetPermissionManager,
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Serialize)]
    struct Response<'a> {
        #[schema(inline)]
        settings: &'a crate::settings::ExtensionSettingsData,
    }

    #[utoipa::path(get, path = "/", responses(
        (status = OK, body = inline(Response)),
    ))]
    pub async fn route(state: GetState, permissions: GetPermissionManager) -> ApiResponseResult {
        permissions.has_admin_permission("extensions.read")?;

        let settings = state.settings.get().await?;
        let extension_settings: &crate::settings::ExtensionSettingsData =
            settings.find_extension_settings()?;

        ApiResponse::new_serialized(Response {
            settings: extension_settings,
        })
        .ok()
    }
}

mod put {
    use axum::http::StatusCode;
    use garde::Validate;
    use serde::{Deserialize, Serialize};
    use shared::{
        ApiError, GetState,
        models::{admin_activity::GetAdminActivityLogger, user::GetPermissionManager},
        response::{ApiResponse, ApiResponseResult},
    };
    use utoipa::ToSchema;

    #[derive(ToSchema, Validate, Deserialize)]
    pub struct Payload {
        #[garde(skip)]
        animations: Option<bool>,
        #[garde(skip)]
        #[schema(inline)]
        animation_speed: Option<crate::settings::AnimationSpeed>,

        #[garde(skip)]
        loading_bar: Option<bool>,
        #[garde(range(max = 10000))]
        #[schema(maximum = 10000)]
        loading_bar_delay: Option<u32>,

        #[garde(skip)]
        #[schema(inline)]
        footer_position: Option<crate::settings::FooterPosition>,
        #[garde(length(chars, max = 255))]
        #[schema(max_length = 255)]
        footer_text: Option<compact_str::CompactString>,
    }

    #[derive(ToSchema, Serialize)]
    struct Response {
        #[schema(inline)]
        settings: crate::settings::ExtensionSettingsData,
    }

    #[utoipa::path(put, path = "/", responses(
        (status = OK, body = inline(Response)),
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
        let extension_settings: &mut crate::settings::ExtensionSettingsData =
            settings.find_mut_extension_settings()?;

        if let Some(animations) = data.animations {
            extension_settings.animations = animations;
        }
        if let Some(animation_speed) = data.animation_speed {
            extension_settings.animation_speed = animation_speed;
        }
        if let Some(loading_bar) = data.loading_bar {
            extension_settings.loading_bar = loading_bar;
        }
        if let Some(loading_bar_delay) = data.loading_bar_delay {
            extension_settings.loading_bar_delay = loading_bar_delay;
        }
        if let Some(footer_position) = data.footer_position {
            extension_settings.footer_position = footer_position;
        }
        if let Some(footer_text) = data.footer_text {
            extension_settings.footer_text = footer_text;
        }

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

        ApiResponse::new_serialized(Response { settings: updated }).ok()
    }
}

pub fn router(state: &State) -> OpenApiRouter<State> {
    OpenApiRouter::new()
        .routes(routes!(get::route))
        .routes(routes!(put::route))
        .with_state(state.clone())
}
