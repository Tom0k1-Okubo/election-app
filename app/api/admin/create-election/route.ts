import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'

export async function POST(request: Request) {
  const authError = checkAdminPassword(request)
  if (authError) return authError

  const { title, candidateNames } = await request.json()

  if (!title || !Array.isArray(candidateNames) || candidateNames.length < 2) {
    return NextResponse.json(
      { error: 'titleと2名以上のcandidateNamesを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  // 選挙を作成
  const { data: election, error: electionError } = await supabase
    .from('elections')
    .insert({ title, status: 'open' })
    .select('id')
    .single()

  if (electionError || !election) {
    return NextResponse.json(
      { error: electionError?.message || '選挙の作成に失敗しました' },
      { status: 500 }
    )
  }

  // 候補者をまとめて作成
  const candidateRows = candidateNames.map((name: string) => ({
    election_id: election.id,
    name,
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

  return NextResponse.json({ electionId: election.id })
}