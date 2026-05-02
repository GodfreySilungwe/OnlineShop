import React, { createContext, useContext, useEffect, useState } from 'react'
import { formatMWK } from '../utils/currency'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem('cart')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  function addToCart(item, qty = 1) {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id)
      // If item has a discount (from promotions), use the discounted price
      const price = item.discount_percent ? Math.round(item.price_cents * (100 - item.discount_percent) / 100) : item.price_cents
      if (found) {
        return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + qty, price_cents: price } : p))
      }
      return [...prev, { id: item.id, name: item.name, price_cents: price, qty, original_price_cents: item.price_cents, discount_percent: item.discount_percent }]
    })
  }

  function removeFromCart(itemId) {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  function updateQuantity(itemId, newQty) {
    if (newQty <= 0) {
      removeFromCart(itemId)
      return
    }
    setItems((prev) => prev.map((item) => 
      item.id === itemId ? { ...item, qty: newQty } : item
    ))
  }

  function getCartTotal() {
    return items.reduce((total, item) => total + (item.price_cents * item.qty), 0)
  }

  function getCartTotalFormatted() {
    return formatMWK(getCartTotal())
  }

  function getItemCount() {
    return items.reduce((count, item) => count + item.qty, 0)
  }

  function clearCart() {
    setItems([])
  }

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartTotalFormatted,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}