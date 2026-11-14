// One-shot image build. Reads full-size files in media/ and writes
// WebP plus JPEG into docs/assets/img/. Never edits media/.
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const media = path.join(root, "media");
const out = path.join(root, "docs", "assets", "img");

const stems = [
  "01-long-walk-standing",
  "02-long-walk-look-back",
  "03-evergreen-kneeling",
  "04-cover-inis-dom",
  "05-cover-half-the-city",
  "09-leather-jacket-street",
  "10-busking-gra-mor",
  "12-grafton-too-sweet",
  "13-grafton-duet-zoe-clarke",
  "15-lassie-go-indoor",
  "16-galway-castle-on-the-hill",
  "22-stage-with-imelda-may",
  "27-paris-arc-face",
];

const targets = [480, 960, 1600];
const webpQuality = 72;
const jpegQuality = 76;

function widthsFor(sourceWidth) {
  const chosen = targets.filter((w) => sourceWidth >= w);
  const largest = chosen.at(-1) ?? 0;
  // Keep the real width when it sits between two steps, so a 1440px
  // photo is not left at 960. Do not go past 1600.
  if (sourceWidth < 1600 && sourceWidth - largest > 80) {
    chosen.push(sourceWidth);
  }
  if (!chosen.length) chosen.push(sourceWidth);
  return chosen;
}

for (const stem of stems) {
  const src = path.join(media, `${stem}.jpg`);
  const input = sharp(src).rotate();
  const meta = await input.metadata();
  const widths = widthsFor(meta.width);
  // A phone at a typical pixel density sits between 480 and 960.
  // 800 keeps the hero under the size a phone should download.
  if (stem === "02-long-walk-look-back" && meta.width >= 800 && !widths.includes(800)) {
    widths.push(800);
    widths.sort((a, b) => a - b);
  }
  for (const width of widths) {
    const resized = input.clone().resize({
      width,
      withoutEnlargement: true,
    });
    const webpPath = path.join(out, `${stem}-${width}.webp`);
    const jpgPath = path.join(out, `${stem}-${width}.jpg`);
    await resized.clone().webp({ quality: webpQuality }).toFile(webpPath);
    await resized.clone().jpeg({ quality: jpegQuality, mozjpeg: true }).toFile(jpgPath);
  }
  console.log(`${stem} ${meta.width}x${meta.height} -> ${widths.join(", ")}`);
}

const hero = path.join(media, "02-long-walk-look-back.jpg");
const heroMeta = await sharp(hero).metadata();
const cropH = Math.round(heroMeta.width * 630 / 1200);
// Top 320 keeps her face, the guitar and the houses in a 1200×630 frame.
await sharp(hero)
  .rotate()
  .extract({ left: 0, top: 320, width: heroMeta.width, height: cropH })
  .resize(1200, 630)
  .jpeg({ quality: 80, mozjpeg: true })
  .toFile(path.join(out, "og.jpg"));
console.log(`og.jpg crop top 320, height ${cropH}`);

const written = (await readdir(out)).filter((name) => name.endsWith(".webp") || name.endsWith(".jpg"));
written.sort();
for (const name of written) {
  const info = await stat(path.join(out, name));
  const kb = (info.size / 1024).toFixed(1);
  const flag = name === "02-long-walk-look-back-960.webp" && info.size > 250 * 1024 ? "  OVER 250KB" : "";
  console.log(`${kb.padStart(8)} KB  ${name}${flag}`);
}
