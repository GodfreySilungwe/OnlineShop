import React from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'


export default function ItemCard({ item }) {
  const { addToCart } = useCart()
  const img = item && item.image_filename ? item.image_filename : null
  const hasDiscount = item.discount_percent && item.discount_percent > 0
  const discountedPrice = hasDiscount ? ((item.price_cents * (100 - item.discount_percent)) / 10000).toFixed(2) : null

  return (
    <div className="item-card card">
      {img ? (
        <div
          className="thumb"
          style={{ backgroundImage: `linear-gradient(135deg, rgba(107, 114, 128, 0.3) 0%, rgba(55, 65, 81, 0.3) 100%), url(/api/images/${img})` }}
          aria-hidden
        />
      ) : (
        <div className="card-img-placeholder" />
      )}

      {hasDiscount && (
        <div className="discount-badge">🎉 {item.discount_percent}% OFF</div>
      )}

      <div className="card-content">
        <h3 className="card-title">
          <Link to={`/item/${item.id}`} className="link-accent">{item.name}</Link>
        </h3>
        <p className="muted card-desc">{item.description}</p>

        <div className="item-row">
          <div>
            {hasDiscount ? (
              <div>
                <div className="price-old">${(item.price_cents / 100).toFixed(2)}</div>
                <strong className="price-current">${discountedPrice}</strong>
              </div>
            ) : (
              <strong className="price-plain">${(item.price_cents / 100).toFixed(2)}</strong>
            )}
          </div>
          <button
            onClick={() => addToCart(item, 1)}
            className={`btn-gradient ${hasDiscount ? 'discount' : ''}`}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
