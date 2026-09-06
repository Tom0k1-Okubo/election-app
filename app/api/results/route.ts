import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) {
    return NextResponse.json(
      { error: 'eventIdを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // 締切前は、管理者を含め誰であっても結果を返さない
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('title, status')
    .eq('id', eventId)
    .single()

  if (eventError || !event) {
    return NextResponse.json(
      { error: 'イベントが見つかりません' },
      { status: 404 }
    )
  }

  if (event.status !== 'closed') {
    return NextResponse.json(
      { error: '投票期間中は結果を確認できません' },
      { status: 403 }
    )
  }

  const { data: races, error: racesError } = await supabase
    .from('races')
    .select('id, title, candidates(id, name, bio)')
    .eq('event_id', eventId)

  if (racesError || !races) {
    return NextResponse.json(
      { error: racesError?.message || '選挙情報の取得に失敗しました' },
      { status: 500 }
    )
  }

  const raceResults = []

  for (const race of races) {
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('candidate_id')
      .eq('race_id', race.id)

    if (votesError) {
      return NextResponse.json({ error: votesError.message }, { status: 500 })
    }

    const candidateResults = race.candidates.map((c: { id: string; name: string }) => ({
      candidateId: c.id,
      name: c.name,
      count: votes.filter((v) => v.candidate_id === c.id).length,
    }))

    raceResults.push({
      raceId: race.id,
      raceTitle: race.title,
      candidates: candidateResults,
      blankCount: votes.length === 0 ? 0 : undefined, // 参考値。空欄票数は下で計算
    })
  }

  return NextResponse.json({ eventTitle: event.title, races: raceResults })
}