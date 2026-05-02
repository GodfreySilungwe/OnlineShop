import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { formatMWK } from '../utils/currency'


export default function ItemCard({ item }) {
  const { addToCart } = useCart()
  const [cartAnimation, setCartAnimation] = useState(null)
  const img = item && item.image_filename ? item.image_filename : null
  const hasDiscount = item.discount_percent && item.discount_percent > 0
  const discountedPrice = hasDiscount ? ((item.price_cents * (100 - item.discount_percent)) / 10000).toFixed(2) : null

  const handleAddToCart = (event) => {
    addToCart(item, 1)
    
    // Create animation element
    const rect = event.target.getBoundingClientRect()
    const animationElement = {
      id: Date.now(),
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      image: img ? `/api/images/${img}` : null
    }
    
    setCartAnimation(animationElement)
    
    // Remove animation after it completes
    setTimeout(() => {
      setCartAnimation(null)
    }, 800)
  }

  return (
    <div className="item-card" style={{ background: 'var(--surface)', boxShadow: '0 12px 32px rgba(0,0,0,0.1)', borderRadius: '16px', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', cursor: 'pointer', position: 'relative' }}>
      {img ? (
        <div
          className="thumb"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(55, 65, 81, 0.3) 100%), url(/api/images/${img})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            height: '160px',
            position: 'relative'
          }}
          aria-hidden
        />
      ) : (
        <div style={{ height: '160px', background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)' }} />
      )}

      {hasDiscount && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontWeight: 700,
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
          zIndex: 10
        }}>
          🎉 {item.discount_percent}% OFF
        </div>
      )}

      <div className="card-content" style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 className="card-title" style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>
          <Link to={`/item/${item.id}`} style={{ color: 'var(--accent)', textDecoration: 'none', transition: 'color 0.2s' }}>{item.name}</Link>
        </h3>
        <p className="muted card-desc" style={{ margin: '0 0 12px 0', color: 'var(--muted)', fontSize: '13px', lineHeight: 1.4, flex: 1 }}>{item.description}</p>

        <div className="item-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
          <div>
            {hasDiscount ? (
              <div>
                <div style={{ fontSize: '11px', color: '#999', textDecoration: 'line-through', marginBottom: 2 }}>{formatMWK(item.price_cents)}</div>
                <strong style={{ fontSize: '18px', color: '#ff6b6b' }}>MK{discountedPrice}</strong>
              </div>
            ) : (
              <strong style={{ fontSize: '16px' }}>{formatMWK(item.price_cents)}</strong>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            className="btn"
            style={{
              background: hasDiscount ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' : 'var(--accent)',
              color: 'white',
              border: 'none',
              padding: '8px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s',
              boxShadow: hasDiscount ? '0 4px 12px rgba(255, 107, 107, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
          >
            Order
          </button>
        </div>
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
