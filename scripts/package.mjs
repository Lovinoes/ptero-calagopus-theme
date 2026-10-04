// Packs this repository into the .c7s.zip archive that Calagopus installs, written to dist/.
//
// The layout and the checks follow the panel's own exporter and importer
// (shared/src/extensions/distr.rs): Metadata.toml at the root, the backend under backend/ and the
// frontend under frontend/, with explicit directory entries, since the panel looks those up by name.
//
// Usage: node scripts/package.mjs   (Node.js 24 or newer, no dependencies)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}

function tomlString(source, key) {
  return source.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, 'm'))?.[1];
}

// --- metadata checks (same rules as ExtensionDistrFile::validate) ---------------------------------

const metadata = read('Metadata.toml');
const packageName = tomlString(metadata, 'package_name');
const panelVersion = tomlString(metadata, 'panel_version');

if (!packageName) fail('Metadata.toml has no package_name');
if (!tomlString(metadata, 'name')) fail('Metadata.toml has no name');
if (!panelVersion) fail('Metadata.toml has no panel_version');

const segments = packageName.split('.');
if (segments.length !== 3) fail(`package name "${packageName}" must have exactly 3 segments`);

const [tld, author, ident] = segments;
if (!/^[a-z]{2,6}$/.test(tld)) fail(`invalid tld segment "${tld}"`);
if (!/^[a-z0-9-]{3,30}$/.test(author)) fail(`invalid author segment "${author}"`);
if (!/^[a-z0-9-]{4,30}$/.test(ident)) fail(`invalid identifier segment "${ident}"`);

const identifier = packageName.replaceAll('.', '_');
const cargo = read('Cargo.toml');

if (tomlString(cargo, 'name') !== identifier) {
  fail(`Cargo.toml [package] name must be "${identifier}", the package name with underscores`);
}
if (!tomlString(cargo, 'version')) fail('Cargo.toml has no version');
if (!read('src/lib.rs').includes('pub struct ExtensionStruct')) fail('src/lib.rs has no `pub struct ExtensionStruct`');

const entrypoint = ['frontend/src/index.ts', 'frontend/src/index.tsx'].find((file) => fs.existsSync(path.join(ROOT, file)));
if (!entrypoint) fail('frontend/src/index.ts or frontend/src/index.tsx is missing');
if (!read(entrypoint).includes('export default ')) fail(`${entrypoint} has no \`export default \``);

const packageJson = JSON.parse(read('frontend/package.json'));
if (typeof packageJson.dependencies !== 'object' || packageJson.dependencies === null) {
  fail('frontend/package.json needs a "dependencies" object');
}

// --- archive contents ----------------------------------------------------------------------------

/** @type {{ name: string, source: string | null }[]} */
const entries = [];
const directories = new Set();

function addDirectory(name) {
  const parts = name.split('/');
  for (let i = 1; i <= parts.length; i++) {
    const directory = `${parts.slice(0, i).join('/')}/`;
    if (!directories.has(directory)) {
      directories.add(directory);
      entries.push({ name: directory, source: null });
    }
  }
}

function addFile(name, source) {
  if (!fs.statSync(path.join(ROOT, source)).isFile()) fail(`${source} is not a file`);
  addDirectory(path.posix.dirname(name));
  entries.push({ name, source });
}

function addTree(prefix, directory) {
  for (const item of fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (item.name === 'node_modules' || item.name.startsWith('.')) continue;

    const source = `${directory}/${item.name}`;
    if (item.isDirectory()) {
      addDirectory(`${prefix}/${item.name}`);
      addTree(`${prefix}/${item.name}`, source);
    } else if (item.isFile()) {
      addFile(`${prefix}/${item.name}`, source);
    }
  }
}

entries.push({ name: 'Metadata.toml', source: 'Metadata.toml' });

addFile('backend/Cargo.toml', 'Cargo.toml');
addFile('backend/LICENSE', 'LICENSE');
addFile('backend/NOTICE', 'NOTICE');
addDirectory('backend/src');
addTree('backend/src', 'src');

addFile('frontend/package.json', 'frontend/package.json');
addDirectory('frontend/src');
addTree('frontend/src', 'frontend/src');
if (fs.existsSync(path.join(ROOT, 'frontend/public'))) {
  addDirectory('frontend/public');
  addTree('frontend/public', 'frontend/public');
}

// --- zip writer (deflate, UTF-8 names) -----------------------------------------------------------

// fixed timestamp (2026-01-01 00:00) so the same sources always give the same archive
const DOS_TIME = 0;
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

const localParts = [];
const centralParts = [];
let offset = 0;

for (const entry of entries) {
  const name = Buffer.from(entry.name, 'utf8');
  const isDirectory = entry.source === null;
  const data = isDirectory ? Buffer.alloc(0) : fs.readFileSync(path.join(ROOT, entry.source));
  const compressed = isDirectory ? data : zlib.deflateRawSync(data, { level: 9 });
  const method = isDirectory ? 0 : 8;
  const crc = isDirectory ? 0 : zlib.crc32(data);

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // UTF-8 names
  local.writeUInt16LE(method, 8);
  local.writeUInt16LE(DOS_TIME, 10);
  local.writeUInt16LE(DOS_DATE, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  local.writeUInt16LE(0, 28);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE((3 << 8) | 20, 4); // made by: unix, 2.0
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(method, 10);
  central.writeUInt16LE(DOS_TIME, 12);
  central.writeUInt16LE(DOS_DATE, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt16LE(0, 30); // extra
  central.writeUInt16LE(0, 32); // comment
  central.writeUInt16LE(0, 34); // disk
  central.writeUInt16LE(0, 36); // internal attributes
  central.writeUInt32LE((isDirectory ? (0o040755 << 16) | 0x10 : 0o100644 << 16) >>> 0, 38);
  central.writeUInt32LE(offset, 42);

  localParts.push(local, name, compressed);
  centralParts.push(central, name);
  offset += local.length + name.length + compressed.length;
}

const centralDirectory = Buffer.concat(centralParts);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(entries.length, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(centralDirectory.length, 12);
end.writeUInt32LE(offset, 16);
end.writeUInt16LE(0, 20);

const outputDirectory = path.join(ROOT, 'dist');
const output = path.join(outputDirectory, `${identifier}.c7s.zip`);

fs.mkdirSync(outputDirectory, { recursive: true });
fs.writeFileSync(output, Buffer.concat([...localParts, centralDirectory, end]));

console.log(`packed ${packageName} (panel ${panelVersion}) with ${entries.length} entries into ${path.relative(ROOT, output)}`);
