import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const svg = await readFile(fileURLToPath(new URL('../public/icon.svg', import.meta.url)));
const sizes = { 'icon-192.png': 192, 'icon-512.png': 512, 'apple-touch-icon.png': 180 };

for (const [name, size] of Object.entries(sizes)) {
  const out = fileURLToPath(new URL(`../public/${name}`, import.meta.url));
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(out);
  console.log('created', name);
}