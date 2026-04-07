'use client'

import KanbanCard from './KanbanCard'
import styles from './KanbanColumn.module.css'

export default function KanbanColumn({ stage, onDraftSent }) {
  const getStageColor = (stageId) => {
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

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div
            className={styles.dot}
            style={{ backgroundColor: getStageColor(stage.id) }}
          ></div>
          <h3>{stage.name}</h3>
        </div>
        <span className={styles.count}>{stage.cards.length}</span>
      </div>
      <div className={styles.cardList}>
        {stage.cards.length === 0 ? (
          <div className={styles.emptyState}>No items</div>
        ) : (
          stage.cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              stageId={stage.id}
              onDraftSent={onDraftSent}
            />
          ))
        )}
      </div>
    </div>
  )
}
