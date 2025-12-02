import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

// Example card images served from backend `/api/images/*`.
// If you add different filenames to the Images/ folder, update this list.
const CARD_IMAGES = [
  'gallery-ribeye-steak.webp',
  'gallery-special-event.webp'
]

export default function ItemCard({ item }) {
  const { addToCart } = useCart()
  const img = CARD_IMAGES[(item.id || 0) % CARD_IMAGES.length]

  return (
    <div className="item-card">
      <div
        className="thumb"
        style={{ backgroundImage: `url(/api/images/${img})` }}
        aria-hidden
      />

      <div className="card-content">
        <h3 className="card-title">
          <Link to={`/item/${item.id}`}>{item.name}</Link>
        </h3>
        <p className="muted card-desc">{item.description}</p>

        <div className="item-row" style={{ marginTop: 12 }}>
          <strong>{(item.price_cents / 100).toFixed(2)}</strong>
          <div>
            <button onClick={() => addToCart(item, 1)} className="btn">Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}
