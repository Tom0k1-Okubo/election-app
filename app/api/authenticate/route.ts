import { createServerClient } from '@/lib/supabase'
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { name, token } = await request.json()

  if (!name || !token) {
    return NextResponse.json(
      { error: '名前とトークンを入力してください' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { data: voter, error } = await supabase
    .from('voters')
    .select('id, event_id, name, used')
    .eq('token_hash', tokenHash)
    .single()

  if (error || !voter) {
    return NextResponse.json(
      { error: '名前またはトークンが正しくありません' },
      { status: 401 }
    )
  }

  // 名前も一致するか確認(前後の空白は無視して比較)
  if (voter.name.trim() !== name.trim()) {
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

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, title, status')
    .eq('id', voter.event_id)
    .single()

  if (eventError || !event) {
    return NextResponse.json(
      { error: 'イベントが見つかりません' },
      { status: 404 }
    )
  }

  if (event.status !== 'open') {
    return NextResponse.json(
      { error: 'この投票は現在受け付けていません' },
      { status: 403 }
    )
  }

  const { data: races, error: racesError } = await supabase
    .from('races')
    .select('id, title, candidates(id, name, bio)')
    .eq('event_id', event.id)

  if (racesError) {
    return NextResponse.json({ error: racesError.message }, { status: 500 })
  }

  return NextResponse.json({
    eventTitle: event.title,
    races,
  })
}