import type { ReactElement } from 'react';
import { Extension, ExtensionContext } from 'shared';
import Sidebar from '@/elements/navigation/Sidebar.tsx';
import { attachPteroMonacoTheme } from './editor/monacoTheme.ts';
import PteroSidebar, { PteroSidebarLinkGate } from './navigation/PteroSidebar.tsx';
import PteroScope, { applyPteroScope, installBootScope, removePteroScope } from './scope.tsx';

let initialized = false;

// The panel imports every extension module before it knows which ones are disabled, so the loading
// screen can be themed right away. If this extension turns out to be disabled, the panel creates its
// extension context without calling initialize() below, and the boot styling is removed again.
installBootScope();

const bootCheck = window.setInterval(() => {
  if (!window.extensionContext) return;

  window.clearInterval(bootCheck);
  if (!initialized) removePteroScope();
}, 25);

class DevLovinoesPterodactylExtension extends Extension {
  public cardConfigurationPage: React.FC | null = null;
  public cardComponent: React.FC | null = null;

  public initialize(ctx: ExtensionContext): void {
    initialized = true;

    // set the scope before React renders anything, so the first paint already has the right look
    applyPteroScope(window.location.pathname);

    ctx.extensionRegistry.enterGlobal((global) => global.prependComponent(PteroScope));

    // Pterodactyl's editor colors (ayu-mirage) for the file editor and diffs on the themed pages
    ctx.extensionRegistry.enterElements((elements) =>
      elements.enterMonacoEditor((monacoEditor) =>
        monacoEditor
          .addOnMountHandler((editor, monaco) => attachPteroMonacoTheme(editor, monaco))
          .addDiffOnMountHandler((editor, monaco) => attachPteroMonacoTheme(editor, monaco)),
      ),
    );

    Sidebar.addRenderInterceptor(
      (element, props) => (<PteroSidebar {...props} original={element} />) as ReactElement<typeof props>,
    );
    Sidebar.Link.addRenderInterceptor(
      (element, props) => (<PteroSidebarLinkGate original={element} linkProps={props} />) as ReactElement<typeof props>,
    );
  }
}

export default new DevLovinoesPterodactylExtension();
