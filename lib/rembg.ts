const REMBG_URL = process.env.REMBG_SERVICE_URL ?? 'http://localhost:8000'

export async function removeBackground(imageBuffer: Buffer, filename: string): Promise<Buffer> {
  const formData = new FormData()
  const blob = new Blob([imageBuffer as unknown as ArrayBuffer], { type: 'image/png' })
  formData.append('file', blob, filename)

  const res = await fetch(`${REMBG_URL}/remove-bg`, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Rembg error ${res.status}: ${err}`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  return buffer
}

export async function checkRembgHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${REMBG_URL}/health`, { signal: AbortSignal.timeout(3000) })
    return res.ok
  } catch {
    return false
  }
}
