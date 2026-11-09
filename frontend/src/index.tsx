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

/**
 * The Pterodactyl theme. The panel only calls initialize() while the extension is enabled, and from
 * Calagopus 1.2.8 it leaves out the boot script (boot.html) and the stylesheet of a disabled extension,
 * so nothing of the theme runs or shows then.
 */
class DevLovinoesPterodactylExtension extends Extension {
  // admin area -> Extensions -> Pterodactyl Theme: colors, animations, loading, footer and the login pages
  public cardConfigurationPage: React.FC | null = ConfigurationPage;
  public cardComponent: React.FC | null = null;

  public initialize(ctx: ExtensionContext): void {
    // the scope before React renders anything, so the first paint already has the right look
    applyPteroScope(window.location.pathname);

    // the settings the backend rendered into the page (see initialize_index_html in src/lib.rs)
    loadPteroThemeSettings(this.getIndexVariable('settings'));

    ctx.extensionRegistry.enterGlobal((global) =>
      global.prependComponent(PteroScope).prependComponent(PteroProgressBar).prependComponent(PteroPageTransitions),
    );

    // switching between the tabs of a page doesn't replay the page fade
    trackTabNavigation();

    // Pterodactyl's loading bar follows the API requests, not the refreshes when a tab is shown again
    trackBackgroundRefreshes();
    trackRequests(axiosInstance);

    // Pterodactyl's dialog and tooltip animations, on the themed pages only and only where a dialog or
    // tooltip sets none itself, so they follow the animation settings as well
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

    // Pterodactyl's editor colors (ayu-mirage) for the file editor and diffs on the themed pages
    ctx.extensionRegistry.enterElements((elements) =>
      elements.enterMonacoEditor((monacoEditor) =>
        monacoEditor
          .addOnMountHandler((editor, monaco) => attachPteroMonacoTheme(editor, monaco))
          .addDiffOnMountHandler((editor, monaco) => attachPteroMonacoTheme(editor, monaco)),
      ),
    );

    // what sits above the login pages (icon, name, banner or nothing) is a theme setting
    AppIcon.addRenderInterceptor(
      (element, props) =>
        (<PteroAuthHeader original={element} className={props.className} />) as ReactElement<typeof props>,
    );

    // the top navigation bar and the sub navigation in place of the sidebar
    Sidebar.addRenderInterceptor(
      (element, props) => (<PteroSidebar {...props} original={element} />) as ReactElement<typeof props>,
    );
    Sidebar.Link.addRenderInterceptor(
      (element, props) => (<PteroSidebarLinkGate original={element} linkProps={props} />) as ReactElement<typeof props>,
    );
  }

  // what other extensions can ask the theme (navigation bar icons, its settings), see EXTENSIONS.md
  public processCall(ctx: ExtensionContext, name: string, args: object): unknown {
    return handlePteroCall(ctx, name, args);
  }
}

export default new DevLovinoesPterodactylExtension();
