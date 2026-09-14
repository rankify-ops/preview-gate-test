/*
 * assets-raw/ → public/img/
 *
 * assets-raw holds the originals pulled from girlsgetaways.com.au (Squarespace
 * CDN, ?format=2500w). The export is static, so this script IS the image
 * optimiser: two webp widths per photograph for the srcset, plus the GG
 * monogram in dark and light, favicons, the experience line-icons and the OG card.
 *
 * Run: node scripts/images.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const RAW = "assets-raw";
const OUT = "public/img";
mkdirSync(OUT, { recursive: true });

// [source, slug, crop?] — crop trims the screenshot borders two of the
// uploads on the live site still carry.
const PHOTOS = [
  ["02-HomePage_TheCalile.jpg", "pk-calile"],
  ["03-3Y4A2061.jpg", "pk-bellevallee"],
  ["04-HomePage_GreenhousetheBathhouse.jpg", "pk-greenhouse"],
  ["05-HomePage_Banner_Updates.jpg", "pk-pinchys"],
  ["06-HomePage_TheShoreatGerringong.jpg", "pk-palmco"],
  ["07-HomePage_TheTropic.jpg", "pk-tropic"],
  ["08-HomePage_MandalaBeachHouse.jpg", "pk-mandala"],
  ["09-HomePage_Banner_Updates3.jpg", "pk-spires"],
  ["10-HomePage_SundaraBeachHouse.jpg", "pk-sundara"],
  ["11-HomePage_BethanyBeachHouse.jpg", "pk-bethany"],
  ["27-Screenshot-2026-08-20-at-10.13.39.png", "pk-rooftop", { left: 12, top: 10, width: 1474, height: 1030 }],
  ["28-Screenshot-2026-08-17-at-13.40.32.png", "pk-hunter"],
  ["29-Brisbane_Retro-and-Relax.jpg", "pk-retro"],
  ["30-Inner-city-Oasis-pool.webp", "pk-byron"],
  ["31-fit253Dcontain252Cw253D19202B252812529-1.webp", "pk-mudgee"],
  ["32-pamper-1.webp", "pk-pamper"],
  ["12-StateBanner_Portrait_NSW.jpg", "state-nsw"],
  ["13-StateBanner_Portrait_VIC.jpg", "state-vic"],
  ["14-StateBanner_Portrait_QLD.jpg", "state-qld"],
  ["15-StateBanner_Portrait_ACT.jpg", "state-act"],
  ["16-StateBanner_Portrait_SA.jpg", "state-sa"],
];

for (const [src, slug, crop] of PHOTOS) {
  for (const w of [800, 1600]) {
    let img = sharp(`${RAW}/${src}`).rotate();
    if (crop) img = img.extract(crop);
    await img
      .resize({ width: w, withoutEnlargement: true })
      .webp({ quality: w === 1600 ? 78 : 74 })
      .toFile(`${OUT}/${slug}-${w}.webp`);
  }
}

// "What we do" line icons — white strokes on transparent, shown on clay discs.
const ICONS = [
  ["17-White_Wine-Weekends.png", "ico-wine"],
  ["18-White_Beach-Breaks.png", "ico-beach"],
  ["19-White_City-Escapes.png", "ico-city"],
  ["20-White_Foodie-Feasts.png", "ico-foodie"],
  ["21-White_Spa-Retreats.png", "ico-spa"],
  ["22-White_Hens-Parties.png", "ico-hens"],
  ["23-White_Luxury-Stays.png", "ico-luxury"],
  ["24-White_Pamper-Days.png", "ico-pamper"],
  ["25-White_High-Tea.png", "ico-hightea"],
  ["26-White_Country-Escapes.png", "ico-country"],
];
for (const [src, slug] of ICONS) {
  await sharp(`${RAW}/${src}`).resize({ width: 192 }).png({ compressionLevel: 9 }).toFile(`${OUT}/${slug}.png`);
}

/*
 * THE MONOGRAM
 * The live wordmark file is the circled "GG" in near-black on transparent.
 * Recolour the ink (keep the alpha) for the ink and white variants.
 */
const { data, info } = await sharp(`${RAW}/33-wordmark.png`)
  .trim({ threshold: 1 })
  .resize({ width: 240 })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (const [name, [r, g, b]] of [["mark-ink.png", [35, 31, 32]], ["mark-light.png", [255, 255, 255]]]) {
  const buf = Buffer.from(data);
  for (let i = 0; i < buf.length; i += 4) { buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; }
  await sharp(buf, { raw: info }).png({ compressionLevel: 9 }).toFile(`${OUT}/${name}`);
}

// Favicons: the monogram centred on blush.
for (const s of [32, 180, 192]) {
  const m = await sharp(`${OUT}/mark-ink.png`).resize({ width: Math.round(s * 0.86) }).png().toBuffer();
  await sharp({ create: { width: s, height: s, channels: 4, background: "#f6ece9" } })
    .composite([{ input: m, gravity: "center" }])
    .png()
    .toFile(`${OUT}/icon-${s}.png`);
}

// OG card: the Calile photograph, a soft wash, the light monogram.
const mark = await sharp(`${OUT}/mark-light.png`).resize({ width: 200 }).png().toBuffer();
const wash = Buffer.from(
  `<svg width="1200" height="630"><rect width="1200" height="630" fill="#231f20" fill-opacity=".32"/></svg>`
);
await sharp(`${RAW}/02-HomePage_TheCalile.jpg`)
  .resize(1200, 630, { fit: "cover" })
  .composite([{ input: wash }, { input: mark, gravity: "center" }])
  .jpeg({ quality: 82 })
  .toFile(`${OUT}/og.jpg`);

console.log("images done");
