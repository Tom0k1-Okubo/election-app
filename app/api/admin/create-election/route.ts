import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'

type CandidateInput = { name: string; bio?: string }
type RaceInput = { title: string; candidates: CandidateInput[] }

export async function POST(request: Request) {
  const authError = checkAdminPassword(request)
  if (authError) return authError

  const { title, races } = (await request.json()) as {
    title: string
    races: RaceInput[]
  }

  if (!title || !Array.isArray(races) || races.length === 0) {
    return NextResponse.json(
      { error: 'titleと1つ以上のracesを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({ title, status: 'open' })
    .select('id')
    .single()

  if (eventError || !event) {
    return NextResponse.json(
      { error: eventError?.message || 'イベントの作成に失敗しました' },
      { status: 500 }
    )
  }

  for (const race of races) {
    const { data: raceRow, error: raceError } = await supabase
      .from('races')
      .insert({ event_id: event.id, title: race.title })
      .select('id')
      .single()

    if (raceError || !raceRow) {
      return NextResponse.json(
        { error: raceError?.message || '選挙の作成に失敗しました' },
        { status: 500 }
      )
    }

    const candidateRows = race.candidates.map((c) => ({
      race_id: raceRow.id,
      name: c.name,
      bio: c.bio || null,
    }))

    const { error: candidatesError } = await supabase
      .from('candidates')
      .insert(candidateRows)

    if (candidatesError) {
      return NextResponse.json(
        { error: candidatesError.message },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ eventId: event.id })
}