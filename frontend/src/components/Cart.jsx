import React, { useState } from 'react'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [customer, setCustomer] = useState({ customer_name: '', customer_email: '', customer_phone: '' })
  const [error, setError] = useState(null)

  const totalCents = items.reduce((s, it) => s + (it.price_cents || 0) * (it.qty || 1), 0)

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
      const res = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Checkout failed')
      } else {
        setOrderId(data.order_id)
        clearCart()
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  if (orderId)
    return (
      <div>
        <h2>Thank you!</h2>
        <p>Your order id: {orderId}</p>
      </div>
    )

  return (
    <div>
      <h2>Cart</h2>
      {items.length === 0 && <p>Your cart is empty</p>}
      <ul>
        {items.map((it) => (
          <li key={it.id}>
            {it.name} x {it.qty} — {(it.price_cents / 100).toFixed(2)} each
          </li>
        ))}
      </ul>
      <p>
        <strong>Total: </strong>
        {(totalCents / 100).toFixed(2)}
      </p>

      <form onSubmit={handleCheckout} style={{ maxWidth: 480 }}>
        <div>
          <label>Name</label>
          <input value={customer.customer_name} onChange={(e) => setCustomer({ ...customer, customer_name: e.target.value })} />
        </div>
        <div>
          <label>Email</label>
          <input value={customer.customer_email} onChange={(e) => setCustomer({ ...customer, customer_email: e.target.value })} />
        </div>
        <div>
          <label>Phone</label>
          <input value={customer.customer_phone} onChange={(e) => setCustomer({ ...customer, customer_phone: e.target.value })} />
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading || items.length === 0}>{loading ? 'Processing...' : 'Checkout'}</button>
        </div>
      </form>
    </div>
  )
}
