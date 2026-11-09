import type { ReactNode } from 'react';
import Anchor from '@/elements/typography/Anchor.tsx';

/**
 * The footer text an admin can set in the theme settings, the panel's own line when it is empty.
 *
 * Variables: {app} the panel name, {url} the panel URL, {year} the current year.
 * Links: [text](https://example.com), only http(s) addresses become links.
 */
export const DEFAULT_FOOTER_TEXT = '[Calagopus](https://calagopus.com) © 2025 - {year}';

export type FooterVariables = Record<'app' | 'url' | 'year', string>;

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;
const VARIABLE_PATTERN = /\{(app|url|year)\}/g;

const fillVariables = (text: string, variables: FooterVariables) =>
  text.replace(VARIABLE_PATTERN, (_, name: keyof FooterVariables) => variables[name]);

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
