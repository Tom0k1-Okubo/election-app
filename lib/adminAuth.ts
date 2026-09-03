import { NextResponse } from 'next/server'

// 管理者操作の前に必ず呼び出し、falseならすぐにエラーを返す
export function checkAdminPassword(request: Request): NextResponse | null {
  const password = request.headers.get('x-admin-password')
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '認証に失敗しました' }, { status: 401 })
  }
  return null
}