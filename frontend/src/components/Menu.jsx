import React from 'react'
import ItemCard from './ItemCard'

export default function Menu({ categories = [], searchQuery = '', onSearchChange }) {
  return (
    <div className="menu menu-grid">
      <main className="menu-main">
        {searchQuery ? (
          <section className="search-results-section">
            <h2 className="section-title">🔍 Search results</h2>
            <div className="items">
              {categories
                .flatMap((c) => (c.items || []).map((it) => ({ ...it, category: c.name })))
                .filter((it) =>
                  it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  it.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((it) => <ItemCard key={it.id} item={it} />)}
            </div>
          </section>
        ) : (
          categories.map((c, idx) => (
            <section key={c.id} className="category" style={{ marginBottom: 32 }}>
              <div className="category-heading">
                <div className="category-icon">{['☕', '🍰', '🥤', '🌿', '⭐', '✨'][idx % 6]}</div>
                <h2 className="category-title">{c.name}</h2>
              </div>
              <div className="items">
                {(c.items || []).map((it) => <ItemCard key={it.id} item={it} />)}
              </div>
            </section>
          ))
        )}
      </main>
    </div>
  )
}
