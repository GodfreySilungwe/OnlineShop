import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function ItemCard({ item }) {
  const { addToCart } = useCart()

  return (
    <div className="item-card">
      <h3>
        <Link to={`/item/${item.id}`}>{item.name}</Link>
      </h3>
      <p className="muted">{item.description}</p>
      <div className="item-row">
        <strong>{(item.price_cents / 100).toFixed(2)}</strong>
        <div>
          <button onClick={() => addToCart(item, 1)}>Add</button>
        </div>
      </div>
    </div>
  )
}
