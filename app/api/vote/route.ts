import { createServerClient } from '@/lib/supabase'
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

type Selection = { raceId: string; candidateId: string | null }

export async function POST(request: Request) {
  const { name, token, selections } = (await request.json()) as {
    name: string
    token: string
    selections: Selection[]
  }

  if (!name || !token || !Array.isArray(selections)) {
    return NextResponse.json(
      { error: '必要な情報が不足しています' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const tokenHash = createHash('sha256').update(token).digest('hex')

  // 投票確定の直前に、もう一度名前とトークンを検証する
  const { data: voter, error } = await supabase
    .from('voters')
    .select('id, name, used')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !voter || voter.name.trim() !== name.trim()) {
    return NextResponse.json(
      { error: '名前またはトークンが正しくありません' },
      { status: 401 }
    )
  }

  if (voter.used) {
    return NextResponse.json(
      { error: 'このトークンはすでに使用されています' },
      { status: 409 }
    )
  }

  const payload = selections.map((s) => ({
    race_id: s.raceId,
    candidate_id: s.candidateId,
  }))

  const { error: rpcError } = await supabase.rpc('cast_votes', {
    p_voter_id: voter.id,
    p_selections: payload,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}