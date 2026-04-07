'use client'
import styles from './KanbanColumn.module.css'
import KanbanCard from './KanbanCard'

export default function KanbanColumn({
  title,
  subtitle,
  count,
  cards,
  type,
  accentColor,
  onSend,
  onArchive,
}) {
  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.dot} style={{ background: accentColor }} />
          <div>
            <h2 className={styles.title}>{title}</h2>
            <span className={styles.subtitle}>{subtitle}</span>
          </div>
        </div>
        <span className={styles.count}>{count}</span>
      </div>

      <div className={styles.cards}>
        {cards.length === 0 && (
          <div className={styles.empty}>
            <p>Nothing here</p>
          </div>
        )}
        {cards.map((card) => (
          <KanbanCard
            key={card.id}
            card={card}
            type={type}
            onSend={onSend}
            onArchive={onArchive}
          />
        ))}
      </div>
    </div>
  )
}
