'use client'

import styles from './MetricsBar.module.css'

export default function MetricsBar({ pipeline, drafts }) {
  const totalCards = pipeline.reduce((sum, stage) => sum + stage.cards.length, 0)
  const cardsWithDrafts = pipeline.reduce(
    (sum, stage) =>
      sum +
      stage.cards.filter((card) => card.hasDraft || (card.drafts && card.drafts.length > 0))
        .length,
    0
  )

  const metrics = [
    {
      label: 'Total Prospects',
      value: totalCards,
      color: '--text-primary',
    },
    {
      label: 'Ready to Send',
      value: drafts.length,
      color: '--accent',
    },
    {
      label: 'With Drafts',
      value: cardsWithDrafts,
      color: '--stage-engaged',
    },
    {
      label: 'Pipeline Stages',
      value: pipeline.length,
      color: '--stage-cold',
    },
  ]

  return (
    <div className={styles.metricsBar}>
      {metrics.map((metric, idx) => (
        <div key={idx} className={styles.metric}>
          <p className={styles.label}>{metric.label}</p>
          <p className={styles.value} style={{ color: `var(${metric.color})` }}>
            {metric.value}
          </p>
        </div>
      ))}
    </div>
  )
}
