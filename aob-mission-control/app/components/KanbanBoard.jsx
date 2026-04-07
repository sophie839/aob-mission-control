'use client'

import { useRef, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import styles from './KanbanBoard.module.css'

export default function KanbanBoard({ stages, onDraftSent }) {
  const scrollContainerRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const handleMouseDown = (e) => {
    setIsDragging(true)
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft)
    setScrollLeft(scrollContainerRef.current.scrollLeft)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - scrollContainerRef.current.offsetLeft
    const walk = x - startX
    scrollContainerRef.current.scrollLeft = scrollLeft - walk
  }

  return (
    <div
      className={styles.board}
      ref={scrollContainerRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
    >
      {stages.map((stage) => (
        <KanbanColumn
          key={stage.id}
          stage={stage}
          onDraftSent={onDraftSent}
        />
      ))}
    </div>
  )
}
