import { createServerClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'

export async function POST(request: Request) {
  const authError = checkAdminPassword(request)
  if (authError) return authError

  const { eventId } = await request.json()

  if (!eventId) {
    return NextResponse.json(
      { error: 'eventIdを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  const { error } = await supabase
    .from('events')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', eventId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}