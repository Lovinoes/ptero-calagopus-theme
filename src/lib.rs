use shared::{State, extensions::Extension};

// This extension is frontend-only, the backend part only exists because every extension needs one.
#[derive(Default)]
pub struct ExtensionStruct;

#[async_trait::async_trait]
impl Extension for ExtensionStruct {
    async fn initialize(&mut self, _state: State) {
        tracing::debug!("pterodactyl theme extension loaded");
    }
}
