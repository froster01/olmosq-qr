import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import sharp from "sharp";

import manifest from "../app/manifest";

const root = process.cwd();

test("app exposes installable pwa metadata", () => {
  const appManifest = manifest();
  const rootLayout = readFileSync(path.join(root, "app/layout.tsx"), "utf8");

  assert.equal(appManifest.name, "Olmosq Coffee");
  assert.equal(appManifest.short_name, "Olmosq");
  assert.equal(appManifest.start_url, "/");
  assert.equal(appManifest.scope, "/");
  assert.equal(appManifest.display, "standalone");
  assert.equal(appManifest.background_color, "#faf8f3");
  assert.equal(appManifest.theme_color, "#496f2c");
  assert.deepEqual(appManifest.icons, [
    {
      src: "/icons/olmosq-icon-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/olmosq-icon-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/icons/olmosq-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ]);

  assert.match(rootLayout, /manifest: "\/manifest\.webmanifest"/);
  assert.match(rootLayout, /appleWebApp:/);
  assert.match(rootLayout, /export const viewport/);
  assert.match(rootLayout, /themeColor: "#496f2c"/);
});

test("pwa icons are present", async () => {
  const staffPushWorker = readFileSync(
    path.join(root, "public/staff-push-sw.js"),
    "utf8"
  );

  for (const icon of [
    "public/icons/olmosq-icon-192.png",
    "public/icons/olmosq-icon-512.png",
    "public/icons/olmosq-maskable-512.png",
  ]) {
    const iconPath = path.join(root, icon);
    assert.equal(existsSync(iconPath), true);

    const metadata = await sharp(iconPath).metadata();
    assert.equal(metadata.hasAlpha, true);

    const topLeftPixel = await sharp(iconPath)
      .ensureAlpha()
      .extract({ left: 0, top: 0, width: 1, height: 1 })
      .raw()
      .toBuffer();
    assert.equal(topLeftPixel[3], 0);
  }

  assert.match(staffPushWorker, /\/icons\/olmosq-icon-192\.png/);
});
