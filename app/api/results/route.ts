import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const electionId = searchParams.get('electionId')

  if (!electionId) {
    return NextResponse.json(
      { error: 'electionIdを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // 締切前は、管理者を含め誰であっても結果を返さない
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .select('status')
    .eq('id', electionId)
    .single()

  if (electionError || !election) {
    return NextResponse.json(
      { error: '選挙が見つかりません' },
      { status: 404 }
    )
  }

  if (election.status !== 'closed') {
    return NextResponse.json(
      { error: '投票期間中は結果を確認できません' },
      { status: 403 }
    )
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from('candidates')
    .select('id, name')
    .eq('election_id', electionId)

  const { data: votes, error: votesError } = await supabase
    .from('votes')
    .select('candidate_id')
    .eq('election_id', electionId)

  if (candidatesError || votesError) {
    return NextResponse.json(
      { error: '集計中にエラーが発生しました' },
      { status: 500 }
    )
  }

  const results = candidates!.map((c) => ({
    candidateId: c.id,
    name: c.name,
    count: votes!.filter((v) => v.candidate_id === c.id).length,
  }))

  return NextResponse.json({ results })
}