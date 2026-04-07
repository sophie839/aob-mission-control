'use client'
import { useState } from 'react'
import styles from './KanbanCard.module.css'

export default function KanbanCard({ card, type, onSend, onArchive }) {
  const [expanded, setExpanded] = useState(false)
  const [sending, setSending] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [confirmSend, setConfirmSend] = useState(false)

  const handleSend = async (e) => {
    e.stopPropagation()
    if (!confirmSend) {
      setConfirmSend(true)
      return
    }
    setSending(true)
    await onSend(card.draftId, type, card.id)
    setSending(false)
    setConfirmSend(false)
  }

  const handleArchive = async (e) => {
    e.stopPropagation()
    setArchiving(true)
    await onArchive(card.id)
    setArchiving(false)
  }

  const cancelSend = (e) => {
    e.stopPropagation()
    setConfirmSend(false)
  }

  if (type === 'inbox') {
    return (
      <div
        className={`${styles.card} ${expanded ? styles.expanded : ''} ${
          card.isUnread ? styles.unread : ''
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={styles.cardTop}>
          <div className={styles.senderRow}>
            <span className={styles.sender}>{card.from}</span>
            <span
              className={`${styles.urgency} ${
                card.urgency === 'HIGH'
                  ? styles.urgencyHigh
                  : card.urgency === 'MEDIUM'
                  ? styles.urgencyMed
                  : styles.urgencyLow
              }`}
            >
              {card.urgency === 'HIGH' ? 'Priority' : card.urgency === 'MEDIUM' ? 'New' : 'Low'}
            </span>
          </div>
          <p className={styles.subject}>{card.subject}</p>
          {!expanded && <p className={styles.preview}>{card.preview}</p>}
        </div>

        {expanded && (
          <div className={styles.expandedContent}>
            <p className={styles.fullPreview}>{card.preview}</p>

            {card.hasDraft && (
              <div className={styles.draftSection}>
                <div className={styles.draftLabel}>Kyle's Draft Response</div>
                <p className={styles.draftPreview}>{card.draftBody || card.draftPreview}</p>
              </div>
            )}

            <div className={styles.actions}>
              {card.hasDraft && !confirmSend && (
                <button
                  className={styles.approveBtn}
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? 'Sending...' : 'Approve & Send'}
                </button>
              )}

              {confirmSend && (
                <div className={styles.confirmRow}>
                  <button
                    className={styles.confirmBtn}
                    onClick={handleSend}
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : 'Confirm Send'}
                  </button>
                  <button className={styles.cancelBtn} onClick={cancelSend}>
                    Cancel
                  </button>
                </div>
              )}

              {!card.hasDraft && (
                <span className={styles.noDraft}>No draft — Kyle will prepare one</span>
              )}

              <button
                className={styles.archiveBtn}
                onClick={handleArchive}
                disabled={archiving}
              >
                {archiving ? 'Archiving...' : 'Dismiss'}
              </button>
            </div>
          </div>
        )}

        {card.hasDraft && !expanded && (
          <div className={styles.draftBadge}>Draft ready</div>
        )}
      </div>
    )
  }

  // Prospect card
  return (
    <div
      className={`${styles.card} ${styles.prospectCard} ${
        expanded ? styles.expanded : ''
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className={styles.cardTop}>
        <div className={styles.prospectHeader}>
          <h3 className={styles.company}>{card.company}</h3>
          {card.stageLabel && (
            <span className={styles.stageBadge}>{card.stageLabel}</span>
          )}
        </div>
        <p className={styles.contact}>{card.contact}</p>
        <p className={styles.contactTitle}>{card.title}</p>
        {card.vertical && !expanded && (
          <span className={styles.vertical}>{card.vertical}</span>
        )}
      </div>

      {expanded && (
        <div className={styles.expandedContent}>
          {card.vertical && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Vertical</span>
              <span className={styles.vertical}>{card.vertical}</span>
            </div>
          )}
          {card.email && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email</span>
              <span className={styles.detailValue}>{card.email}</span>
            </div>
          )}
          {card.lastContact && (
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Last Contact</span>
              <span className={styles.detailValue}>{card.lastContact}</span>
            </div>
          )}
          {card.notes && (
            <div className={styles.notes}>
              <span className={styles.detailLabel}>Notes</span>
              <p className={styles.notesText}>{card.notes}</p>
            </div>
          )}

          {card.hasDraft && (
            <div className={styles.draftSection}>
              <div className={styles.draftLabel}>Draft Email</div>
              <p className={styles.draftPreview}>
                To: {card.email}
                {'\n'}
                {card.draftPreview}
              </p>
            </div>
          )}

          <div className={styles.actions}>
            {card.hasDraft && !confirmSend && (
              <button
                className={styles.approveBtn}
                onClick={handleSend}
                disabled={sending}
              >
                {sending ? 'Sending...' : 'Send Draft'}
              </button>
            )}

            {confirmSend && (
              <div className={styles.confirmRow}>
                <button
                  className={styles.confirmBtn}
                  onClick={handleSend}
                  disabled={sending}
                >
                  {sending ? 'Sending...' : 'Confirm Send'}
                </button>
                <button className={styles.cancelBtn} onClick={cancelSend}>
                  Cancel
                </button>
              </div>
            )}

            {!card.hasDraft && (
              <span className={styles.noDraft}>No draft prepared yet</span>
            )}
          </div>
        </div>
      )}

      {card.hasDraft && !expanded && (
        <div className={styles.draftBadge}>Draft ready</div>
      )}
    </div>
  )
}
