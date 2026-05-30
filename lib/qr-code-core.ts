import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";

const QR_SIZE = 512;
const QR_RENDER_SIZE = 408;
const QR_RENDER_OFFSET = (QR_SIZE - QR_RENDER_SIZE) / 2;
const QUIET_MODULES = 1;
const CENTER_MARK_RADIUS = 62;
const CENTER_LOGO_SIZE = 124;
const QR_INK = "#9fbe6e";
const QR_PAPER = "#fffef8";
const CENTER_MARK_TEXT = "#fffef8";
const LOGO_PATH = path.join(process.cwd(), "public", "brand", "olmosq-logo.jpg");

export async function generateQRCodeDataURL(text: string): Promise<string> {
  const qr = QRCode.create(text, {
    errorCorrectionLevel: "H",
  });
  const qrBuffer = await sharp(Buffer.from(buildStyledQrSvg(qr.modules)))
    .png()
    .toBuffer();
  const brandedQr = await addCenterBrand(qrBuffer);

  return `data:image/png;base64,${brandedQr.toString("base64")}`;
}

export function getTableURL(tableCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/table/${tableCode}`;
}

function buildStyledQrSvg(modules: QRCode.QRCode["modules"]): string {
  const moduleCount = modules.size;
  const totalModules = moduleCount + QUIET_MODULES * 2;
  const moduleSize = QR_RENDER_SIZE / totalModules;
  const center = QR_SIZE / 2;
  const moduleGap = moduleSize * 0.22;
  const moduleHeight = moduleSize - moduleGap;
  const pieces: string[] = [];

  for (let row = 0; row < moduleCount; row++) {
    let column = 0;

    while (column < moduleCount) {
      if (!shouldDrawModule(modules, row, column, center, moduleSize)) {
        column++;
        continue;
      }

      const startColumn = column;
      while (
        column + 1 < moduleCount &&
        shouldDrawModule(modules, row, column + 1, center, moduleSize)
      ) {
        column++;
      }

      const runLength = column - startColumn + 1;
      const x = QR_RENDER_OFFSET + (startColumn + QUIET_MODULES) * moduleSize;
      const y = QR_RENDER_OFFSET + (row + QUIET_MODULES) * moduleSize;
      const width = runLength * moduleSize - moduleGap;
      const radius = runLength === 1 ? moduleHeight / 2 : moduleHeight * 0.38;

      pieces.push(
        `<rect x="${(x + moduleGap / 2).toFixed(2)}" y="${(
          y + moduleGap / 2
        ).toFixed(2)}" width="${width.toFixed(
          2
        )}" height="${moduleHeight.toFixed(2)}" rx="${radius.toFixed(
          2
        )}" fill="${QR_INK}"/>`
      );

      column++;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${QR_SIZE}" height="${QR_SIZE}" viewBox="0 0 ${QR_SIZE} ${QR_SIZE}">
  <rect width="${QR_SIZE}" height="${QR_SIZE}" fill="${QR_PAPER}"/>
  <rect x="18" y="18" width="476" height="476" rx="34" fill="none" stroke="${QR_INK}" stroke-width="7"/>
  ${pieces.join("\n  ")}
  ${buildFallbackCenterMark(center)}
</svg>`;
}

function buildFallbackCenterMark(center: number): string {
  return `<circle cx="${center}" cy="${center}" r="${CENTER_MARK_RADIUS}" fill="${QR_INK}"/>
  <circle cx="${center}" cy="${center}" r="${
    CENTER_MARK_RADIUS - 5
  }" fill="none" stroke="${QR_PAPER}" stroke-width="3"/>
  <text x="${center}" y="${center - 20}" text-anchor="middle" font-family="Quicksand, Arial, Helvetica, sans-serif" font-size="39" font-weight="700" fill="${CENTER_MARK_TEXT}">O</text>
  <text x="${center}" y="${center + 16}" text-anchor="middle" font-family="Quicksand, Arial, Helvetica, sans-serif" font-size="39" font-weight="700" fill="${CENTER_MARK_TEXT}">M</text>
  <text x="${center}" y="${center + 52}" text-anchor="middle" font-family="Quicksand, Arial, Helvetica, sans-serif" font-size="39" font-weight="700" fill="${CENTER_MARK_TEXT}">C</text>`;
}

async function addCenterBrand(qrBuffer: Buffer): Promise<Buffer> {
  try {
    const logo = await readFile(LOGO_PATH);
    const mask = await sharp({
      create: {
        width: CENTER_LOGO_SIZE,
        height: CENTER_LOGO_SIZE,
        channels: 4,
        background: "transparent",
      },
    })
      .composite([
        {
          input: Buffer.from(
            `<svg width="${CENTER_LOGO_SIZE}" height="${CENTER_LOGO_SIZE}" viewBox="0 0 ${CENTER_LOGO_SIZE} ${CENTER_LOGO_SIZE}"><circle cx="${
              CENTER_LOGO_SIZE / 2
            }" cy="${CENTER_LOGO_SIZE / 2}" r="${
              CENTER_LOGO_SIZE / 2
            }" fill="#ffffff"/></svg>`
          ),
        },
      ])
      .png()
      .toBuffer();
    const circularLogo = await sharp(logo)
      .resize(CENTER_LOGO_SIZE, CENTER_LOGO_SIZE, { fit: "cover" })
      .ensureAlpha()
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();

    return sharp(qrBuffer)
      .composite([
        {
          input: circularLogo,
          top: Math.round((QR_SIZE - CENTER_LOGO_SIZE) / 2),
          left: Math.round((QR_SIZE - CENTER_LOGO_SIZE) / 2),
        },
      ])
      .png()
      .toBuffer();
  } catch {
    return qrBuffer;
  }
}

function shouldDrawModule(
  modules: QRCode.QRCode["modules"],
  row: number,
  column: number,
  center: number,
  moduleSize: number
): boolean {
  if (!modules.get(row, column)) {
    return false;
  }

  const x = QR_RENDER_OFFSET + (column + QUIET_MODULES) * moduleSize;
  const y = QR_RENDER_OFFSET + (row + QUIET_MODULES) * moduleSize;
  const moduleCenterX = x + moduleSize / 2;
  const moduleCenterY = y + moduleSize / 2;
  const distanceFromCenter = Math.hypot(
    moduleCenterX - center,
    moduleCenterY - center
  );

  return distanceFromCenter >= CENTER_MARK_RADIUS + moduleSize * 0.35;
}
