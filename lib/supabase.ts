import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase environment variables not set')
  }
  _client = createClient(url, key)
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getClient()[prop as keyof SupabaseClient]
  },
})

export async function uploadImageToStorage(
  productId: string,
  type: string,
  filename: string,
  buffer: Buffer,
  contentType = 'image/jpeg'
): Promise<string> {
  const client = getClient()
  const path = `${productId}/${type}/${filename}`
  const { error } = await client.storage
    .from('product-images')
    .upload(path, buffer, { contentType, upsert: true })
  if (error) throw error

  const { data } = client.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
