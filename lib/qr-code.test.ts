import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";

import { generateQRCodeDataURL, getTableURL } from "./qr-code-core";

function pngSizeFromDataUrl(dataUrl: string): { width: number; height: number } {
  const prefix = "data:image/png;base64,";
  assert.ok(dataUrl.startsWith(prefix));

  const png = Buffer.from(dataUrl.slice(prefix.length), "base64");
  assert.equal(png.toString("ascii", 1, 4), "PNG");

  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

async function pixelFromDataUrl(
  dataUrl: string,
  x: number,
  y: number
): Promise<[number, number, number, number]> {
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const index = (y * info.width + x) * info.channels;

  return [data[index], data[index + 1], data[index + 2], data[index + 3]];
}

function assertPixelNear(
  actual: [number, number, number, number],
  expected: [number, number, number, number],
  tolerance = 6
) {
  assert.equal(actual.length, expected.length);
  for (let index = 0; index < actual.length; index++) {
    assert.ok(
      Math.abs(actual[index] - expected[index]) <= tolerance,
      `Expected channel ${index} to be near ${expected[index]}, got ${actual[index]}`
    );
  }
}

test("getTableURL builds a table ordering URL from the public base URL", () => {
  const previousBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  process.env.NEXT_PUBLIC_BASE_URL = "https://order.olmosq.test";

  try {
    assert.equal(getTableURL("T7"), "https://order.olmosq.test/table/T7");
  } finally {
    if (previousBaseUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BASE_URL;
    } else {
      process.env.NEXT_PUBLIC_BASE_URL = previousBaseUrl;
    }
  }
});

test("getTableURL falls back to localhost when no public base URL is configured", () => {
  const previousBaseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  delete process.env.NEXT_PUBLIC_BASE_URL;

  try {
    assert.equal(getTableURL("T1"), "http://localhost:3000/table/T1");
  } finally {
    if (previousBaseUrl !== undefined) {
      process.env.NEXT_PUBLIC_BASE_URL = previousBaseUrl;
    }
  }
});

test("generateQRCodeDataURL returns a 512px PNG data URL", async () => {
  const dataUrl = await generateQRCodeDataURL("https://order.olmosq.test/table/T1");

  assert.match(dataUrl, /^data:image\/png;base64,/);
  assert.deepEqual(pngSizeFromDataUrl(dataUrl), { width: 512, height: 512 });
});

test("generateQRCodeDataURL uses the branded rounded QR design", async () => {
  const dataUrl = await generateQRCodeDataURL("https://order.olmosq.test/table/T1");

  assertPixelNear(await pixelFromDataUrl(dataUrl, 41, 16), [159, 190, 110, 255], 10);
  assertPixelNear(await pixelFromDataUrl(dataUrl, 256, 36), [255, 254, 248, 255]);
  assertPixelNear(await pixelFromDataUrl(dataUrl, 220, 256), [159, 190, 110, 255], 12);
  assertPixelNear(await pixelFromDataUrl(dataUrl, 66, 66), [159, 190, 110, 255]);
});
