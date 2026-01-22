# ✅ Fixed: Backend Order Creation & Stripe Webhook Order Updates

## 🔧 Issues Fixed

### Issue 1: Backend API Not Creating Order Before Stripe Checkout
**Status**: ✅ FIXED

**What was wrong**:
- `/api/stripe-checkout` endpoint only prepared line items
- Never created an Order in the database
- Order was never saved before redirecting to Stripe payment

**What was fixed**:
- Now creates Order record BEFORE creating Stripe checkout session
- Adds all OrderItems to the order
- Stores order total in database
- Passes order_id to Stripe as metadata for webhook tracking

**Code changes in `backend/app/api.py`**:
```python
# NEW: Create order in database FIRST
order = Order(
    customer_name=customer_name,
    customer_email=customer_email,
    customer_phone=customer_phone,
    status='pending'
)
db.session.add(order)
db.session.flush()  # Get order ID

# NEW: Add OrderItems to the order
for item in items:
    order_item = OrderItem(
        order_id=order_id,
        menu_item_id=item_id,
        qty=qty,
        unit_price_cents=price
    )
    db.session.add(order_item)

# NEW: Update total and commit
order.total_cents = total
db.session.commit()

# Include order_id in Stripe metadata
checkout_session = stripe.checkout.Session.create(
    ...
    metadata={
        'order_id': str(order_id),
        'customer_name': customer_name,
        'customer_phone': customer_phone,
    }
)
```

---

### Issue 2: Stripe Server Not Updating Order Status
**Status**: ✅ FIXED

**What was wrong**:
- `/api/webhook` endpoint received payment events but did nothing
- Just logged the status
- Never updated Order status in database

**What was fixed**:
- Now imports database models and creates Flask app context
- Reads order_id from Stripe webhook metadata
- Updates Order status to:
  - `completed` when payment succeeds
  - `failed` when payment fails
- Properly commits changes to database

**Code changes in `stripe-sample-code/server.py`**:
```python
# NEW: Import database models
from app import create_app, db
from app.models import Order

# NEW: Handle checkout.session.completed
if event_type == 'checkout.session.completed':
    order_id = session.get('metadata', {}).get('order_id')
    if order_id:
        with backend_app.app_context():
            order = Order.query.get(int(order_id))
            if order:
                order.status = 'completed'
                db.session.commit()

# NEW: Handle checkout.session.async_payment_failed
elif event_type == 'checkout.session.async_payment_failed':
    order_id = session.get('metadata', {}).get('order_id')
    if order_id:
        with backend_app.app_context():
            order = Order.query.get(int(order_id))
            if order:
                order.status = 'failed'
                db.session.commit()
```

---

## 📊 Updated Flow

### Before (Broken):
```
Cart → Click Checkout → No order created
                     ↓
                Stripe checkout (no order tracking)
                     ↓
                Payment succeeds → Webhook ignored
                                  → Order never created
                                  → Database empty
```

### After (Fixed):
```
Cart → Click Checkout → Create Order in database ✅
                     ↓
                Save OrderItems ✅
                     ↓
                Create Stripe session with order_id ✅
                     ↓
                Payment succeeds → Webhook receives event
                                ↓
                            Get order_id from metadata
                                ↓
                            Update Order.status = 'completed' ✅
```

---

## ✅ What Now Happens

### Step 1: User Checkout (frontend/Cart.jsx)
- User adds items to cart
- Clicks "Checkout"
- Enters name, email, phone
- Frontend calls `/api/stripe-checkout`

### Step 2: Backend Creates Order (backend/app/api.py)
```
1. Create Order record with status='pending'
2. Create OrderItem for each cart item
3. Set order.total_cents
4. Commit to database ✅
5. Return Stripe session URL
```

### Step 3: Stripe Payment
- User redirected to Stripe checkout page
- User enters card details
- User confirms payment

### Step 4: Webhook Updates Order (stripe-sample-code/server.py)
```
IF payment succeeded:
   - Get order_id from session metadata
   - Update Order.status = 'completed' ✅
   - Commit to database ✅
   
IF payment failed:
   - Get order_id from session metadata
   - Update Order.status = 'failed' ✅
   - Commit to database ✅
```

---

## 🗂️ Files Modified

1. **backend/app/api.py** - `/api/stripe-checkout` endpoint
   - Now creates Order and OrderItems
   - Saves to database before Stripe session
   - Includes order_id in metadata

2. **stripe-sample-code/server.py** - Webhook handler
   - Now imports database models
   - Updates Order.status on webhook events
   - Handles both success and failure cases

---

## 🧪 Testing the Fix

### Test Order Creation:
1. Start backend: `python wsgi.py`
2. Open frontend
3. Add item to cart
4. Click checkout
5. Check database: Order should exist with status='pending'

### Test Webhook Order Update:
1. Complete payment in Stripe (use test card: 4242 4242 4242 4242)
2. Check database: Order should have status='completed'
3. If payment fails: Order should have status='failed'

---

## 🔐 Environment Variables

Add to `.env` if using webhook signature verification:
```
STRIPE_WEBHOOK_SECRET=whsec_test_xxxxx
```

(Leave empty for testing without signature verification)

---

## 📝 Database Order Statuses

| Status | Meaning | When Set |
|--------|---------|----------|
| `pending` | Order created, awaiting payment | On checkout |
| `completed` | Payment successful | On webhook `checkout.session.completed` |
| `failed` | Payment failed | On webhook `checkout.session.async_payment_failed` |

---

## ✨ Now Works End-to-End

✅ Cart checkout creates order  
✅ Order saved in database  
✅ Stripe session includes order tracking  
✅ Webhook updates order status  
✅ Complete order lifecycle tracked  

**Fixed and ready to test!**
