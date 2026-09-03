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

  const { data, error } = await supabase
    .from('candidates')
    .select('id, name')
    .eq('election_id', electionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ candidates: data })
}