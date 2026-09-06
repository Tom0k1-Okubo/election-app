'use client'

import { useState } from 'react'

type CandidateInput = { name: string; bio: string }
type RaceInput = { title: string; candidates: CandidateInput[] }
type RaceResult = {
  raceId: string
  raceTitle: string
  candidates: { candidateId: string; name: string; count: number }[]
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [title, setTitle] = useState('')
  const [raceInputs, setRaceInputs] = useState<RaceInput[]>([
    { title: '', candidates: [{ name: '', bio: '' }, { name: '', bio: '' }] },
    { title: '', candidates: [{ name: '', bio: '' }, { name: '', bio: '' }] },
  ])
  const [eventId, setEventId] = useState('')
  const [voterNamesText, setVoterNamesText] = useState('')
  const [issued, setIssued] = useState<{ name: string; token: string }[]>([])
  const [results, setResults] = useState<{ eventTitle: string; races: RaceResult[] } | null>(
    null
  )
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-admin-password': password,
    }
  }

  function updateRace(index: number, field: keyof RaceInput, value: string) {
    setRaceInputs((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    )
  }
    function updateCandidate(
    raceIndex: number,
    candidateIndex: number,
    field: keyof CandidateInput,
    value: string
  ) {
    setRaceInputs((prev) =>
      prev.map((r, i) =>
        i !== raceIndex
          ? r
          : {
              ...r,
              candidates: r.candidates.map((c, ci) =>
                ci === candidateIndex ? { ...c, [field]: value } : c
              ),
            }
      )
    )
  }

  function addCandidate(raceIndex: number) {
    setRaceInputs((prev) =>
      prev.map((r, i) =>
        i !== raceIndex
          ? r
          : { ...r, candidates: [...r.candidates, { name: '', bio: '' }] }
      )
    )
  }

  function removeCandidate(raceIndex: number, candidateIndex: number) {
    setRaceInputs((prev) =>
      prev.map((r, i) =>
        i !== raceIndex
          ? r
          : { ...r, candidates: r.candidates.filter((_, ci) => ci !== candidateIndex) }
      )
    )
  }

  function addRace() {
    setRaceInputs((prev) => [...prev, { title: '', candidateNamesText: '' }])
  }

  function removeRace(index: number) {
    setRaceInputs((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleCreateEvent() {
    setLoading(true)
    setMessage('')

    const races = raceInputs.map((r) => ({
      title: r.title,
      candidates: r.candidates
        .filter((c) => c.name.trim().length > 0)
        .map((c) => ({ name: c.name.trim(), bio: c.bio.trim() })),
    }))

    const res = await fetch('/api/admin/create-election', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ title, races }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || 'イベントの作成に失敗しました')
      return
    }
    setEventId(data.eventId)
    setMessage(`イベントを作成しました(ID: ${data.eventId})`)
  }

  async function handleGenerateTokens() {
    setLoading(true)
    setMessage('')

    const names = voterNamesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const res = await fetch('/api/admin/generate-tokens', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ eventId, names }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || 'トークン発行に失敗しました')
      return
    }
    setIssued(data.issued)
  }

  async function handleClose() {
    setLoading(true)
    setMessage('')
    const res = await fetch('/api/admin/close', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ eventId }),
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
    const res = await fetch(`/api/results?eventId=${eventId}`)
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || '結果の取得に失敗しました')
      return
    }
    setResults(data)
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
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 24 }}>
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

      <h2>1. イベントを作成する</h2>
      <label>
        イベントタイトル(例:2026年度幹部選挙)
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={inputStyle}
        />
      </label>

      {raceInputs.map((race, i) => (
        <div key={i} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 12 }}>
          <label>
            選挙{i + 1}のタイトル(例:会長選挙)
            <input
              type="text"
              value={race.title}
              onChange={(e) => updateRace(i, 'title', e.target.value)}
              style={inputStyle}
            />
          </label>
                    <p style={{ marginBottom: 8 }}>候補者</p>
          {race.candidates.map((candidate, ci) => (
            <div
              key={ci}
              style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}
            >
              <label>
                氏名
                <input
                  type="text"
                  value={candidate.name}
                  onChange={(e) => updateCandidate(i, ci, 'name', e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label>
                紹介文(任意)
                <textarea
                  value={candidate.bio}
                  onChange={(e) => updateCandidate(i, ci, 'bio', e.target.value)}
                  rows={2}
                  style={inputStyle}
                />
              </label>
              {race.candidates.length > 1 && (
                <button onClick={() => removeCandidate(i, ci)} type="button">
                  この候補者を削除
                </button>
              )}
            </div>
          ))}
          <button
            onClick={() => addCandidate(i)}
            type="button"
            style={{ marginBottom: 12 }}
          >
            候補者を追加
          </button>
          {raceInputs.length > 1 && (
            <button onClick={() => removeRace(i)} type="button">
              この選挙を削除
            </button>
          )}
        </div>
      ))}
      <button onClick={addRace} type="button" style={{ marginBottom: 16 }}>
        選挙を追加
      </button>
      <br />
      <button onClick={handleCreateEvent} disabled={loading}>
        イベントを作成
      </button>

      <hr style={{ margin: '24px 0' }} />

      <h2>2. 投票者にトークンを発行する</h2>
      <label>
        イベントID
        <input
          type="text"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          style={inputStyle}
        />
      </label>
      <label>
        投票者名簿(1行に1人ずつ)
        <textarea
          value={voterNamesText}
          onChange={(e) => setVoterNamesText(e.target.value)}
          rows={4}
          style={inputStyle}
        />
      </label>
      <button onClick={handleGenerateTokens} disabled={loading}>
        トークンを発行
      </button>

      {issued.length > 0 && (
        <div style={{ marginTop: 16, background: '#f5f5f5', padding: 12 }}>
          <p>発行されたトークン(該当者にそれぞれ配布してください):</p>
          <ul>
            {issued.map((item) => (
              <li key={item.token}>
                {item.name}:{' '}
                <span style={{ fontFamily: 'monospace' }}>{item.token}</span>
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
          <p>{results.eventTitle} の結果:</p>
          {results.races.map((race) => (
            <div key={race.raceId} style={{ marginBottom: 12 }}>
              <strong>{race.raceTitle}</strong>
              <ul>
                {race.candidates.map((c) => (
                  <li key={c.candidateId}>
                    {c.name}: {c.count}票
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {message && <p style={{ marginTop: 16, color: '#333' }}>{message}</p>}
    </main>
  )
}