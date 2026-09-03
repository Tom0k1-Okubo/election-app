import { createClient } from '@supabase/supabase-js'

// サーバー側(APIルート)専用のクライアント。強い権限を持つため、
// このファイルはブラウザ向けコードから絶対にインポートしないこと。
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const secretKey = process.env.SUPABASE_SECRET_KEY!

  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
    },
  })
}