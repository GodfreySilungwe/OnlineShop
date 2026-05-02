import React, { useState } from 'react'
import { useCart } from '../context/CartContext'
import { formatMWK } from '../utils/currency'

export default function Cart() {
  const { items, clearCart, updateQuantity, removeFromCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [customer, setCustomer] = useState({ customer_name: '', customer_email: '', customer_phone: '' })
  const [error, setError] = useState(null)

  const totalCents = items.reduce((s, it) => s + (it.price_cents || 0) * (it.qty || 1), 0)
  const originalTotalCents = items.reduce((s, it) => {
    const orig = it.original_price_cents || it.price_cents || 0
    return s + orig * (it.qty || 1)
  }, 0)
  const savings = originalTotalCents - totalCents

  async function handleCheckout(e) {
    e.preventDefault()
    setError(null)
    if (!customer.customer_name) {
      setError('Please enter your name')
      return
    }
    if (items.length === 0) {
      setError('Add items to your cart before checkout')
      return
    }

    const payload = {
      items: items.map((it) => ({ menu_item_id: it.id, qty: it.qty })),
      ...customer,
    }
    setLoading(true)
    try {
      const res = await fetch('/api/stripe-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Checkout failed')
      } else if (data.url) {
        window.location.href = data.url
      } else {
        setError('Failed to get checkout URL')
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (orderId)
    return (
      <div className="cart-page">
        <div className="cart-main card-panel">
          <h2>Thank you!</h2>
          <p>Your order has been received. We will send next steps to your email shortly.</p>
        </div>
      </div>
    )

  return (
    <div className="cart-page">
      <div className="cart-wrapper">
        <main className="cart-main card-panel">
          <div className="cart-header">
            <div>
              <h2>Shopping cart</h2>
              <p className="muted-small">{items.length === 0 ? 'Your cart is empty.' : `${items.length} item${items.length === 1 ? '' : 's'} in cart`}</p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => {
              if (!items.length) return
              if (window.confirm('Clear cart?')) clearCart()
            }}>
              Clear cart
            </button>
          </div>

          {items.length === 0 ? (
            <div className="empty-cart-card">
              <p>No items yet. Browse the menu to add premium favorites.</p>
            </div>
          ) : (
            <ul className="cart-list">
              {items.map((it) => {
                const hasDiscount = it.discount_percent && it.discount_percent > 0
                const originalPrice = it.original_price_cents ? formatMWK(it.original_price_cents) : null
                return (
                  <li key={it.id} className="cart-item">
                    <div className="cart-item-details">
                      <div>
                        <h3>{it.name}</h3>
                        <div className="muted-small">{it.qty} × {formatMWK(it.price_cents)}</div>
                        {hasDiscount && originalPrice && (
                          <div className="cart-item-original">{originalPrice} each</div>
                        )}
                      </div>
                      {hasDiscount && <span className="cart-badge">{it.discount_percent}% OFF</span>}
                    </div>

                    <div className="cart-item-actions">
                      <div className="quantity-control">
                        <button type="button" className="qty-btn" onClick={() => updateQuantity(it.id, it.qty - 1)}>-</button>
                        <span>{it.qty}</span>
                        <button type="button" className="qty-btn" onClick={() => updateQuantity(it.id, it.qty + 1)}>+</button>
                      </div>
                      <button type="button" className="btn btn-tertiary btn-sm" onClick={() => removeFromCart(it.id)}>Remove</button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </main>

        <aside className="cart-summary card-panel">
          <div className="summary-header">
            <h3>Order summary</h3>
            <p className="muted-small">A polished checkout experience, ready for guests.</p>
          </div>
          <div className="summary-row">
            <span>Subtotal</span>
            <strong>{formatMWK(totalCents)}</strong>
          </div>
          {savings > 0 && (
            <div className="summary-row savings-row">
              <span>You save</span>
              <strong>{formatMWK(savings)}</strong>
            </div>
          )}
          <div className="summary-row total-row">
            <span>Total</span>
            <strong>{formatMWK(totalCents)}</strong>
          </div>

          <form onSubmit={handleCheckout} className="checkout-form">
            <div className="checkout-field">
              <label>Name</label>
              <input value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} placeholder="Full name" />
            </div>
            <div className="checkout-field">
              <label>Email</label>
              <input type="email" value={customer.customer_email} onChange={(e) => setCustomer({ ...customer, customer_email: e.target.value })} placeholder="you@example.com" />
            </div>
            <div className="checkout-field">
              <label>Phone</label>
              <input type="tel" value={customer.customer_phone} onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })} placeholder="+265 99 123 4567" />
            </div>
            {error && <div className="msg error">{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading || items.length === 0}>
              {loading ? 'Processing…' : 'Proceed to checkout'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  )
}
