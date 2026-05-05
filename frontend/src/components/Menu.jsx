import React, { useEffect, useMemo, useState } from 'react'
import ItemCard from './ItemCard'

export default function Menu({ categories = [], searchQuery = '' }) {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200)
  const [expandedCategories, setExpandedCategories] = useState({})

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isCompact = windowWidth <= 720
  const isMedium = windowWidth > 720 && windowWidth <= 900
  const itemLimit = isCompact ? 2 : isMedium ? 4 : Infinity

  const filteredItems = useMemo(() => {
    if (!searchQuery) return null
    const query = searchQuery.toLowerCase()
    return categories
      .flatMap((c) => (c.items || []).map((it) => ({ ...it, category: c.name })))
      .filter((it) =>
        it.name.toLowerCase().includes(query) ||
        (it.description || '').toLowerCase().includes(query)
      )
  }, [categories, searchQuery])

  const getVisibleItems = (items, categoryId) => {
    if (windowWidth > 900) return items
    const limit = Math.min(itemLimit, items.length)
    return expandedCategories[categoryId] ? items : items.slice(0, limit)
  }

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }))
  }

  return (
    <div className="menu menu-grid">
      <main className="menu-main">
        {filteredItems ? (
          <section className="search-results-section">
            <h2 className="section-title">🔍 Search results</h2>
            <div className="items search-items">
              {filteredItems.map((it) => (
                <ItemCard key={it.id} item={it} />
              ))}
            </div>
          </section>
        ) : (
          categories.map((c, idx) => {
            const items = c.items || []
            const visibleItems = getVisibleItems(items, c.id)
            const isExpanded = expandedCategories[c.id]
            return (
              <section key={c.id} className="category">
                <button
                  type="button"
                  className="category-heading"
                  onClick={() => isCompact && toggleCategory(c.id)}
                >
                  <div>
                    <span className="category-icon">{['☕', '🍰', '🥤', '🌿', '⭐', '✨'][idx % 6]}</span>
                    <h2 className="category-title">{c.name}</h2>
                  </div>
                  {isCompact && (
                    <span className="category-toggle">
                      {isExpanded ? 'Hide' : `Show ${Math.min(itemLimit, items.length)} of ${items.length}`}
                    </span>
                  )}
                </button>

                <div className={`items category-items${isCompact ? ' compact' : ''}${!isExpanded && windowWidth <= 900 ? ' collapsed' : ''}`}>
                  {visibleItems.map((it) => (
                    <ItemCard key={it.id} item={it} />
                  ))}
                </div>

                {windowWidth <= 900 && items.length > itemLimit && (
                  <button
                    type="button"
                    className="btn btn-tertiary category-view-all"
                    onClick={() => toggleCategory(c.id)}
                  >
                    {isExpanded ? 'Show less' : `View all ${items.length}`}
                  </button>
                )}
              </section>
            )
          })
        )}
      </main>
    </div>
  )
}
