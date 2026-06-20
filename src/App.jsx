import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  connectWallet,
  CONTRACT_ID,
  disconnectWallet,
  ensureReadAccount,
  fetchContractEvents,
  fetchPolls,
  fetchVoteStatuses,
  submitContractTransaction,
} from './lib/stellar'
import { readCachedPolls, writeCachedPolls } from './lib/pollCache'
import { getPollState } from './lib/pollLogic'

const EMPTY_FORM = { question: '', options: ['', ''], duration: 60 }

function shortenAddress(address) {
  if (!address) return 'Not connected'
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

function formatTimeLeft(expiresAt) {
  const diff = expiresAt - Date.now()
  if (diff <= 0) return 'Closed'
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h left`
  if (hours > 0) return `${hours}h ${minutes % 60}m left`
  return `${minutes}m left`
}

function normalizeAddress(address) {
  return String(address || '').trim().toUpperCase()
}

function isPollOwner(poll, walletAddress) {
  return normalizeAddress(walletAddress) !== '' && normalizeAddress(walletAddress) === normalizeAddress(poll?.creator)
}

function classifyError(error) {
  const rawMessage = error?.message || String(error || 'Unknown error')
  return { title: 'Notice', message: rawMessage }
}

export default function App() {
  const [wallet, setWallet] = useState(null)
  const [polls, setPolls] = useState(() => readCachedPolls())
  const [voteLookup, setVoteLookup] = useState({})
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState(null)
  const [isBooting, setIsBooting] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isWalletBusy, setIsWalletBusy] = useState(false)

  const eventCursorRef = useRef(null)
  const refreshPollStateRef = useRef(null)
  const syncFromEventsRef = useRef(null)

  const visiblePolls = useMemo(() => {
    return polls.sort((left, right) => left.expiresAt - right.expiresAt)
  }, [polls])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 5000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    writeCachedPolls(polls)
  }, [polls])

  function showNotice(type, title, message) {
    setNotice({ type, title, message })
  }

  function handleFailure(error) {
    const parsed = classifyError(error)
    showNotice('error', parsed.title, parsed.message)
    return parsed
  }

  async function refreshPollState({ silent = false } = {}) {
    if (!CONTRACT_ID) {
      setIsBooting(false)
      return
    }
    if (!silent) setIsRefreshing(true)

    try {
      const readAddress = await ensureReadAccount()
      const nextPolls = await fetchPolls(readAddress)
      const nextVotes = await fetchVoteStatuses(nextPolls, wallet?.address, readAddress)
      setPolls(nextPolls)
      setVoteLookup(nextVotes)
    } catch (error) {
      handleFailure(error)
    } finally {
      setIsBooting(false)
      setIsRefreshing(false)
    }
  }

  async function syncFromEvents() {
    if (!CONTRACT_ID) return
    try {
      const eventBatch = await fetchContractEvents(eventCursorRef.current)
      eventCursorRef.current = eventBatch.cursor
      if (eventBatch.events.length > 0) {
        await refreshPollState({ silent: true })
      }
    } catch (error) {
      console.error("Background sync failed:", error)
    }
  }

  useEffect(() => { refreshPollStateRef.current = refreshPollState; syncFromEventsRef.current = syncFromEvents })
  useEffect(() => { const timer = window.setTimeout(() => { refreshPollStateRef.current?.() }, 0); return () => window.clearTimeout(timer) }, [wallet?.address])
  useEffect(() => {
    if (!CONTRACT_ID) return
    const interval = window.setInterval(() => { syncFromEventsRef.current?.() }, 5000)
    return () => window.clearInterval(interval)
  }, [wallet?.address])

  async function handleConnectWallet() {
    setIsWalletBusy(true)
    try {
      const connectedWallet = await connectWallet()
      setWallet(connectedWallet)
      showNotice('success', 'Wallet connected', `${connectedWallet.walletName} is ready.`)
    } catch (error) {
      handleFailure(error)
    } finally {
      setIsWalletBusy(false)
    }
  }

  async function handleDisconnectWallet() {
    await disconnectWallet()
    setWallet(null)
    setVoteLookup({})
    showNotice('info', 'Disconnected', 'Wallet disconnected.')
  }

  async function runContractWrite(method, args, successTitle, successMessage) {
    if (!wallet?.address) return false
    try {
      await submitContractTransaction({ method, args, address: wallet.address, onStatus: () => {} })
      showNotice('success', successTitle, successMessage)
      await refreshPollState({ silent: true })
      return true
    } catch (error) {
      handleFailure(error)
      return false
    }
  }

  async function handleCreatePoll() {
    const question = form.question.trim()
    const options = form.options.map((opt) => opt.trim()).filter(Boolean)

    if (!question || options.length < 2) {
      setFormError('Enter a question and at least 2 options.')
      return
    }
    setFormError('')

    const created = await runContractWrite(
        'create_poll',
        { creator: wallet?.address, question, options, duration_minutes: form.duration },
        'Poll created', 'Your poll is deploying to testnet.'
    )
    if (created) setForm(EMPTY_FORM)
  }

  async function handleVote(pollId, optionIndex) {
    await runContractWrite('vote', { voter: wallet?.address, poll_id: pollId, option_index: optionIndex }, 'Vote cast', 'Your vote is recorded.')
  }

  async function handleClosePoll(pollId) {
    await runContractWrite('close_poll', { poll_id: pollId, caller: wallet?.address }, 'Poll closed', 'Poll marked as inactive.')
  }

  function addOption() { setForm((c) => ({ ...c, options: c.options.length >= 6 ? c.options : [...c.options, ''] })) }
  function updateOption(index, value) { setForm((c) => ({ ...c, options: c.options.map((opt, i) => i === index ? value : opt) })) }

  return (
      <div className="app-container">
        {/* HEADER */}
        <header className="glass-header">
          <div className="logo-text">LivePoll Dashboard</div>
          <button
              className={`primary-btn ${wallet?.address ? 'connected' : ''}`}
              onClick={wallet?.address ? handleDisconnectWallet : handleConnectWallet}
              disabled={isWalletBusy}
          >
            {isWalletBusy ? 'Opening wallet...' : wallet?.address ? `Disconnect (${shortenAddress(wallet.address)})` : 'Connect Wallet'}
          </button>
        </header>

        {/* NOTICES */}
        {notice && (
            <div className={`notice-bar ${notice.type}`}>
              <strong>{notice.title}:</strong> {notice.message}
            </div>
        )}

        {/* CREATE POLL */}
        {wallet?.address && (
            <div className="create-section">
              <h2>Deploy a New Poll</h2>
              <input
                  type="text"
                  className="input-field"
                  placeholder="What should the community vote on?"
                  value={form.question}
                  onChange={(e) => setForm((c) => ({ ...c, question: e.target.value }))}
              />

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                {form.options.map((opt, i) => (
                    <input
                        key={i}
                        className="input-field"
                        style={{ width: '45%', marginTop: 0 }}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        placeholder={`Option ${i + 1}`}
                    />
                ))}
              </div>

              <button className="primary-btn" onClick={addOption} style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.1)' }}>
                + Add Option
              </button>

              {formError && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{formError}</p>}

              <button
                  className="primary-btn"
                  onClick={handleCreatePoll}
                  style={{ width: '100%', marginTop: '2rem' }}
              >
                Deploy Poll
              </button>
            </div>
        )}

        {/* ACTIVE POLLS FEED */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Live Feed</h2>
          <button className="primary-btn" style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => refreshPollState()}>
            {isRefreshing ? 'Syncing...' : 'Refresh'}
          </button>
        </div>

        <div className="poll-grid">
          {isBooting ? (
              <p style={{ color: '#94a3b8' }}>Loading network state...</p>
          ) : visiblePolls.length > 0 ? (
              visiblePolls.map((poll) => {
                const totalVotes = poll.votes.reduce((sum, vote) => sum + vote, 0)
                const state = getPollState(poll)
                const isOwner = isPollOwner(poll, wallet?.address)

                return (
                    <div className="glass-card" key={poll.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '0.75rem', background: state === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.1)', color: state === 'active' ? '#34d399' : '#94a3b8', padding: '0.3rem 0.6rem', borderRadius: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {state}
                  </span>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{formatTimeLeft(poll.expiresAt)}</span>
                      </div>

                      <h3 style={{ marginBottom: '0.5rem' }}>{poll.question}</h3>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.5rem' }}>{totalVotes} total votes · By {shortenAddress(poll.creator)}</p>

                      <div style={{ flexGrow: 1 }}>
                        {poll.options.map((option, index) => {
                          const votes = poll.votes[index] || 0
                          const hasVoted = Boolean(voteLookup[poll.id])
                          const canVote = !hasVoted && state === 'active' && wallet?.address

                          return (
                              <div
                                  className={`vote-option ${!canVote ? 'disabled' : ''}`}
                                  key={index}
                                  onClick={() => canVote ? handleVote(poll.id, index) : null}
                              >
                                <span>{option}</span>
                                <span className="vote-count">{votes}</span>
                              </div>
                          )
                        })}
                      </div>

                      {isOwner && state === 'active' && (
                          <button className="danger-btn" onClick={() => handleClosePoll(poll.id)}>
                            Close Poll
                          </button>
                      )}
                    </div>
                )
              })
          ) : (
              <p style={{ color: '#94a3b8' }}>No active polls found on the network.</p>
          )}
        </div>
      </div>
  )
}