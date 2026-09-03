import { createServerClient } from '@/lib/supabase'
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { token, candidateId } = await request.json()

  if (!token || !candidateId) {
    return NextResponse.json(
      { error: 'tokenとcandidateIdを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const tokenHash = createHash('sha256').update(token).digest('hex')

  // トークンが存在し、まだ使われていないか確認
  const { data: voter, error: findError } = await supabase
    .from('voters')
    .select('id, election_id, used')
    .eq('token_hash', tokenHash)
    .single()

  if (findError || !voter) {
    return NextResponse.json(
      { error: '無効なトークンです' },
      { status: 401 }
    )
  }

  if (voter.used) {
    return NextResponse.json(
      { error: 'このトークンはすでに使用されています' },
      { status: 409 }
    )
  }

  // 投票の記録とトークンの使用済み化は、途中で失敗しても
  // 不整合が起きないよう1つのDB関数(トランザクション)にまとめて実行する
  const { error: rpcError } = await supabase.rpc('cast_vote', {
    p_voter_id: voter.id,
    p_election_id: voter.election_id,
    p_candidate_id: candidateId,
  })

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}