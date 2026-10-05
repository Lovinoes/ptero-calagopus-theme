use compact_str::ToCompactString;
use serde::{Deserialize, Serialize};
use shared::extensions::settings::{
    ExtensionSettings, SettingsDeserializeExt, SettingsDeserializer, SettingsSerializeExt,
    SettingsSerializer,
};
use utoipa::ToSchema;

pub const DEFAULT_LOADING_BAR_DELAY: u32 = 250;
pub const MAX_LOADING_BAR_DELAY: u32 = 10_000;
pub const MAX_FOOTER_TEXT_LENGTH: usize = 255;

/// How fast the theme animations (page fade, dialogs, tooltips) play.
#[derive(ToSchema, Serialize, Deserialize, Clone, Copy, Debug, Default, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AnimationSpeed {
    VerySlow,
    Slow,
    #[default]
    Normal,
    Fast,
    VeryFast,
}

/// Where the copyright footer goes on the themed pages.
#[derive(ToSchema, Serialize, Deserialize, Clone, Copy, Debug, Default, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum FooterPosition {
    /// at the bottom of the window, or below the content once the page is taller
    #[default]
    Bottom,
    /// right below the content, like Pterodactyl
    Content,
    Hidden,
}

#[derive(ToSchema, Serialize, Deserialize, Clone, Debug)]
pub struct ExtensionSettingsData {
    /// Pterodactyl's page fade, dialog and tooltip animations
    pub animations: bool,
    #[schema(inline)]
    pub animation_speed: AnimationSpeed,
    /// Pterodactyl's loading bar at the top of the page
    pub loading_bar: bool,
    /// How long loading has to take (ms) before the loading bar and the list spinners show up
    pub loading_bar_delay: u32,
    #[schema(inline)]
    pub footer_position: FooterPosition,
    /// Replaces the copyright line, empty keeps the panel's own one. Supports {app}, {url}, {year}
    /// and [links](https://example.com)
    pub footer_text: compact_str::CompactString,
}

impl Default for ExtensionSettingsData {
    fn default() -> Self {
        Self {
            animations: true,
            animation_speed: AnimationSpeed::Normal,
            loading_bar: true,
            loading_bar_delay: DEFAULT_LOADING_BAR_DELAY,
            footer_position: FooterPosition::Bottom,
            footer_text: compact_str::CompactString::default(),
        }
    }
}

#[async_trait::async_trait]
impl SettingsSerializeExt for ExtensionSettingsData {
    async fn serialize(
        &self,
        serializer: SettingsSerializer,
    ) -> Result<SettingsSerializer, anyhow::Error> {
        Ok(serializer
            .write_raw_setting("animations", self.animations.to_compact_string())
            .write_serde_setting("animation_speed", &self.animation_speed)?
            .write_raw_setting("loading_bar", self.loading_bar.to_compact_string())
            .write_raw_setting(
                "loading_bar_delay",
                self.loading_bar_delay.to_compact_string(),
            )
            .write_serde_setting("footer_position", &self.footer_position)?
            .write_raw_setting("footer_text", self.footer_text.clone()))
    }
}

pub struct ExtensionSettingsDataDeserializer;

#[async_trait::async_trait]
impl SettingsDeserializeExt for ExtensionSettingsDataDeserializer {
    async fn deserialize_boxed(
        &self,
        mut deserializer: SettingsDeserializer<'_>,
    ) -> Result<ExtensionSettings, anyhow::Error> {
        // the keys only exist once an admin saved the settings, so every value has a default
        let defaults = ExtensionSettingsData::default();

        Ok(Box::new(ExtensionSettingsData {
            animations: deserializer
                .take_raw_setting("animations")
                .and_then(|s| s.parse().ok())
                .unwrap_or(defaults.animations),
            animation_speed: deserializer
                .read_serde_setting("animation_speed")
                .unwrap_or(defaults.animation_speed),
            loading_bar: deserializer
                .take_raw_setting("loading_bar")
                .and_then(|s| s.parse().ok())
                .unwrap_or(defaults.loading_bar),
            loading_bar_delay: deserializer
                .take_raw_setting("loading_bar_delay")
                .and_then(|s| s.parse::<u32>().ok())
                .map(|delay| delay.min(MAX_LOADING_BAR_DELAY))
                .unwrap_or(defaults.loading_bar_delay),
            footer_position: deserializer
                .read_serde_setting("footer_position")
                .unwrap_or(defaults.footer_position),
            footer_text: deserializer
                .take_raw_setting("footer_text")
                .filter(|text| text.chars().count() <= MAX_FOOTER_TEXT_LENGTH)
                .unwrap_or(defaults.footer_text),
        }))
    }
}
