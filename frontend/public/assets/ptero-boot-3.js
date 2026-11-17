// Paints the loading screen in the theme colors before the bundle runs (no gray flash on reload).
// assets/ is cached forever: bump the number in the name and in src/boot.html when changing this.
(() => {
  const { pathname } = window.location;
  const isWithin = (base) => pathname === base || pathname.startsWith(`${base}/`);

  if (isWithin('/admin') || isWithin('/oobe')) return;

  // palette from the page (src/lib.rs), else the last one this browser saw (settings/store.ts)
  let palette = null;
  try {
    const variables = JSON.parse(document.getElementById('extension-variables')?.textContent || '{}');
    palette = variables['dev.lovinoes.pterodactyl']?.settings?.color_palette ?? null;
  } catch {}

  // the scheme Mantine will pick, dark by default
  let scheme = null;
  try {
    scheme = localStorage.getItem('mantine-color-scheme-value');
    palette ??= JSON.parse(localStorage.getItem('ptero-theme-settings') ?? '{}')?.colorPalette ?? null;
  } catch {}

  const light = scheme === 'light' || (scheme === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
  // page color (--ptero-gray-800) and spinner color of each palette, see styles/tokens.css
  const [page, primary] = light
    ? ['hsl(214, 20%, 93%)', '#3b82f6']
    : palette === 'darker'
      ? ['oklch(0.195 0.012 264)', '#2563eb']
      : palette === 'shadcn'
        ? ['oklch(0.145 0 0)', 'oklch(0.708 0 0)']
        : ['hsl(209, 20%, 25%)', '#3b82f6'];
  const style = document.createElement('style');

  style.id = 'ptero-theme-boot';
  style.textContent = [
    `html[data-ptero-theme]{background-color:var(--mantine-color-body,${page})}`,
    `html[data-ptero-theme]:not([data-mantine-color-scheme]) .spinner{--loader-color:${primary}}`,
  ].join('\n');
  document.head.appendChild(style);
  document.documentElement.setAttribute('data-ptero-theme', '');
})();
