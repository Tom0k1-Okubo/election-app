'use client'

import { useState } from 'react'

type Candidate = { id: string; name: string }
type Result = { candidateId: string; name: string; count: number }

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [candidateNamesText, setCandidateNamesText] = useState('')
  const [electionId, setElectionId] = useState('')
  const [tokenCount, setTokenCount] = useState(5)
  const [tokens, setTokens] = useState<string[]>([])
  const [results, setResults] = useState<Result[] | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    }
  }

  async function handleCreateElection() {
    setLoading(true)
    setMessage('')
    const candidateNames = candidateNamesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const res = await fetch('/api/admin/create-election', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, candidateNames }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || '選挙の作成に失敗しました')
      return
    }
    setElectionId(data.electionId)
    setMessage(`選挙を作成しました(ID: ${data.electionId})`)
  }

  async function handleGenerateTokens() {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/admin/generate-tokens', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ electionId, count: tokenCount }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || 'トークン発行に失敗しました')
      return
    }
    setTokens(data.tokens)
  }

  async function handleClose() {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/admin/close', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ electionId }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || '締切に失敗しました')
      return
    }
    setMessage('投票を締め切りました')
  }

  async function handleViewResults() {
    setLoading(true)
    setMessage('')
    const res = await fetch(`/api/results?electionId=${electionId}`)
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || '結果の取得に失敗しました')
      return
    }
    setResults(data.results)
  }

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: 8,
    marginTop: 4,
    marginBottom: 16,
    border: '1px solid #999',
    borderRadius: 4,
  }

  return (
    <main style={{ maxWidth: 560, margin: '40px auto', padding: 24 }}>
      <h1>管理者画面</h1>

      <label>
        管理者パスワード
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
      </label>

      <hr style={{ margin: '24px 0' }} />

      <h2>1. 選挙を作成する</h2>
      <label>
        選挙タイトル
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label>
        候補者名(1行に1人ずつ)
        <textarea
          value={candidateNamesText}
          onChange={(e) => setCandidateNamesText(e.target.value)}
          rows={4}
          style={inputStyle}
        />
      </label>
      <button onClick={handleCreateElection} disabled={loading}>
        選挙を作成
      </button>

      <hr style={{ margin: '24px 0' }} />

      <h2>2. トークンを発行する</h2>
      <label>
        選挙ID
        <input
          type="text"
          value={electionId}
          onChange={(e) => setElectionId(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label>
        発行する人数
        <input
          type="number"
          value={tokenCount}
          onChange={(e) => setTokenCount(Number(e.target.value))}
          style={inputStyle}
        />
      </label>
      <button onClick={handleGenerateTokens} disabled={loading}>
        トークンを発行
      </button>

      {tokens.length > 0 && (
        <div style={{ marginTop: 16, background: '#f5f5f5', padding: 12 }}>
          <p>発行されたトークン(それぞれ1人に配布してください):</p>
          <ul>
            {tokens.map((t) => (
              <li key={t} style={{ fontFamily: 'monospace' }}>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      <hr style={{ margin: '24px 0' }} />

      <h2>3. 締切・結果</h2>
      <button onClick={handleClose} disabled={loading} style={{ marginRight: 8 }}>
        投票を締め切る
      </button>
      <button onClick={handleViewResults} disabled={loading}>
        結果を見る
      </button>

      {results && (
        <div style={{ marginTop: 16, background: '#f5f5f5', padding: 12 }}>
          <p>結果:</p>
          <ul>
            {results.map((r) => (
              <li key={r.candidateId}>
                {r.name}: {r.count}票
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && <p style={{ marginTop: 16, color: '#333' }}>{message}</p>}
    </main>
  )
}