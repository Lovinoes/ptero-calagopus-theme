// Paints the loading screen in the theme colors before the panel's bundle runs, so a reload doesn't show
// the stock gray first. Calagopus 1.2.8 loads this through src/boot.html. The admin area and the first-time
// setup stay stock. A file in assets/ is cached forever: change its number in the name and in src/boot.html
// when changing it, and keep it the same as installBootScope in src/scope.tsx.
(() => {
  const { pathname } = window.location;
  const isWithin = (base) => pathname === base || pathname.startsWith(`${base}/`);

  if (isWithin('/admin') || isWithin('/oobe')) return;

  let scheme = null;
  let palette = null;
  try {
    scheme = localStorage.getItem('mantine-color-scheme-value');
    palette = JSON.parse(localStorage.getItem('ptero-theme-settings') ?? '{}')?.colorPalette;
  } catch {
    // no storage or no cache yet, the panel starts dark and the default palette is used
  }

  const light = scheme === 'light' || (scheme === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches);
  const darker = palette === 'darker';
  const page = light ? 'hsl(214, 20%, 93%)' : darker ? 'oklch(0.195 0.012 264)' : 'hsl(209, 20%, 25%)';
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
