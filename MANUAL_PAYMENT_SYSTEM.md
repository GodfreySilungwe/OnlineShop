# Manual Payment System - Implementation Guide

## Overview

The checkout process has been refactored to implement a **manual payment system** instead of Stripe. Customers can now transfer money through three payment methods and submit a transaction reference for verification.

### Payment Methods

1. **National Bank Transfer**: Account Number: `868655`
2. **Airtel Money**: Code `54367`
3. **M'pamba**: Code `2675211`

## Customer Checkout Flow

### Step 1: Add Items to Cart
- Customer browses menu and adds items to cart
- Cart shows subtotal, discounts, and total amount

### Step 2: Checkout Information
- Customer enters: Full Name (required), Email, Phone
- Can review order summary

### Step 3: Select Payment Method & Submit Reference
- Customer selects payment method (Bank Transfer, Airtel Money, or M'pamba)
- Customer transfers money using the provided account/code
- Customer enters transaction reference number
- System creates Payment record with "pending" status

### Step 4: Confirmation
- Customer sees success message with Order # and confirmation details
- Instructions to wait for admin verification

## Backend Structure

### Database Models

#### Order Model (Updated)
```python
class Order(db.Model):
    id = db.Integer, primary_key=True
    customer_name = db.String(128)
    customer_email = db.String(128)
    customer_phone = db.String(64)
    total_cents = db.Integer
    status = db.String(64)  # 'pending', 'confirmed'
    created_at = db.DateTime
    payments = db.relationship('Payment', backref='order')  # NEW
```

#### Payment Model (New)
```python
class Payment(db.Model):
    id = db.Integer, primary_key=True
    order_id = db.Integer, db.ForeignKey('orders.id')
    transaction_reference = db.String(256)
    payment_method = db.String(64)  # 'bank_transfer', 'airtel_money', 'mpamba'
    amount_cents = db.Integer
    status = db.String(64)  # 'pending', 'processed'
    created_at = db.DateTime
    processed_at = db.DateTime  # When admin marked as processed
```

### API Endpoints

#### `/api/stripe-checkout` (POST) - Create Order & Payment
**Request:**
```json
{
  "items": [
    { "menu_item_id": 1, "qty": 2 },
    { "menu_item_id": 3, "qty": 1 }
  ],
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "customer_phone": "+265 991234567"
}
```

**Response:**
```json
{
  "orderId": 42,
  "totalCents": 50000,
  "status": "created"
}
```

#### `/api/payment/submit` (POST) - Submit Transaction Reference
**Request:**
```json
{
  "order_id": 42,
  "payment_method": "airtel_money",
  "transaction_reference": "TXN20240503ABC123XYZ"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": 42,
  "paymentId": 15,
  "message": "Payment reference submitted. Please wait for confirmation."
}
```

#### `/api/admin/payments` (GET) - List All Payments
**Headers:** `X-Admin-Secret: <admin_secret>`

**Response:**
```json
[
  {
    "id": 15,
    "order_id": 42,
    "customer_name": "John Doe",
    "customer_phone": "+265 991234567",
    "transaction_reference": "TXN20240503ABC123XYZ",
    "payment_method": "airtel_money",
    "amount_cents": 50000,
    "status": "pending",
    "created_at": "2024-05-03T10:30:00",
    "processed_at": null
  }
]
```

#### `/api/admin/payments/<payment_id>` (PUT) - Update Payment Status
**Headers:** `X-Admin-Secret: <admin_secret>`

**Request:**
```json
{
  "status": "processed"
}
```

**Response:**
```json
{
  "id": 15,
  "order_id": 42,
  "status": "processed",
  "processed_at": "2024-05-03T10:35:00"
}
```

## Setup Instructions

### 1. Update Database
Run the migration script to create the Payment table:

```powershell
cd backend
python scripts/migrate_payment_table.py
```

### 2. Restart Flask Server
```powershell
set FLASK_APP=app
set FLASK_ENV=development
flask run
```

The backend should now be ready on `http://localhost:5000`

### 3. Start Frontend
```powershell
cd frontend
npm install
npm run dev
```

The frontend should now be available on `http://localhost:5173`

## Admin Dashboard - Payments Tab

### Features

✅ **View All Payments**
- Order ID, Customer Name & Phone
- Payment Method (Bank Transfer, Airtel Money, M'pamba)
- Transaction Reference
- Payment Amount (in MWK)
- Status (Pending/Processed)

✅ **Process Payments**
- Click "Process" button to mark payment as verified
- Updates payment status to "processed"
- Automatically updates associated order status to "confirmed"
- Records processing timestamp

✅ **Revert Status**
- Click "Revert" button on processed payments to revert to pending
- Allows correction if needed

## Testing the Flow

1. **Add Items to Cart** - Browse menu and add items
2. **Go to Checkout** - Click "Proceed to checkout"
3. **Enter Details** - Fill in customer name, email, phone
4. **Continue to Payment** - Click "Continue to Payment"
5. **Select Method** - Choose Airtel Money, Bank Transfer, or M'pamba
6. **Enter Reference** - Submit a test transaction reference (e.g., "TEST123456")
7. **Success** - See confirmation message with Order #

### Admin Verification

8. **Access Admin Dashboard** - Navigate to `/admin` (or button in header)
9. **Enter Admin Secret** - Use your ADMIN_SECRET value
10. **Go to Payments Tab** - Click 💳 Payments in tab navigation
11. **Find Order** - Look for your test order in the list
12. **Process Payment** - Click "✓ Process" button
13. **Verify** - Payment status changes to "processed" with timestamp

## Environment Variables

Ensure these are set in `backend/.env`:

```
ADMIN_SECRET=dev-secret  # For admin access (change in production!)
DATABASE_URL=postgresql://cafefausse:cafefaussepass@localhost:5432/cafefausse_dev
FLASK_ENV=development
```

## Key Changes from Stripe Implementation

### Removed
- ❌ Stripe API integration
- ❌ Stripe checkout sessions
- ❌ Stripe webhook handling
- ❌ `STRIPE_SECRET_KEY` environment variable

### Added
- ✅ `Payment` database model
- ✅ `/api/payment/submit` endpoint
- ✅ `/api/admin/payments` endpoints
- ✅ Multi-step checkout UI with payment method selection
- ✅ Admin payments management tab

### Modified
- 🔄 `/api/stripe-checkout` endpoint (now creates order directly, no Stripe session)
- 🔄 `Cart.jsx` component (multi-step checkout flow)
- 🔄 `AdminDashboard.jsx` (added Payments tab)
- 🔄 `Order` model (added relationship to Payment)

## Troubleshooting

### Payment Table Not Found
If you see "payment" table not found error:
```powershell
cd backend/scripts
python migrate_payment_table.py
```

### Admin Payments Tab Empty
Make sure you're accessing with correct admin secret and the payments have been created in checkout

### Frontend Not Updating After Backend Changes
Restart the Flask server:
```powershell
# In backend terminal
# Press Ctrl+C to stop, then:
flask run
```

## Future Enhancements

- Email notifications when payment is processed
- SMS notifications via Airtel/M'pamba
- Payment batch processing
- Export payments to CSV/Excel
- Automated payment reminders
- Payment reconciliation report
- Multiple currencies support

---

**Version:** 1.0  
**Last Updated:** May 3, 2024  
**Status:** Production Ready ✅
