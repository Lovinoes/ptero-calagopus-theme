import classNames from 'classnames';
import { type ReactNode, useLayoutEffect, useRef } from 'react';
import Copyright from '@/elements/Copyright.tsx';
import ExtensionSlot from '@/elements/ExtensionSlot.tsx';
import Anchor from '@/elements/typography/Anchor.tsx';
import { useGlobalStore } from '@/stores/global.ts';
import { usePteroThemeActive } from '../scope.tsx';
import { usePteroThemeSettings } from '../settings/store.ts';

/**
 * The copyright line of the panel (elements/Copyright.tsx) with the text an admin set in the theme
 * settings. Empty keeps the panel's own line. The admin area and a disabled theme get the stock one.
 *
 * Variables: {app} the panel name, {url} the panel URL, {year} the current year.
 * Links: [text](https://example.com), only http(s) addresses become links.
 */
const DEFAULT_FOOTER_TEXT = '[Calagopus](https://calagopus.com) © 2025 - {year}';
const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

type FooterVariables = Record<'app' | 'url' | 'year', string>;

const fillVariables = (text: string, variables: FooterVariables) =>
  text.replace(/\{(app|url|year)\}/g, (_, name: keyof FooterVariables) => variables[name]);

export function renderFooterText(template: string, variables: FooterVariables): ReactNode[] {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of template.matchAll(LINK_PATTERN)) {
    if (match.index > last) parts.push(fillVariables(template.slice(last, match.index), variables));

    const label = fillVariables(match[1], variables);
    const href = fillVariables(match[2], variables);
    parts.push(
      /^https?:\/\//i.test(href) ? (
        <Anchor key={match.index} href={href} target='_blank' rel='noopener noreferrer' inherit>
          {label}
        </Anchor>
      ) : (
        label
      ),
    );
    last = match.index + match[0].length;
  }

  if (last < template.length) parts.push(fillVariables(template.slice(last), variables));

  return parts;
}

/**
 * The file manager and the editor fill the window down to its bottom edge. They leave this much room
 * for the footer (app.css, --ptero-footer-space), measured so it fits any text and the extra
 * "connected to" line, and 0 when the footer is hidden.
 */
function useFooterSpace(ref: React.RefObject<HTMLDivElement | null>, enabled: boolean) {
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

  return (
    <div
      ref={ref}
      data-ptero-copyright
      className={classNames('flex flex-col text-xs transition-all text-(--mantine-color-dimmed)', className)}
    >
      <ExtensionSlot
        components={window.extensionContext.extensionRegistry.elements.copyright.prependedComponents}
        name='global-copyright-prepended'
      />

      <span>{renderFooterText(footerText.trim() || DEFAULT_FOOTER_TEXT, variables)}</span>

      <ExtensionSlot
        components={window.extensionContext.extensionRegistry.elements.copyright.appendedComponents}
        name='global-copyright-appended'
      />
    </div>
  );
}
