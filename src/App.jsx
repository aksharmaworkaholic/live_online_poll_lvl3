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
  getExplorerLink
} from './lib/stellar'
import { readCachedPolls, writeCachedPolls } from './lib/pollCache'
import { getPollState, mergeRecentEvents } from './lib/pollLogic'

const EMPTY_FORM = { question: '', options: ['', ''], duration: 60 }
const DURATION_PRESETS = [5, 15, 30, 60, 180, 1440]

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
  const [transaction, setTransaction] = useState({ phase: 'idle', message: 'Ready for activity.', hash: null })
  const [recentEvents, setRecentEvents] = useState([])
  const [lastSyncedAt, setLastSyncedAt] = useState(new Date().toLocaleTimeString())

  const eventCursorRef = useRef(null)
  const refreshPollStateRef = useRef(null)
  const syncFromEventsRef = useRef(null)

  const visiblePolls = useMemo(() => {
    return [...polls].sort((left, right) => left.expiresAt - right.expiresAt)
  }, [polls])

  const stats = useMemo(() => {
    const activePolls = polls.filter((poll) => getPollState(poll) === 'active').length
    const totalVotes = polls.reduce((sum, poll) => sum + poll.votes.reduce((vSum, vote) => vSum + vote, 0), 0)
    return { totalPolls: polls.length, activePolls, totalVotes }
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

  function handleFailure(error, txPhase = 'error') {
    const parsed = classifyError(error)
    setTransaction((prev) => ({ phase: txPhase, message: parsed.message, hash: prev.hash }))
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
      setLastSyncedAt(new Date().toLocaleTimeString())
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
        setRecentEvents((current) => mergeRecentEvents(current, eventBatch.events))
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

  function updateTransactionStatus(update) {
    let msg = "Processing..."
    if (update.phase === 'awaiting-signature') msg = "Waiting for wallet signature..."
    if (update.phase === 'pending') msg = "Transaction submitted to network..."
    setTransaction((current) => ({ ...current, ...update, message: msg }))
  }

  async function runContractWrite(method, args, successTitle, successMessage) {
    if (!wallet?.address) return false
    try {
      setTransaction({ phase: 'preparing', message: 'Simulating transaction...', hash: null })
      await submitContractTransaction({ method, args, address: wallet.address, onStatus: updateTransactionStatus })

      // Preserve the hash from the 'pending' update when moving to 'success'
      setTransaction((prev) => ({ ...prev, phase: 'success', message: 'Transaction confirmed on-chain!' }))

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

        {/* SUPPORTED WALLETS BANNER */}
        <div className="wallets-pill-container">
          <span className="wallet-pill">🔐 Freighter</span>
          <span className="wallet-pill">📧 Albedo</span>
          <span className="wallet-pill">🦊 xBull</span>
          <span className="wallet-pill">🐰 Rabet</span>
          <span className="wallet-pill">🦞 Lobstr</span>
          <span className="wallet-pill">🌸 Hana</span>
          <span className="wallet-pill"> and more</span>
        </div>
        {/* NOTICES */}
        {notice && (
            <div className={`notice-bar ${notice.type}`}>
              <strong>{notice.title}:</strong> {notice.message}
            </div>
        )}

        {/* STATS ROW */}
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Polls</span>
            <span className="stat-value">{stats.totalPolls}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Polls</span>
            <span className="stat-value">{stats.activePolls}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Votes</span>
            <span className="stat-value">{stats.totalVotes}</span>
          </div>
        </div>

        {/* TWO COLUMN LAYOUT */}
        <div className="dashboard-columns">

          {/* COLUMN 1: CREATE POLL */}
          {wallet?.address ? (
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

                {/* DURATION SELECTOR */}
                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ color: '#94a3b8', fontSize: '0.875rem', textTransform: 'uppercase' }}>Duration</label>
                  <div className="duration-selector">
                    {DURATION_PRESETS.map((minutes) => (
                        <button
                            key={minutes}
                            className={`duration-pill ${minutes === form.duration ? 'active' : ''}`}
                            onClick={() => setForm((current) => ({ ...current, duration: minutes }))}
                            type="button"
                        >
                          {minutes >= 60 ? `${minutes / 60}h` : `${minutes}m`}
                        </button>
                    ))}
                  </div>
                </div>

                {formError && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{formError}</p>}

                <button
                    className="primary-btn"
                    onClick={handleCreatePoll}
                    disabled={transaction.phase === 'preparing' || transaction.phase === 'pending'}
                    style={{ width: '100%', marginTop: '2rem' }}
                >
                  {transaction.phase === 'preparing' || transaction.phase === 'pending' ? 'Submitting...' : 'Deploy Poll'}
                </button>
              </div>
          ) : (
              <div className="create-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <h3 style={{ marginBottom: '1rem' }}>Wallet Required</h3>
                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Connect your Stellar wallet to deploy on-chain polls.</p>
                <button className="primary-btn" onClick={handleConnectWallet}>Connect Wallet</button>
              </div>
          )}

          {/* COLUMN 2: SYSTEM PANELS */}
          <div>
            {/* TRANSACTION PANEL */}
            <div className="system-panel">
              <div className="panel-header">
                <span>Transaction Status</span>
                <span className={`phase-badge ${transaction.phase === 'success' ? 'success' : transaction.phase === 'error' ? 'error' : transaction.phase !== 'idle' ? 'pending' : ''}`}>
                {transaction.phase}
              </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: '#e2e8f0' }}>{transaction.message}</p>

              {/* Added Stellar Expert Link for Transactions */}
              {transaction.hash && getExplorerLink && (
                  <a href={getExplorerLink('tx', transaction.hash)} className="expert-link-btn" target="_blank" rel="noreferrer">
                    View Transaction on Stellar Expert ↗
                  </a>
              )}
            </div>

            {/* LIVE SYNC PANEL */}
            <div className="system-panel">
              <div className="panel-header">
                <span>Live Sync</span>
                <span style={{ color: '#34d399', fontSize: '0.75rem' }}>● Last sync: {lastSyncedAt}</span>
              </div>

              {recentEvents.length === 0 ? (
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Waiting for network activity...</p>
              ) : (
                  <div className="event-feed">
                    {recentEvents.map((event) => (
                        <div key={event.id} className="event-item">
                          <strong style={{ color: event.action === 'close' ? '#f87171' : '#8b5cf6' }}>{event.action.toUpperCase()}</strong>
                          <span style={{ color: '#cbd5e1', marginLeft: '0.5rem' }}>{event.summary}</span>
                        </div>
                    ))}
                  </div>
              )}

              {/* Added Stellar Expert Link for Smart Contract */}
              {CONTRACT_ID && getExplorerLink && (
                  <a href={getExplorerLink('contract', CONTRACT_ID)} className="expert-link-btn" target="_blank" rel="noreferrer">
                    View Contract on Stellar Expert ↗
                  </a>
              )}
            </div>
          </div>

        </div>

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