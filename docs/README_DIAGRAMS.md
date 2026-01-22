# UML Diagrams and Mermaid Code Export

This directory contains all UML diagrams for the Online Shop system with Stripe integration.

## 📄 Files Included

### Interactive HTML Viewer
- **diagrams.html** - Open in a web browser to view all diagrams interactively with the ability to download them as PNG

### Markdown Diagram Files (Mermaid Code)
1. **class_diagram.md** - System architecture with all database models and relationships
2. **sequence_checkout_flow.md** - Complete checkout process flow with Stripe integration
3. **activity_checkout_flow.md** - Step-by-step order processing activities
4. **component_interaction_diagram.md** - How different system components interact

### Mermaid Diagram Files (Raw Format)
Located in `diagrams/` folder:
- class_diagram.mmd
- sequence_checkout_flow.mmd
- activity_checkout_flow.mmd
- component_interaction_diagram.mmd

## 🖼️ How to Convert to PNG

### Option 1: Using the HTML Viewer (Easiest)
1. Open `diagrams.html` in any web browser
2. Click the "Download [Diagram Name]" buttons to save as PNG

### Option 2: Using Mermaid CLI
```bash
npm install -g @mermaid-js/mermaid-cli
mmdc -i class_diagram.mmd -o class_diagram.png
mmdc -i sequence_checkout_flow.mmd -o sequence_checkout_flow.png
mmdc -i activity_checkout_flow.mmd -o activity_checkout_flow.png
mmdc -i component_interaction_diagram.mmd -o component_interaction_diagram.png
```

### Option 3: Using Mermaid Live Editor
1. Visit https://mermaid.live/
2. Copy and paste the mermaid code from any .mmd file
3. Use the download button to export as PNG

### Option 4: VS Code Extensions
Install "Markdown Preview Mermaid Support" extension:
1. Open any .md file with mermaid code
2. Right-click and select "Open Preview"
3. Take a screenshot or use the export feature

## 📊 Diagram Descriptions

### 1. Class Diagram (Database Schema)
Shows all entities and their relationships:
- **Category** - Menu categories
- **MenuItem** - Individual menu items with prices
- **Order** - Customer orders
- **OrderItem** - Items within an order
- **Customer** - Customer information
- **Reservation** - Table reservations
- **Promotion** - Discounts on items
- **Subscriber** - Newsletter subscribers
- **StripeCheckoutSession** - Payment sessions
- **StripeAPI** - Payment service integration

### 2. Sequence Diagram (Checkout Process)
Timeline of interactions during checkout:
1. User adds items and fills checkout form
2. Frontend sends request to backend
3. Backend creates order and stripe session
4. Stripe handles payment
5. Webhook notification for success/failure
6. Backend updates order status
7. User sees confirmation or error

### 3. Activity Diagram (Order Processing Flow)
Flowchart of the entire order processing:
- Cart validation
- Form validation
- Order creation
- Payment processing
- Status updates based on payment result
- User feedback

### 4. Component Diagram (System Architecture)
Shows how components communicate:
- **Frontend**: React components, Cart context
- **Backend**: Flask API, database models
- **Database**: PostgreSQL storage
- **Stripe Integration**: Payment processing and webhooks

## 🔐 Stripe Integration Details

### Payment Flow:
```
Cart.jsx 
  ↓ (POST /api/stripe-checkout)
Flask API 
  ↓ (stripe.checkout.Session.create())
Stripe API
  ↓ (user enters payment info)
Stripe Servers
  ↓ (webhook: checkout.session.completed/failed)
server.py (/api/webhook)
  ↓ (updates database)
PostgreSQL (Order status updated)
```

### Webhook Events Handled:
- `checkout.session.completed` - Payment successful
- `checkout.session.async_payment_failed` - Payment failed

## 📝 Mermaid Code Examples

### Class Relationship Types:
- `--` : Association
- `|--` : Inheritance
- `*--` : Aggregation
- `o--` : Composition

### Cardinality:
- `1` : One
- `*` : Many
- `1..n` : One to many

## 🚀 Next Steps

1. **Export PNGs**: Use one of the methods above to generate PNG versions
2. **Share**: Include diagrams in documentation, presentations, or reports
3. **Update**: Modify the .mmd files to reflect future changes to the system
4. **Integrate**: Add diagrams to README, wiki, or design documents

## 📧 Questions?

Refer to the main README.md for API documentation and setup instructions.

---
Generated with Mermaid.js | Online Shop System
