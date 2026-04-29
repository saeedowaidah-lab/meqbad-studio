// Server-only image utilities — requires Node.js runtime
// eslint-disable-next-line @typescript-eslint/no-require-imports
import sharp from 'sharp'

export interface ResizeOptions {
  width: number
  height: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  background?: { r: number; g: number; b: number; alpha: number }
}

export async function resizeAndCompress(
  inputBuffer: Buffer,
  options: ResizeOptions,
  maxSizeKB = 2048
): Promise<{ buffer: Buffer; sizeKB: number; dimensions: string }> {
  let quality = 90
  let buffer = await sharp(inputBuffer)
    .resize(options.width, options.height, {
      fit: options.fit ?? 'contain',
      background: options.background ?? { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .jpeg({ quality })
    .toBuffer()

  // Compress until under maxSizeKB
  while (buffer.length > maxSizeKB * 1024 && quality > 50) {
    quality -= 10
    buffer = await sharp(inputBuffer)
      .resize(options.width, options.height, {
        fit: options.fit ?? 'contain',
        background: options.background ?? { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .jpeg({ quality })
      .toBuffer()
  }

  return {
    buffer,
    sizeKB: Math.round(buffer.length / 1024),
    dimensions: `${options.width}x${options.height}`,
  }
}

export async function convertToPng(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer).png().toBuffer()
}

export async function getImageMeta(buffer: Buffer): Promise<{ width: number; height: number; format: string }> {
  const meta = await sharp(buffer).metadata()
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: meta.format ?? 'unknown',
  }
}

export async function bufferToBase64(buffer: Buffer): Promise<string> {
  return buffer.toString('base64')
}

export async function base64ToBuffer(base64: string): Promise<Buffer> {
  return Buffer.from(base64, 'base64')
}

export async function addWhiteBackground(transparentPngBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  const whiteBackground = await sharp({
    create: { width, height, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .png()
    .toBuffer()

  return sharp(whiteBackground)
    .composite([{ input: transparentPngBuffer, blend: 'over' }])
    .jpeg({ quality: 95 })
    .toBuffer()
}

export async function createCatalogCanvas(
  productBuffer: Buffer,
  width = 2480,
  height = 3508
): Promise<Buffer> {
  const productResized = await sharp(productBuffer)
    .resize(1400, 1400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer()

  const canvas = await sharp({
    create: { width, height, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .png()
    .toBuffer()

  return sharp(canvas)
    .composite([{ input: productResized, top: Math.floor((height - 1400) / 3), left: Math.floor((width - 1400) / 2) }])
    .jpeg({ quality: 95 })
    .toBuffer()
}
