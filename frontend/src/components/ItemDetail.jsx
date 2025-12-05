import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function ItemDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()

  useEffect(() => {
    setLoading(true)
    fetch('/api/menu')
      .then((r) => r.json())
      .then((data) => {
        // /api/menu may return an array or an object { categories: [...], promotions: [...] }
        const cats = Array.isArray(data) ? data : (data.categories || [])
        let found = null
        for (const c of cats) {
          const f = (c.items || []).find((it) => String(it.id) === String(id))
          if (f) {
            found = f
            break
          }
        }
        setItem(found)
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div>Loading...</div>
  if (!item) return <div>Item not found</div>

  const hasDiscount = item.discount_percent && item.discount_percent > 0
  const discountedPriceCents = hasDiscount
    ? Math.round(item.price_cents * (100 - item.discount_percent) / 100)
    : item.price_cents
  const discountedPrice = (discountedPriceCents / 100).toFixed(2)

  return (
    <div className="item-detail">
      <h2>{item.name}</h2>
      <p className="muted">{item.description}</p>

      <p>
        <strong>Price: </strong>
        {hasDiscount ? (
          <span>
            <span style={{ fontSize: 14, color: '#999', textDecoration: 'line-through', marginRight: 8 }}>${(item.price_cents / 100).toFixed(2)}</span>
            <span style={{ fontSize: 20, color: '#ff6b6b', fontWeight: 700 }}>${discountedPrice}</span>
            <span style={{ marginLeft: 8, color: '#ff6b6b', fontSize: 13 }}>(-{item.discount_percent}%)</span>
          </span>
        ) : (
          <strong>${(item.price_cents / 100).toFixed(2)}</strong>
        )}
      </p>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={() => addToCart(item, 1)}
          className="btn"
          style={{
            background: hasDiscount ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' : 'var(--accent)',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          Add to cart {hasDiscount ? `— $${discountedPrice}` : ''}
        </button>
      </div>
    </div>
  )
}
