'use client'

import { useState, useEffect } from 'react'

type Candidate = { id: string; name: string }

export default function VotePage() {
  const [electionId, setElectionId] = useState('')
  const [token, setToken] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [selected, setSelected] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('electionId')
    if (id) setElectionId(id)
  }, [])

  useEffect(() => {
    if (!electionId) return
    fetch(`/api/candidates?electionId=${electionId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.candidates) setCandidates(data.candidates)
      })
  }, [electionId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')

    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, candidateId: selected }),
    })
    const data = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setMessage(data.error || '投票に失敗しました')
      return
    }
    setDone(true)
  }


  if (done) {
    return (
      <main className="wrap">
        <div className="ballot done">
          <div className="seal-mark">済</div>
          <h1>投票が完了しました</h1>
          <p className="sub">ご協力ありがとうございました。</p>
        </div>
        <style jsx>{`
          .wrap {
            min-height: 100dvh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #faf7f0;
            padding: 24px;
          }
          .ballot {
            max-width: 400px;
            width: 100%;
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
          h1 {
            font-family: 'Hiragino Mincho ProN', 'Yu Mincho', serif;
            font-size: 22px;
            font-weight: 600;
            color: #1f2733;
            margin: 0 0 8px;
          }
          .sub {
            color: #4b5563;
            font-size: 14px;
            margin: 0;
          }
        `}</style>
      </main>
    )
  }

  
  return (
    <main className="wrap">
      <form className="ballot" onSubmit={handleSubmit}>
        <div className="ballot-header">
          <span className="chip">投票用紙</span>
          <h1>{electionId ? '幹部選挙' : '投票'}</h1>
        </div>

        <div className="field">
          <label htmlFor="token">投票用トークン</label>
          <input
            id="token"
            type="text"
            inputMode="text"
            autoComplete="off"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="配布されたトークンを入力"
            required
          />
        </div>

        <div className="field">
          <p className="label">候補者を選んでください</p>
          <div className="candidate-list">
            {candidates.length === 0 && (
              <p className="empty">候補者を読み込んでいます…</p>
            )}
            {candidates.map((c) => (
              <label
                key={c.id}
                className={`candidate-row ${selected === c.id ? 'selected' : ''}`}
              >
                <input
                  type="radio"
                  name="candidate"
                  value={c.id}
                  checked={selected === c.id}
                  onChange={() => setSelected(c.id)}
                />
                <span className="mark" aria-hidden="true" />
                <span className="name">{c.name}</span>
              </label>
            ))}
          </div>
        </div>

        {message && <p className="error">{message}</p>}

        <div className="submit-area">
          <button
            type="submit"
            disabled={submitting || !selected || !token}
            className="seal-button"
          >
            <span>{submitting ? '送信中' : '投票する'}</span>
          </button>
          <p className="note">投票後の取り消しはできません</p>
        </div>
      </form>

      
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
        label.label,
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
        .empty {
          font-size: 13px;
          color: #9a9284;
        }
        .candidate-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 12px;
          border: 1px solid #d8d2c4;
          border-radius: 2px;
          cursor: pointer;
        }
        .candidate-row.selected {
          border-color: #b3382c;
          background: #f7ece9;
        }
        .candidate-row input {
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
        .candidate-row.selected .mark {
          border-color: #b3382c;
        }
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
          transition: transform 0.1s ease, background 0.15s ease;
        }
        .seal-button:disabled {
          background: #d8c9c5;
          cursor: not-allowed;
        }
        .seal-button:not(:disabled):active {
          transform: scale(0.96);
        }
        .note {
          margin: 16px 0 0;
          font-size: 12px;
          color: #9a9284;
        }
      `}</style>
    </main>
  )
}