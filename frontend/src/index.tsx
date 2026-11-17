import type { ReactElement } from 'react';
import { Extension, type ExtensionContext } from 'shared';
import { axiosInstance } from '@/api/axios.ts';
import AppIcon from '@/elements/AppIcon.tsx';
import { Modal } from '@/elements/modals/Modal.tsx';
import Sidebar from '@/elements/navigation/Sidebar.tsx';
import Tooltip from '@/elements/overlays/Tooltip.tsx';
import PteroAuthHeader from './auth/PteroAuthHeader.tsx';
import PteroScope, { applyPteroScope, isPteroThemeActive } from './core/scope.tsx';
import { attachPteroMonacoTheme } from './editor/monacoTheme.ts';
import { handlePteroCall } from './extensionApi/calls.ts';
import { getPteroDialogTransition, getPteroTooltipTransition } from './loading/animations.ts';
import { trackBackgroundRefreshes } from './loading/backgroundRefresh.ts';
import PteroPageTransitions, { trackTabNavigation } from './loading/PteroPageTransitions.tsx';
import PteroProgressBar, { trackRequests } from './loading/PteroProgressBar.tsx';
import PteroSidebar, { PteroSidebarLinkGate } from './navigation/PteroSidebar.tsx';
import ConfigurationPage from './settings/ConfigurationPage.tsx';
import { loadPteroThemeSettings } from './settings/store.ts';

/** The theme. The panel skips initialize(), boot.html and the CSS of a disabled extension. */
class DevLovinoesPterodactylExtension extends Extension {
  public cardConfigurationPage: React.FC | null = ConfigurationPage;
  public cardComponent: React.FC | null = null;

  public initialize(ctx: ExtensionContext): void {
    // before React renders, so the first paint is already themed
    applyPteroScope(window.location.pathname);

    // rendered into the page by initialize_index_html in src/lib.rs
    loadPteroThemeSettings(this.getIndexVariable('settings'));

    ctx.extensionRegistry.enterGlobal((global) =>
      global.prependComponent(PteroScope).prependComponent(PteroProgressBar).prependComponent(PteroPageTransitions),
    );

    // tab switches keep the page up instead of replaying the fade
    trackTabNavigation();

    // background refreshes don't count for the loading bar
    trackBackgroundRefreshes();
    trackRequests(axiosInstance);

    // Pterodactyl's dialog and tooltip animations, unless one sets its own
    Modal.addPropsInterceptor((props) =>
      props.transitionProps === undefined && isPteroThemeActive()
        ? { ...props, transitionProps: getPteroDialogTransition() }
        : props,
    );
    Tooltip.addPropsInterceptor((props) =>
      props.transitionProps === undefined && isPteroThemeActive()
        ? { ...props, transitionProps: getPteroTooltipTransition() }
        : props,
    );

    ctx.extensionRegistry.enterElements((elements) =>
      elements.enterMonacoEditor((monacoEditor) =>
        monacoEditor
          .addOnMountHandler((editor, monaco) => attachPteroMonacoTheme(editor, monaco))
          .addDiffOnMountHandler((editor, monaco) => attachPteroMonacoTheme(editor, monaco)),
      ),
    );

    AppIcon.addRenderInterceptor(
      (element, props) =>
        (<PteroAuthHeader original={element} className={props.className} />) as ReactElement<typeof props>,
    );

    // top navigation bar and sub navigation instead of the sidebar
    Sidebar.addRenderInterceptor(
      (element, props) => (<PteroSidebar {...props} original={element} />) as ReactElement<typeof props>,
    );
    Sidebar.Link.addRenderInterceptor(
      (element, props) => (<PteroSidebarLinkGate original={element} linkProps={props} />) as ReactElement<typeof props>,
    );
  }

  // calls from other extensions, see EXTENSIONS.md
  public processCall(ctx: ExtensionContext, name: string, args: object): unknown {
    return handlePteroCall(ctx, name, args);
  }
}

export default new DevLovinoesPterodactylExtension();
