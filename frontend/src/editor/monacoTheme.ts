import type { Monaco } from '@/lib/editor/monacoLoader.ts';
import { isPteroThemeActive } from '../core/scope.tsx';
import { getPteroThemeSettings } from '../settings/store.ts';

/** Pterodactyl's CodeMirror ayu-mirage theme for Monaco (colors from ayu-mirage.css). */
const THEME_NAME = 'ptero-ayu-mirage';
/** The shadcn palette: VS Code's dark syntax colors on shadcn's neutral grays (styles/tokens.css). */
const SHADCN_THEME_NAME = 'ptero-shadcn';

// the panel re-applies its theme after a scheme switch, ours goes on again after it
const RESYNC_DELAYS = [0, 150];

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

  monaco.editor.defineTheme(SHADCN_THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#171717',
      'editor.foreground': '#d4d4d4',
      'editorGutter.background': '#171717',
      'editorLineNumber.foreground': '#525252',
      'editorLineNumber.activeForeground': '#a1a1a1',
      'editorCursor.foreground': '#e5e5e5',
      'editor.selectionBackground': '#404040',
      'editor.inactiveSelectionBackground': '#40404080',
      'editor.lineHighlightBackground': '#1f1f1f',
      'editor.lineHighlightBorder': '#1f1f1f',
      'editorIndentGuide.background1': '#262626',
      'editorWidget.background': '#171717',
      'editorWidget.border': '#ffffff1a',
      'minimap.background': '#171717',
    },
  });

  themeDefined = true;
}

/** The panel resets Monaco's global theme on mount and scheme change, themed dark pages get ours. */
function syncTheme(monaco: Monaco) {
  if (!isPteroThemeActive()) return;
  if (document.documentElement.getAttribute('data-mantine-color-scheme') !== 'dark') return;

  defineTheme(monaco);
  monaco.editor.setTheme(getPteroThemeSettings().colorPalette === 'shadcn' ? SHADCN_THEME_NAME : THEME_NAME);
}

export function attachPteroMonacoTheme(editor: { onDidDispose(listener: () => void): unknown }, monaco: Monaco) {
  syncTheme(monaco);

  const timers = new Set<ReturnType<typeof setTimeout>>();
  const resync = () => {
    for (const delay of RESYNC_DELAYS) {
      const timer = setTimeout(() => {
        timers.delete(timer);
        syncTheme(monaco);
      }, delay);
      timers.add(timer);
    }
  };

  const observer = new MutationObserver(resync);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-mantine-color-scheme'] });

  editor.onDidDispose(() => {
    observer.disconnect();
    for (const timer of timers) clearTimeout(timer);
  });
}
