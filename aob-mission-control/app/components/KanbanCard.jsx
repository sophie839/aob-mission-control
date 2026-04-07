'use client'

import { useState } from 'react'
import styles from './KanbanCard.module.css'

export default function KanbanCard({ card, stageId, onDraftSent }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [sendingDraftId, setSendingDraftId] = useState(null)
  const [sendConfirm, setSendConfirm] = useState(null)
  const [sendSuccess, setSendSuccess] = useState(null)

  const drafts = card.drafts || []

  const handleSendDraft = async (draftId) => {
    if (sendConfirm !== draftId) {
      setSendConfirm(draftId)
      return
    }

    setSendingDraftId(draftId)
    try {
      const res = await fetch(`/api/drafts/${draftId}`, {
        method: 'POST',
      })

      if (!res.ok) {
        throw new Error('Failed to send draft')
      }

      setSendSuccess(draftId)
      setTimeout(() => {
        setSendSuccess(null)
        setSendConfirm(null)
        setIsExpanded(false)
        onDraftSent(draftId)
      }, 1500)
    } catch (error) {
      console.error('Send error:', error)
      alert('Failed to send draft: ' + error.message)
      setSendConfirm(null)
    } finally {
      setSendingDraftId(null)
    }
  }

  const getStageColorValue = (stageId) => {
    const colorMap = {
      cold: '#5856d6',
      followup: '#af52de',
      engaged: '#ff9500',
      sample: '#34c759',
      decision: '#d4850a',
      won: '#30d158',
    }
    return colorMap[stageId] || '#86868b'
  }

  const statusBadgeColor = {
    'Hot': '#ff3b30',
    'Warm': '#ff9500',
    'Cold': '#5856d6',
  }

  return (
    <>
      <div
        className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}
        style={{
          borderLeftColor: getStageColorValue(stageId),
          maxHeight: isExpanded ? '600px' : 'none',
        }}
      >
        {!isExpanded ? (
          <div
            className={styles.cardContent}
            onClick={() => setIsExpanded(true)}
          >
            <div className={styles.header}>
              <h4 className={styles.company}>{card.company}</h4>
              {card.hasDraft && <span className={styles.draftBadge}>Draft</span>}
            </div>
            <p className={styles.contact}>{card.contact}</p>
            <p className={styles.title}>{card.title}</p>
            {card.status && (
              <span
                className={styles.statusBadge}
                style={{
                  backgroundColor: statusBadgeColor[card.status] || '#86868b',
                }}
              >
                {card.status}
              </span>
            )}
          </div>
        ) : (
          <div className={styles.expandedContent}>
            <div className={styles.expandedHeader}>
              <h4 className={styles.company}>{card.company}</h4>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setIsExpanded(false)
                  setSendConfirm(null)
                }}
              >
                ✕
              </button>
            </div>

            <div className={styles.expandedInfo}>
              <p className={styles.contact}>{card.contact}</p>
              <p className={styles.title}>{card.title}</p>
              {card.email && (
                <p className={styles.email}>
                  <a href={`mailto:${card.email}`}>{card.email}</a>
                </p>
              )}
            </div>

            {drafts.length > 0 && (
              <div className={styles.draftsSection}>
                <h5>Draft Emails ({drafts.length})</h5>
                {drafts.map((draft, idx) => (
                  <div key={draft.id} className={styles.draftItem}>
                    {drafts.length > 1 && <span className={styles.draftNumber}>{idx + 1}</span>}
                    <div className={styles.draftContent}>
                      <p className={styles.draftSubject}>{draft.subject}</p>
                      <div className={styles.draftBody}>{draft.body}</div>
                    </div>
                    <div className={styles.draftActions}>
                      {sendSuccess === draft.id ? (
                        <div className={styles.successState}>
                          <span>✓ Sent!</span>
                        </div>
                      ) : (
                        <>
                          <button
                            className={styles.sendButton}
                            onClick={() => handleSendDraft(draft.id)}
                            disabled={sendingDraftId === draft.id}
                          >
                            {sendingDraftId === draft.id ? (
                              <>
                                <span className={styles.spinner}></span>
                                Sending...
                              </>
                            ) : sendConfirm === draft.id ? (
                              'Confirm Send?'
                            ) : (
                              'Send Email'
                            )}
                          </button>
                          <a
                            href={`https://mail.google.com/mail/u/0/#draft/${draft.messageId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.openGmailLink}
                          >
                            Open in Gmail →
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {card.notes && (
              <div className={styles.notesSection}>
                <h5>Notes</h5>
                <p>{card.notes}</p>
              </div>
            )}

            {card.status && (
              <div className={styles.statusSection}>
                <span
                  className={styles.statusBadgeLarge}
                  style={{
                    backgroundColor: statusBadgeColor[card.status] || '#86868b',
                  }}
                >
                  {card.status}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
