'use client'

import { useState } from 'react'
import styles from './InboxBanner.module.css'

export default function InboxBanner({ items }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const defaultItems = [
    {
      id: '1',
      from: 'Daniel Zakri',
      subject: 'Healthcare strategy discussion',
      priority: 'REPLY NEEDED',
    },
    {
      id: '2',
      from: 'TikTok Ads',
      subject: 'Ad budget running out',
      priority: 'URGENT',
    },
    {
      id: '3',
      from: 'Eve Albert',
      subject: 'Latest deck request',
      priority: 'REPLY NEEDED',
    },
    {
      id: '4',
      from: 'Notion SF',
      subject: 'Tasting event 4/8',
      priority: 'PREP NEEDED',
    },
    {
      id: '5',
      from: 'Alicia Militello',
      subject: 'Call confirmed Friday',
      priority: 'CONFIRMED',
    },
    {
      id: '6',
      from: 'Emberlyn Toms',
      subject: 'Rescheduled call',
      priority: 'RESCHEDULED',
    },
    {
      id: '7',
      from: 'Euka Bot',
      subject: 'System notice: exhausted',
      priority: 'ALERT',
    },
    {
      id: '8',
      from: 'Klaviyo',
      subject: 'Domain disconnected',
      priority: 'ALERT',
    },
  ]

  const displayItems = items && items.length > 0 ? items : defaultItems

  const getPriorityColor = (priority) => {
    const colorMap = {
      'REPLY NEEDED': '#ff3b30',
      'URGENT': '#ff9500',
      'PREP NEEDED': '#ff9500',
      'ALERT': '#ff3b30',
      'RESCHEDULED': '#5856d6',
      'CONFIRMED': '#34c759',
    }
    return colorMap[priority] || '#86868b'
  }

  return (
    <div className={styles.banner}>
      <button
        className={styles.toggleButton}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand inbox' : 'Collapse inbox'}
      >
        {isCollapsed ? '▶' : '▼'} Inbox ({displayItems.length})
      </button>

      {!isCollapsed && (
        <div className={styles.itemsContainer}>
          {displayItems.slice(0, 8).map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemContent}>
                <p className={styles.from}>{item.from || item.subject}</p>
                <p className={styles.subject}>{item.subject || item.preview}</p>
              </div>
              <span
                className={styles.priorityBadge}
                style={{
                  backgroundColor: getPriorityColor(item.priority || 'URGENT'),
                }}
              >
                {item.priority || 'URGENT'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
