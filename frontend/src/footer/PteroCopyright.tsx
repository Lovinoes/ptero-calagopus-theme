import classNames from 'classnames';
import { type RefObject, useLayoutEffect, useRef } from 'react';
// inside this file the path resolves to the stock component, see overrides.ts
import Copyright from '@/elements/Copyright.tsx';
import ExtensionSlot from '@/elements/ExtensionSlot.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { usePteroThemeActive } from '../core/scope.tsx';
import { usePteroThemeSettings } from '../settings/store.ts';
import { DEFAULT_FOOTER_TEXT, type FooterVariables, renderFooterText } from './footerText.tsx';

/**
 * The file manager and the editor fill the window down to its bottom edge. They leave this much room
 * for the footer (--ptero-footer-space, see styles/files.css), measured so it fits any text and the
 * extra "connected to" line, and 0 when the footer is hidden.
 */
function useFooterSpace(ref: RefObject<HTMLDivElement | null>, enabled: boolean) {
  useLayoutEffect(() => {
    const footer = ref.current?.parentElement;
    if (!enabled || !footer?.closest('#dashboard-root, #server-root')) return;

    const root = document.documentElement;
    const measure = () => {
      const style = getComputedStyle(footer);
      const height =
        style.display === 'none'
          ? 0
          : footer.getBoundingClientRect().height +
            Number.parseFloat(style.marginTop) +
            Number.parseFloat(style.marginBottom);
      root.style.setProperty('--ptero-footer-space', `${Math.ceil(height)}px`);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(footer);

    return () => observer.disconnect();
  }, [ref, enabled]);
}

/**
 * The copyright line of the panel (elements/Copyright.tsx) with the text an admin set in the theme
 * settings, see footerText.tsx. The admin area and a disabled theme get the stock one.
 */
export default function PteroCopyright({ className }: { className?: string }) {
  const { footerText } = usePteroThemeSettings();
  const app = useGlobalStore((state) => state.settings.app);
  const ref = useRef<HTMLDivElement>(null);

  const themed = usePteroThemeActive();
  useFooterSpace(ref, themed);

  if (!themed) {
    return <Copyright className={className} />;
  }

  const variables: FooterVariables = {
    app: app.name,
    url: app.url,
    year: String(new Date().getFullYear()),
  };
  const copyright = window.extensionContext.extensionRegistry.elements.copyright;

  return (
    <div
      ref={ref}
      data-ptero-copyright
      className={classNames('flex flex-col text-xs transition-all text-(--mantine-color-dimmed)', className)}
    >
      <ExtensionSlot components={copyright.prependedComponents} name='global-copyright-prepended' />

      <span>{renderFooterText(footerText.trim() || DEFAULT_FOOTER_TEXT, variables)}</span>

      <ExtensionSlot components={copyright.appendedComponents} name='global-copyright-appended' />
    </div>
  );
}
