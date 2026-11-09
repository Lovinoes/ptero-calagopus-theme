// Paints the loading screen in the theme colors before the panel's bundle runs, so a reload doesn't show
// the stock gray first. The panel loads this through src/boot.html, only while the theme is enabled. The
// admin area and the first-time setup stay stock.
//
// A file in assets/ is cached forever: change its number in the name and in src/boot.html when changing it.
(() => {
  const { pathname } = window.location;
  const isWithin = (base) => pathname === base || pathname.startsWith(`${base}/`);

  if (isWithin('/admin') || isWithin('/oobe')) return;

  // the palette the backend rendered into the page (initialize_index_html in src/lib.rs), the one this
  // browser last used without it (settings/store.ts keeps it under the same key)
  let palette = null;
  try {
    const variables = JSON.parse(document.getElementById('extension-variables')?.textContent || '{}');
    palette = variables['dev.lovinoes.pterodactyl']?.settings?.color_palette ?? null;
  } catch {
    // no variables, the cache below decides
  }

  // the color scheme Mantine will pick: the stored choice, or the panel default (dark)
  let scheme = null;
  try {
    scheme = localStorage.getItem('mantine-color-scheme-value');
    palette ??= JSON.parse(localStorage.getItem('ptero-theme-settings') ?? '{}')?.colorPalette ?? null;
  } catch {
    // no storage or no cache yet, the panel starts dark and the default palette is used
  }

  const light = scheme === 'light' || (scheme === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
  const darker = palette === 'darker';
  // the page color of the scheme and palette (--ptero-gray-800, see styles/tokens.css)
  const page = light ? 'hsl(214, 20%, 93%)' : darker ? 'oklch(0.195 0.012 264)' : 'hsl(209, 20%, 25%)';
  // the spinner is drawn in the primary color, the blue of the palette (blue-500, blue-600 in the darker one)
  const primary = darker && !light ? '#2563eb' : '#3b82f6';
  const style = document.createElement('style');

  style.id = 'ptero-theme-boot';
  style.textContent = [
    `html[data-ptero-theme]{background-color:var(--mantine-color-body,${page})}`,
    `html[data-ptero-theme]:not([data-mantine-color-scheme]) .spinner{--loader-color:${primary}}`,
  ].join('\n');
  document.head.appendChild(style);
  document.documentElement.setAttribute('data-ptero-theme', '');
})();
