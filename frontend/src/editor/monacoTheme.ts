import type { Monaco } from '@monaco-editor/react';
import { isPteroThemeActive } from '../scope.tsx';

/**
 * Pterodactyl edits files with CodeMirror and its "ayu-mirage" theme. This is that theme for Monaco,
 * the colors are taken from codemirror/theme/ayu-mirage.css.
 */
const THEME_NAME = 'ptero-ayu-mirage';

let themeDefined = false;

function defineTheme(monaco: Monaco) {
  if (themeDefined) return;

  monaco.editor.defineTheme(THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: '', foreground: 'cbccc6', background: '1f2430' },
      { token: 'comment', foreground: '5c6773', fontStyle: 'italic' },
      { token: 'string', foreground: 'bae67e' },
      { token: 'string.key', foreground: 'f29e74' },
      { token: 'string.key.json', foreground: 'f29e74' },
      { token: 'number', foreground: 'ffcc66' },
      { token: 'keyword', foreground: 'ffa759' },
      { token: 'type', foreground: 'ffa759' },
      { token: 'key', foreground: 'f29e74' },
      { token: 'variable', foreground: 'cbccc6' },
      { token: 'variable.predefined', foreground: 'f28779' },
      { token: 'constant', foreground: 'ae81ff' },
      { token: 'tag', foreground: '5ccfe6' },
      { token: 'metatag', foreground: '5ccfe6' },
      { token: 'attribute.name', foreground: 'ffd580' },
      { token: 'attribute.value', foreground: 'bae67e' },
      { token: 'delimiter', foreground: 'cbccc6' },
      { token: 'operator', foreground: 'cbccc6' },
      { token: 'delimiter.bracket', foreground: '5ccfe6' },
      { token: 'invalid', foreground: 'ff3333' },
    ],
    colors: {
      'editor.background': '#1f2430',
      'editor.foreground': '#cbccc6',
      'editorGutter.background': '#1f2430',
      'editorLineNumber.foreground': '#3d424d',
      'editorLineNumber.activeForeground': '#707a8c',
      'editorCursor.foreground': '#ffcc66',
      'editor.selectionBackground': '#34455a',
      'editor.inactiveSelectionBackground': '#34455a80',
      'editor.lineHighlightBackground': '#191e2a',
      'editor.lineHighlightBorder': '#191e2a',
      'editorBracketMatch.background': '#1f2430',
      'editorBracketMatch.border': '#ffffff',
      'minimap.background': '#1f2430',
    },
  });

  themeDefined = true;
}

/**
 * The panel sets Monaco's (global) theme to vs-dark / light whenever an editor mounts or the color
 * scheme changes. Pages styled by this theme switch to ayu-mirage in dark mode, everything else
 * (the admin area, light mode, a disabled theme) keeps the theme the panel chose.
 */
function syncTheme(monaco: Monaco) {
  if (!isPteroThemeActive()) return;
  if (document.documentElement.getAttribute('data-mantine-color-scheme') !== 'dark') return;

  defineTheme(monaco);
  monaco.editor.setTheme(THEME_NAME);
}

export function attachPteroMonacoTheme(editor: { onDidDispose(listener: () => void): unknown }, monaco: Monaco) {
  syncTheme(monaco);

  // the panel applies its own theme after a color scheme switch, so re-apply after it did
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const schedule = () => {
    for (const delay of [0, 150]) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        syncTheme(monaco);
      }, delay);
      timers.add(timer);
    }
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mantine-color-scheme'] });

  editor.onDidDispose(() => {
    observer.disconnect();
    for (const timer of timers) clearTimeout(timer);
  });
}
