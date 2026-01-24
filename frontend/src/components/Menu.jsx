import React, { useState, useEffect } from 'react'
import './components.css'
import { Link } from 'react-router-dom'
import ItemCard from './ItemCard'
import { useCart } from '../context/CartContext'

export default function Menu({ categories = [], searchQuery = '', onSearchChange }) {
  const { addToCart } = useCart()
  const [promos, setPromos] = useState([])

  useEffect(() => {
    let mounted = true

    const fetchMenu = () => {
      fetch('/api/menu')
        .then((r) => r.json())
        .then((data) => {
          if (!mounted) return
          // server returns { categories: [...], promotions: [...] }
          const cats = Array.isArray(data) ? data : (data.categories || [])
          const flat = (cats || []).flatMap((c) => (c.items || []).map((it) => ({ ...it, category: c.name })))
          // server now includes discount_percent on each item if it has an active promotion
          const promoItems = flat.filter((it) => it.discount_percent !== null && it.discount_percent !== undefined)
          if (promoItems.length > 0) {
            setPromos(promoItems.slice(0, 3))
          } else {
            setPromos([])
          }
        })
        .catch(() => {})
    }

    fetchMenu()

    // listen for admin updates (in same tab)
    const onUpdate = () => fetchMenu()
    window.addEventListener('promotions-updated', onUpdate)

    // also listen for storage events (other tabs)
    const onStorage = (e) => {
      if (e.key === 'promotions_updated_at') fetchMenu()
    }
    window.addEventListener('storage', onStorage)

    return () => {
      mounted = false
      window.removeEventListener('promotions-updated', onUpdate)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  return (
    <div className="menu menu-grid">
      <aside className="promotions">
        <div className="mb-12">
          <h2 className="promo-title">🎉 BIG DISCOUNTS</h2>
          <p className="promo-desc">Limited-time offers on selected items</p>
        </div>

        {promos.length === 0 && (
          <div className="promo-empty">
            <p>No active promotions at the moment</p>
          </div>
        )}

        <ul className="promo-list">
          {promos.map((p) => (
            <li key={p.id} className="promo-item">
              <div className="promo-row">
                <div className="promo-left">
                  <div className="promo-category">{p.name}</div>
                  <div className="promo-sub">{p.category}</div>
                  <div className="promo-sub">{p.description}</div>
                  <div className="tag-badge">{p.discount_percent}% OFF</div>
                </div>
                <div className="price-column">
                  <div className="price-now-label">Now:</div>
                  <div className="price-now">${((p.price_cents * (100 - p.discount_percent)) / 10000).toFixed(2)}</div>
                  <button className="btn btn-add" onClick={() => addToCart(p, 1)}>Add</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </aside>

      <main className="menu-main">
        {searchQuery ? (
          // filtered search results view
          <section className="section-margin">
            <h2 className="search-hero">🔍 Search Results</h2>
            <div className="items">
              {categories
                .flatMap((c) =>
                  (c.items || []).map((it) => ({ ...it, category: c }))
                )
                .filter((it) =>
                  it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  it.description.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
            </div>
          </section>
        ) : (
          // normal category view
          categories.map((c, idx) => {
            const colors = [
              { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '☕' },
              { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '🍰' },
              { bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', icon: '🥤' },
              { bg: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', icon: '🌿' },
              { bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '⭐' },
              { bg: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', icon: '✨' }
            ]
            const color = colors[idx % colors.length]
              return (
              <section key={c.id} className="category category-section">
                <div className="category-header">
                  <div className="category-icon">{color.icon}</div>
                  <h2 className="category-title gradient-text" style={{ background: color.bg }}>{c.name}</h2>
                </div>
                <div className="items">
                  {(c.items || []).map((it) => (
                    <ItemCard key={it.id} item={it} />
                  ))}
                </div>
              </section>
            )
          })
        )}

        <section className="home-hero footer-contacts">
          <div className="footer-item">
            <strong>Address</strong>
            <div>1234 Culinary Ave, Suite 100, Washington, DC 20002</div>
          </div>

          <div className="footer-item">
            <strong>Phone</strong>
            <div><a href="tel:(202)5554567" className="footer-link">(202) 555-4567</a></div>
          </div>

          <div className="footer-item">
            <strong>Hours</strong>
            <div>Monday–Saturday: 5:00 PM – 11:00 PM<br />Sunday: 5:00 PM – 9:00 PM</div>
          </div>
        </section>
      </main>
    </div>
  )
}
