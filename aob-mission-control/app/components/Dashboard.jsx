'use client'

import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import KanbanBoard from './KanbanBoard'
import InboxBanner from './InboxBanner'
import MetricsBar from './MetricsBar'
import styles from './Dashboard.module.css'

export default function Dashboard({ session }) {
  const [loading, setLoading] = useState(true)
  const [pipelineData, setPipelineData] = useState([])
  const [drafts, setDrafts] = useState([])
  const [inboxItems, setInboxItems] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [pipelineRes, draftsRes, inboxRes] = await Promise.all([
          fetch('/api/pipeline'),
          fetch('/api/drafts'),
          fetch('/api/inbox'),
        ])

        if (!pipelineRes.ok || !draftsRes.ok || !inboxRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const pipelineData = await pipelineRes.json()
        const draftsData = await draftsRes.json()
        const inboxData = await inboxRes.json()

        const draftMap = {}
        draftsData.forEach((draft) => {
          const email = draft.to?.split('@')[0]?.toLowerCase() || ''
          if (!draftMap[email]) {
            draftMap[email] = []
          }
          draftMap[email].push(draft)
        })

        const enrichedPipeline = pipelineData.map((stage) => ({
          ...stage,
          cards: stage.cards.map((card) => {
            const matchingDrafts = draftMap[card.email?.split('@')[0]?.toLowerCase()] || []
            return {
              ...card,
              hasDraft: matchingDrafts.length > 0,
              drafts: matchingDrafts,
            }
          }),
        }))

        setPipelineData(enrichedPipeline)
        setDrafts(draftsData)
        setInboxItems(inboxData)
      } catch (err) {
        console.error('Data fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleDraftSent = async (draftId) => {
    setDrafts((prev) => prev.filter((d) => d.id !== draftId))
    const newPipeline = pipelineData.map((stage) => ({
      ...stage,
      cards: stage.cards.map((card) => ({
        ...card,
        drafts: (card.drafts || []).filter((d) => d.id !== draftId),
        hasDraft: (card.drafts || []).some((d) => d.id !== draftId),
      })),
    }))
    setPipelineData(newPipeline)
  }

  const handleRefresh = () => {
    setLoading(true)
    window.location.reload()
  }

  if (loading && pipelineData.length === 0) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Mission Control</h1>
          <p className={styles.subtitle}>The Art of Broth — Kyle, COO</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshButton} onClick={handleRefresh} title="Refresh">
            ↻
          </button>
          <button className={styles.signOutButton} onClick={() => signOut()}>
            Sign Out
          </button>
        </div>
      </header>

      <InboxBanner items={inboxItems} />
      <MetricsBar pipeline={pipelineData} drafts={drafts} />

      <main className={styles.main}>
        {error && <div className={styles.error}>{error}</div>}
        <KanbanBoard stages={pipelineData} onDraftSent={handleDraftSent} />
      </main>
    </div>
  )
}
