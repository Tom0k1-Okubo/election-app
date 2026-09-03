import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'

export async function POST(request: Request) {
  const authError = checkAdminPassword(request)
  if (authError) return authError

  const { electionId } = await request.json()

  if (!electionId) {
    return NextResponse.json(
      { error: 'electionIdを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('elections')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', electionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}