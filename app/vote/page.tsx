'use client'

import { useState } from 'react'

type Candidate = { id: string; name: string; bio: string | null }
type Race = { id: string; title: string; candidates: Candidate[] }
type Step = 'auth' | 'voting' | 'confirm' | 'done'

export default function VotePage() {
  const [step, setStep] = useState<Step>('auth')
  const [name, setName] = useState('')
  const [token, setToken] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [races, setRaces] = useState<Race[]>([])
  const [selections, setSelections] = useState<Record<string, string | null>>({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  async function handleAuthenticate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const res = await fetch('/api/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, token }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || '認証に失敗しました')
      return
    }

    setEventTitle(data.eventTitle)
    setRaces(data.races)
    const initial: Record<string, string | null> = {}
    data.races.forEach((r: Race) => {
      initial[r.id] = null
    })
    setSelections(initial)
    setStep('voting')
  }

  function handleSelect(raceId: string, candidateId: string | null) {
    setSelections((prev) => ({ ...prev, [raceId]: candidateId }))
  }
  function toggleExpand(candidateId: string) {
    setExpandedId((prev) => (prev === candidateId ? null : candidateId))
  }

  function goToConfirm() {
    setStep('confirm')
  }

  async function handleFinalSubmit() {
    setLoading(true)
    setMessage('')

    const payload = races.map((r) => ({
      raceId: r.id,
      candidateId: selections[r.id] ?? null,
    }))

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, token, selections: payload }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setMessage(data.error || '投票に失敗しました')
      return
    }

    setStep('done')
  }

  function candidateName(race: Race, candidateId: string | null) {
    if (!candidateId) return '投票しない(空欄)'
    return race.candidates.find((c) => c.id === candidateId)?.name || ''
  }

  return (
    <main className="wrap">
      <div className="ballot">
        <div className="ballot-header">
          <span className="chip">投票用紙</span>
          <h1>{eventTitle || '投票'}</h1>
        </div>

        {step === 'auth' && (
          <form onSubmit={handleAuthenticate}>
            <div className="field">
              <label htmlFor="name">お名前</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="配布された名簿と同じ氏名"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="token">投票用トークン</label>
              <input
                id="token"
                type="text"
                autoComplete="off"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="配布されたトークンを入力"
                required
              />
            </div>
            {message && <p className="error">{message}</p>}
            <div className="submit-area">
              <button type="submit" disabled={loading} className="rect-button">
                {loading ? '確認中' : '認証する'}
              </button>
            </div>
          </form>
        )}

        {step === 'voting' && (
          <div>
            {races.map((race) => (
              <div className="field" key={race.id}>
                <p className="label">{race.title}</p>
                <div className="candidate-list">
                  {race.candidates.map((c) => (
                    <div
                      key={c.id}
                      className={`candidate-card ${selections[race.id] === c.id ? 'selected' : ''}`}
                    >
                      <label className="candidate-row">
                        <input
                          type="radio"
                          name={race.id}
                          className="visually-hidden-radio"
                          checked={selections[race.id] === c.id}
                          onChange={() => handleSelect(race.id, c.id)}
                        />
                        <span className="mark" aria-hidden="true" />
                        <span className="name">{c.name}</span>
                        {c.bio && (
                          <button
                            type="button"
                            className="expand-toggle"
                            onClick={(e) => {
                              e.preventDefault()
                              toggleExpand(c.id)
                            }}
                          >
                            {expandedId === c.id ? '閉じる' : '詳しく見る'}
                          </button>
                        )}
                      </label>
                      {c.bio && expandedId === c.id && (
                        <p className="bio">{c.bio}</p>
                      )}
                    </div>
                  ))}
                  <label
                    className={`candidate-row blank ${selections[race.id] === null ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={race.id}
                      className="visually-hidden-radio"
                      checked={selections[race.id] === null}
                      onChange={() => handleSelect(race.id, null)}
                    />
                    <span className="mark" aria-hidden="true" />
                    <span className="name">投票しない(空欄)</span>
                  </label>
                </div>
              </div>
            ))}
            <div className="submit-area">
              <button onClick={goToConfirm} className="rect-button">
                確認する
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div>
            <div className="field">
              <p className="label">以下の内容で投票します</p>
              <div className="confirm-list">
                {races.map((race) => (
                  <div className="confirm-row" key={race.id}>
                    <span className="confirm-race">{race.title}</span>
                    <span className="confirm-candidate">
                      {candidateName(race, selections[race.id])}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {message && <p className="error">{message}</p>}
            <div className="submit-area confirm-actions">
              <button
                onClick={() => setStep('voting')}
                className="rect-button ghost"
                disabled={loading}
              >
                修正する
              </button>
              <button
                onClick={handleFinalSubmit}
                className="seal-button"
                disabled={loading}
              >
                <span>{loading ? '送信中' : '投票する'}</span>
              </button>
            </div>
            <p className="note">投票後の取り消しはできません</p>
          </div>
        )}

        {step === 'done' && (
          <div className="done-area">
            <div className="seal-mark">済</div>
            <h2>投票が完了しました</h2>
            <p className="sub">ご協力ありがとうございました。</p>
          </div>
        )}
      </div>

      <style jsx>{`
        :global(html, body) {
          background: #faf7f0;
        }
        .wrap {
          min-height: 100dvh;
          display: flex;
          justify-content: center;
          padding: 24px 16px 48px;
          background: #faf7f0;
        }
        .ballot {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border: 1px solid #e4ddcc;
          border-radius: 2px;
        }
        .ballot-header {
          padding: 28px 24px 20px;
          border-bottom: 1px solid #e4ddcc;
        }
        .chip {
          display: inline-block;
          font-size: 12px;
          letter-spacing: 0.05em;
          color: #b3382c;
          border: 1px solid #b3382c;
          border-radius: 2px;
          padding: 2px 8px;
          margin-bottom: 10px;
        }
        h1 {
          font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif;
          font-size: 21px;
          font-weight: 600;
          color: #1f2733;
          margin: 0;
        }
        .field {
          padding: 20px 24px;
          border-bottom: 1px solid #eee7d8;
        }
        .field > label,
        .field > p.label {
          display: block;
          font-size: 13px;
          color: #4b5563;
          margin-bottom: 8px;
        }
        input[type='text'] {
          width: 100%;
          font-size: 16px;
          padding: 12px 14px;
          border: 1px solid #c9c2b0;
          border-radius: 2px;
          background: #fdfcf9;
          color: #1f2733;
          box-sizing: border-box;
        }
        input[type='text']:focus {
          outline: 2px solid #b3382c;
          outline-offset: 1px;
          border-color: #b3382c;
        }
        .candidate-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .candidate-card {
          border: 1px solid #d8d2c4;
          border-radius: 2px;
        }
        .candidate-card.selected {
          border-color: #b3382c;
        }   
        .candidate-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 12px;
          cursor: pointer;
        }
        .candidate-row.blank {
          border-style: dashed;
        }
        .candidate-card.selected {
          background: #f7ece9;
        }
        .expand-toggle {
          margin-left: auto;
          background: none;
          border: none;
          color: #7a6f5f;
          font-size: 12px;
          text-decoration: underline;
          cursor: pointer;
          padding: 4px;
        }
        .bio {
          margin: 0;
          padding: 0 12px 14px 44px;
          font-size: 13px;
          color: #4b5563;
          line-height: 1.6;
        }
        .visually-hidden-radio {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
        }
        .mark {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid #9a9284;
          flex-shrink: 0;
          position: relative;
        }
        .candidate-card.selected .mark,
        .candidate-row.selected .mark {
          border-color: #b3382c;
        }
        .candidate-card.selected .mark::after,
        .candidate-row.selected .mark::after {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: 50%;
          background: #b3382c;
        }
        .name {
          font-size: 16px;
          color: #1f2733;
        }
        .error {
          margin: 0;
          padding: 14px 24px;
          background: #fdeeec;
          color: #a12f24;
          font-size: 14px;
          border-bottom: 1px solid #eee7d8;
        }
        .submit-area {
          padding: 28px 24px 32px;
          text-align: center;
        }
        .confirm-actions {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 24px;
        }
        .rect-button {
          padding: 12px 28px;
          background: #1f2733;
          color: #fff;
          border: none;
          border-radius: 2px;
          font-size: 15px;
          cursor: pointer;
        }
        .rect-button.ghost {
          background: transparent;
          color: #4b5563;
          border: 1px solid #c9c2b0;
        }
        .rect-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .seal-button {
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background: #b3382c;
          color: #fff;
          border: none;
          font-size: 16px;
          font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif;
          cursor: pointer;
        }
        .seal-button:disabled {
          background: #d8c9c5;
          cursor: not-allowed;
        }
        .confirm-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .confirm-row {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: #fdfcf9;
          border: 1px solid #eee7d8;
          border-radius: 2px;
        }
        .confirm-race {
          font-size: 13px;
          color: #4b5563;
        }
        .confirm-candidate {
          font-size: 15px;
          color: #1f2733;
        }
        .note {
          text-align: center;
          font-size: 12px;
          color: #9a9284;
          margin: 0 0 24px;
        }
        .done-area {
          text-align: center;
          padding: 48px 24px;
        }
        .seal-mark {
          width: 64px;
          height: 64px;
          border: 2px solid #b3382c;
          border-radius: 50%;
          color: #b3382c;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif;
          font-size: 22px;
        }
        .done-area h2 {
          font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif;
          font-size: 20px;
          color: #1f2733;
          margin: 0 0 8px;
        }
        .done-area .sub {
          font-size: 14px;
          color: #4b5563;
        }
      `}</style>
    </main>
  )
}