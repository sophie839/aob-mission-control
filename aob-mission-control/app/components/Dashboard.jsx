'use client'
import { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import styles from './Dashboard.module.css'
import KanbanColumn from './KanbanColumn'

export default function Dashboard() {
  const [inbox, setInbox] = useState([])
  const [pipeline, setPipeline] = useState({ PROSPECTING: [], DEVELOPING: [], CLOSED: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [inboxRes, draftsRes, pipelineRes] = await Promise.all([
        fetch('/api/inbox'),
        fetch('/api/drafts'),
        fetch('/api/pipeline'),
      ])

      if (!inboxRes.ok || !pipelineRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const inboxData = await inboxRes.json()
      const draftsData = await draftsRes.json()
      const pipelineData = await pipelineRes.json()

      // Match drafts to inbox items by threadId
      const enrichedInbox = (Array.isArray(inboxData) ? inboxData : []).map((item) => {
        const matchedDraft = draftsData.find(
          (d) => d.threadId === item.threadId
        )
        if (matchedDraft) {
          return {
            ...item,
            hasDraft: true,
            draftId: matchedDraft.id,
            draftSubject: matchedDraft.subject,
            draftPreview: matchedDraft.preview,
            draftBody: matchedDraft.body,
          }
        }
        return item
      })

      // Match drafts to prospects by email
      const enrichPipelineColumn = (cards) =>
        cards.map((card) => {
          const matchedDraft = draftsData.find((d) => {
            if (!d.toEmail || !card.email) return false
            return d.toEmail.toLowerCase() === card.email.toLowerCase()
          })
          if (matchedDraft) {
            return {
              ...card,
              hasDraft: true,
              draftId: matchedDraft.id,
              draftSubject: matchedDraft.subject,
              draftPreview: matchedDraft.preview,
              draftBody: matchedDraft.body,
            }
          }
          return card
        })

      setPipeline({
        PROSPECTING: enrichPipelineColumn(pipelineData.PROSPECTING || []),
        DEVELOPING: enrichPipelineColumn(pipelineData.DEVELOPING || []),
        CLOSED: enrichPipelineColumn(pipelineData.CLOSED || []),
      })

      setInbox(enrichedInbox)
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Auto-refresh every 2 minutes
    const interval = setInterval(fetchData, 120000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleSendDraft = async (draftId, cardType, cardId) => {
    try {
      const res = await fetch(`/api/drafts/${draftId}`, { method: 'POST' })
      if (!res.ok) throw new Error('Send failed')

      showToast('Sent successfully')

      // Remove from inbox if it was an inbox draft
      if (cardType === 'inbox') {
        setInbox((prev) => prev.filter((item) => item.id !== cardId))
      } else {
        // Update pipeline card to remove draft
        setPipeline((prev) => {
          const updated = { ...prev }
          for (const col of Object.keys(updated)) {
            updated[col] = updated[col].map((card) =>
              card.draftId === draftId
                ? { ...card, hasDraft: false, draftId: null }
                : card
            )
          }
          return updated
        })
      }
    } catch (err) {
      showToast('Failed to send', 'error')
    }
  }

  const handleArchive = async (messageId) => {
    try {
      const res = await fetch(`/api/inbox/${messageId}/archive`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Archive failed')

      showToast('Archived')
      setInbox((prev) => prev.filter((item) => item.id !== messageId))
    } catch (err) {
      showToast('Failed to archive', 'error')
    }
  }

  // Metrics
  const totalProspects =
    pipeline.PROSPECTING.length + pipeline.DEVELOPING.length
  const needsAction =
    inbox.filter((i) => i.hasDraft).length +
    [...pipeline.PROSPECTING, ...pipeline.DEVELOPING].filter((p) => p.hasDraft)
      .length
  const inProgress = pipeline.DEVELOPING.length
  const closed = pipeline.CLOSED.length

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoMark}>MC</div>
          <div>
            <h1 className={styles.title}>Mission Control</h1>
            <p className={styles.subtitle}>The Art of Broth</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          {lastRefresh && (
            <span className={styles.refreshTime}>
              {lastRefresh.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
          <button className={styles.refreshBtn} onClick={fetchData}>
            Refresh
          </button>
          <button className={styles.signOutBtn} onClick={() => signOut()}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Metrics */}
      <div className={styles.metrics}>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{needsAction}</span>
          <span className={styles.metricLabel}>Ready to Approve</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{inbox.length}</span>
          <span className={styles.metricLabel}>Inbox</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{totalProspects}</span>
          <span className={styles.metricLabel}>Pipeline</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{inProgress}</span>
          <span className={styles.metricLabel}>Developing</span>
        </div>
        <div className={styles.metric}>
          <span className={styles.metricValue}>{closed}</span>
          <span className={styles.metricLabel}>Closed</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      {/* Loading state */}
      {loading && !inbox.length && !pipeline.PROSPECTING.length && (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading your pipeline...</p>
        </div>
      )}

      {/* Kanban Board */}
      <div className={styles.board}>
        <KanbanColumn
          title="Inbox"
          subtitle="Review & approve"
          count={inbox.length}
          cards={inbox}
          type="inbox"
          accentColor="var(--info)"
          onSend={handleSendDraft}
          onArchive={handleArchive}
        />
        <KanbanColumn
          title="Prospecting"
          subtitle="Cold outreach"
          count={pipeline.PROSPECTING.length}
          cards={pipeline.PROSPECTING}
          type="prospect"
          accentColor="var(--accent)"
          onSend={handleSendDraft}
        />
        <KanbanColumn
          title="Developing"
          subtitle="In progress"
          count={pipeline.DEVELOPING.length}
          cards={pipeline.DEVELOPING}
          type="prospect"
          accentColor="var(--warning)"
          onSend={handleSendDraft}
        />
        <KanbanColumn
          title="Closed"
          subtitle="Won deals"
          count={pipeline.CLOSED.length}
          cards={pipeline.CLOSED}
          type="prospect"
          accentColor="var(--success)"
          onSend={handleSendDraft}
        />
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`${styles.toast} ${
            toast.type === 'error' ? styles.toastError : styles.toastSuccess
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
