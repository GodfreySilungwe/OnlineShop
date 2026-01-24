import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import './components.css'

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
            <span className="price-old">${(item.price_cents / 100).toFixed(2)}</span>
            <span className="price-current">${discountedPrice}</span>
            <span className="price-current discount-percent">(-{item.discount_percent}%)</span>
          </span>
        ) : (
          <strong className="price-plain">${(item.price_cents / 100).toFixed(2)}</strong>
        )}
      </p>

      <div className="mb-12">
        <button
          onClick={() => addToCart(item, 1)}
          className={`btn-gradient btn-add-large ${hasDiscount ? 'discount' : ''}`}
        >
          Add to cart {hasDiscount ? `— $${discountedPrice}` : ''}
        </button>
      </div>
    </div>
  )
}
