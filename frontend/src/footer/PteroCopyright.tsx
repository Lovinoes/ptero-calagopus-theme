import classNames from 'classnames';
import { type RefObject, useLayoutEffect, useRef } from 'react';
// the stock one here, see overrides.ts
import Copyright from '@/elements/Copyright.tsx';
import ExtensionSlot from '@/elements/ExtensionSlot.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { usePteroThemeActive } from '../core/scope.tsx';
import { usePteroThemeSettings } from '../settings/store.ts';
import { DEFAULT_FOOTER_TEXT, type FooterVariables, renderFooterText } from './footerText.tsx';

/** Room the full-height file manager and editor leave for the footer (--ptero-footer-space), 0 when hidden. */
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

/** The panel's copyright line with the admin's footer text, the stock one off the themed pages. */
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
