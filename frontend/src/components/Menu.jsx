import React from 'react'
import { Link } from 'react-router-dom'
import ItemCard from './ItemCard'

export default function Menu({ categories = [] }) {
  return (
    <div className="menu">
      {categories.map((c) => (
        <section key={c.id} className="category">
          <h2>{c.name}</h2>
          <div className="items">
            {(c.items || []).map((it) => (
              <ItemCard key={it.id} item={it} />
            ))}
          </div>
        </section>
      ))}

      <section className="home-hero" style={{ padding: 20, borderTop: '1px solid #eee', marginTop: 20 }}>
        <h1 style={{ margin: 0 }}>Café Fausse</h1>
        <p style={{ margin: '6px 0' }}>
          <strong>Email:</strong> <a href="mailto:silungwegod@gmail.com">silungwegod@gmail.com</a>
          &nbsp;•&nbsp;
          <strong>Phone:</strong> <a href="tel:+265995718815">+265 99 571 8815</a>
        </p>

        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          <div>
            <h4 style={{ margin: '6px 0' }}>Hours</h4>
            <ul style={{ marginTop: 6 }}>
              <li>Mon–Fri: 07:30 — 19:00</li>
              <li>Sat: 08:00 — 18:00</li>
              <li>Sun: 09:00 — 15:00</li>
            </ul>
          </div>

          <div>
            <h4 style={{ margin: '6px 0' }}>Quick links</h4>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Link to="/menu">View Menu</Link>
              <Link to="/cart">Your Cart</Link>
              <Link to="/reserve">Make a Reservation</Link>
              <Link to="/about">About Us</Link>
              <Link to="/gallery">Gallery</Link>
            </nav>
          </div>
        </div>
      </section>
    </div>
  )
}
