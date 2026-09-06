import { createServerClient } from '@/lib/supabase'
import { randomBytes, createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { checkAdminPassword } from '@/lib/adminAuth'

export async function POST(request: Request) {
  const authError = checkAdminPassword(request)
  if (authError) return authError

  const { eventId, names } = (await request.json()) as {
    eventId: string
    names: string[]
  }

  if (!eventId || !Array.isArray(names) || names.length === 0) {
    return NextResponse.json(
      { error: 'eventIdと1名以上のnamesを指定してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const issued: { name: string; token: string }[] = []
  const rows: { event_id: string; name: string; token_hash: string }[] = []

  for (const name of names) {
    const rawToken = randomBytes(16).toString('hex')
    const tokenHash = createHash('sha256').update(rawToken).digest('hex')
    issued.push({ name, token: rawToken })
    rows.push({ event_id: eventId, name, token_hash: tokenHash })
  }

  const { error } = await supabase.from('voters').insert(rows)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ issued })
}