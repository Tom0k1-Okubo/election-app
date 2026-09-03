import { createServerClient } from '@/lib/supabase'
import { randomBytes, createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'

// トークンをランダム生成し、ハッシュ化してDBに保存、
// 生のトークンだけを配布用としてレスポンスで返す
export async function POST(request: Request) {
    const authError = checkAdminPassword(request)
  if (authError) return authError

  const { electionId, count } = await request.json()

  if (!electionId || !count) {
    return NextResponse.json(
      { error: 'electionIdとcountを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const tokens: string[] = []
  const rows: { election_id: string; token_hash: string }[] = []

  for (let i = 0; i < count; i++) {
    const rawToken = randomBytes(16).toString('hex') // 配布用の生トークン
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    tokens.push(rawToken)
    rows.push({ election_id: electionId, token_hash: tokenHash })
  }

  const { error } = await supabase.from('voters').insert(rows)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 生トークンはこのレスポンス以外どこにも保存されないので、
  // ここで管理者が控えて各投票者に配布する
  return NextResponse.json({ tokens })
}