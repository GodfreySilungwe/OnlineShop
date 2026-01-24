import React, { useState } from 'react'
import { useCart } from '../context/CartContext'
import './Cart.css'

export default function Cart() {
  const { items, clearCart, addToCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [customer, setCustomer] = useState({ customer_name: '', customer_email: '', customer_phone: '' })
  const [error, setError] = useState(null)

  const totalCents = items.reduce((s, it) => s + (it.price_cents || 0) * (it.qty || 1), 0)
  
  // Calculate original price (before any discounts)
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
    const payload = {
      items: items.map((it) => ({ menu_item_id: it.id, qty: it.qty })),
      ...customer,
    }
    setLoading(true)
    try {
      let res, data
      if (paymentMethod === 'airtel') {
        // Call backend Airtel checkout which will create an order and request Airtel payment
        try {
          res = await fetch('/api/airtel-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        } catch (networkErr) {
          setError('Network error: ' + String(networkErr))
          return
        }

        let body = null
        try {
          body = await res.json()
        } catch (parseErr) {
          // non-JSON response
          try {
            body = { text: await res.text() }
          } catch (e) {
            body = { error: 'failed to read response' }
          }
        }

        if (!res.ok) {
          const errMsg = (body && (body.error || body.message)) || `Airtel checkout failed (status ${res.status})`
          setError(errMsg)
        } else {
          // If Airtel returns a redirect URL, follow it; otherwise show order id / message
          const maybeUrl = body.url || (body.response && (body.response.redirectUrl || body.response.url || body.response.paymentUrl))
          if (maybeUrl) {
            window.location.href = maybeUrl
          } else if (body.orderId) {
            setOrderId(body.orderId)
          } else {
            setOrderId(body.order_id || body.orderId)
          }
        }
      } else {
        // Call Stripe checkout endpoint
        res = await fetch('/api/stripe-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Checkout failed')
        } else {
          // Redirect to Stripe checkout
          if (data.url) {
            window.location.href = data.url
          } else {
            setError('Failed to get checkout URL')
          }
        }
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  // promotions removed from Cart; promos are shown on main Menu page now

  if (orderId)
    return (
      <div>
        <h2>Thank you!</h2>
        <p>Your order id: {orderId}</p>
      </div>
    )

  return (
    <div className="cart">
      <main className="cart-main">
        <h2>Cart</h2>
        <div className="cart-header-row">
          <div className="muted-small">{items.length === 0 ? 'Your cart is empty' : `${items.length} item(s)`}</div>
          <div className="cart-actions">
            <button type="button" className="btn" onClick={() => {
              if (!items.length) return
              if (window.confirm('Clear cart?')) clearCart()
            }}>Clear cart</button>
          </div>
        </div>

        <ul className="cart-list">
          {items.map((it) => {
            const hasDiscount = it.discount_percent && it.discount_percent > 0
            const originalPrice = it.original_price_cents ? (it.original_price_cents / 100).toFixed(2) : null
            const discountedPrice = (it.price_cents / 100).toFixed(2)
            return (
              <li key={it.id} className={`cart-item ${hasDiscount ? 'discounted' : ''}`}>
                <div className="cart-item-row">
                  <div className="cart-item-info">
                    <strong>{it.name}</strong> x {it.qty}
                    {hasDiscount && <span className="cart-item-discount">🎉 {it.discount_percent}% OFF</span>}
                  </div>
                  <div className="cart-price-area">
                    {hasDiscount && originalPrice && (
                      <div className="cart-price-original">${originalPrice} each</div>
                    )}
                    <div>{discountedPrice} each</div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <p className="cart-total">
          <strong>Total: </strong>
          {(totalCents / 100).toFixed(2)}
          {savings > 0 && (
            <span className="cart-savings">
              💰 You saved: ${(savings / 100).toFixed(2)}
            </span>
          )}
        </p>

        <form onSubmit={handleCheckout} className="cart-form">
          <div className="payment-row">
            <div className="payment-label">Payment method:</div>
            <label className="payment-option">
              <input type="radio" name="payment" value="card" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
              <span>Stripe</span>
            </label>
            <label className="payment-option">
              <input type="radio" name="payment" value="airtel" checked={paymentMethod === 'airtel'} onChange={() => setPaymentMethod('airtel')} />
              <span>Airtel Money</span>
            </label>
          </div>
          <div>
            <label>Name</label>
            <input className="input" value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} />
          </div>
          <div>
            <label>Email</label>
            <input className="input" value={customer.customer_email} onChange={(e) => setCustomer({ ...customer, customer_email: e.target.value })} />
          </div>
          <div>
            <label>Phone</label>
            <input className="input" value={customer.customer_phone} onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })} />
          </div>
          {error && <div className="error">{error}</div>}
          <div className="checkout-button-wrap">
            <button type="submit" disabled={loading || items.length === 0}>{loading ? 'Processing...' : 'Checkout'}</button>
          </div>
        </form>
      </main>
    </div>
  )
}
