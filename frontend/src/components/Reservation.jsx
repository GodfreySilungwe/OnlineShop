import React, { useState } from 'react'
import './components.css'

export default function Reservation() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [guests, setGuests] = useState(2)
  const [timeSlot, setTimeSlot] = useState('')
  const [newsletter, setNewsletter] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const body = {
        name,
        email,
        phone,
        guests: parseInt(guests || 1, 10),
        time_slot: timeSlot,
        newsletter
      }
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Reservation failed' })
      } else {
        setMessage({ type: 'success', text: `Reservation confirmed — Table ${data.table_number} at ${new Date(data.time_slot).toLocaleString()}` })
        // clear form
        setName('')
        setEmail('')
        setPhone('')
        setGuests(2)
        setTimeSlot('')
        setNewsletter(false)
      }
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: 'Network error; try again' })
    }
    setLoading(false)
  }

  return (
    <div className="max-width-600">
      <h2>Make a Reservation</h2>
      <form onSubmit={submit}>
        <div className="mb-12">
          <label>Name *</label>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="mb-12">
          <label>Email *</label>
          <input className="input w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mb-12">
          <label>Phone (optional)</label>
          <input className="input w-full" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="mb-12">
          <label>Number of guests</label>
          <input className="input w-120" type="number" min="1" max="20" value={guests} onChange={(e) => setGuests(e.target.value)} />
        </div>
        <div className="mb-12">
          <label>Time slot *</label>
          <input className="input" type="datetime-local" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required />
        </div>
        <div className="mb-12">
          <label>
            <input type="checkbox" checked={newsletter} onChange={(e) => setNewsletter(e.target.checked)} />
            &nbsp;Subscribe to newsletter
          </label>
        </div>
        <div>
          <button type="submit" disabled={loading}>{loading ? 'Booking…' : 'Reserve'}</button>
        </div>
      </form>

      {message && (
        <div className={`message-area ${message.type === 'error' ? 'message-error' : 'message-ok'}`}>
          {message.text}
        </div>
      )}

      <section className="section-margin">
        <h3>Notes</h3>
        <p>We have 30 tables. If a chosen time slot is fully booked you'll be asked to choose another time.</p>
      </section>
    </div>
  )
}
