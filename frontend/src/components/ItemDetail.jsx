import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatMWK } from '../utils/currency'

export default function ItemDetail() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToCart } = useCart()
  const [cartAnimation, setCartAnimation] = useState(null)

  const handleAddToCart = (event) => {
    addToCart(item, 1)
    
    // Create animation element
    const rect = event.target.getBoundingClientRect()
    const animationElement = {
      id: Date.now(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      image: item.image_filename ? `/api/images/${item.image_filename}` : null
    }
    
    setCartAnimation(animationElement)
    
    // Remove animation after it completes
    setTimeout(() => {
      setCartAnimation(null)
    }, 800)
  }

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
            <span style={{ fontSize: 14, color: '#999', textDecoration: 'line-through', marginRight: 8 }}>{formatMWK(item.price_cents)}</span>
            <span style={{ fontSize: 20, color: '#ff6b6b', fontWeight: 700 }}>MK{discountedPrice}</span>
            <span style={{ marginLeft: 8, color: '#ff6b6b', fontSize: 13 }}>(-{item.discount_percent}%)</span>
          </span>
        ) : (
          <strong>{formatMWK(item.price_cents)}</strong>
        )}
      </p>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={handleAddToCart}
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
          Order {hasDiscount ? `— MK${discountedPrice}` : ''}
        </button>
      </div>

      {cartAnimation && (
        <div
          className="cart-animation"
          style={{
            left: cartAnimation.x - 25,
            top: cartAnimation.y - 25,
            backgroundImage: cartAnimation.image ? `url(${cartAnimation.image})` : 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            width: 50,
            height: 50,
            borderRadius: '50%',
            border: '2px solid var(--accent)'
          }}
        />
      )}
    </div>
  )
}
