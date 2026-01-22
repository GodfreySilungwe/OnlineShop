# Sequence Diagram - Checkout Flow with Stripe

```mermaid
sequenceDiagram
    actor User
    participant Frontend as Frontend<br/>(React)
    participant Backend as Backend<br/>(Flask API)
    participant StripeServer as Stripe Server<br/>(server.py)
    participant StripeAPI as Stripe API
    participant Database as PostgreSQL

    User->>Frontend: Add items to cart
    Frontend->>Frontend: Calculate total & discounts
    
    User->>Frontend: Enter name, email, phone
    User->>Frontend: Click "Checkout"
    
    Frontend->>Backend: POST /api/stripe-checkout
    activate Backend
    
    Note over Backend: Validate cart items
    Note over Backend: Create Order (status: pending)
    
    Backend->>Database: Save Order
    Backend->>Database: Save OrderItems
    Database-->>Backend: Order ID
    
    Backend->>StripeAPI: stripe.checkout.Session.create()
    activate StripeAPI
    StripeAPI-->>Backend: Checkout Session + URL
    deactivate StripeAPI
    
    Backend-->>Frontend: Return session URL
    deactivate Backend
    
    Frontend->>StripeAPI: Redirect to checkout.stripe.com
    activate StripeAPI
    
    User->>StripeAPI: Enter payment details
    User->>StripeAPI: Confirm payment
    
    alt Payment Success
        StripeAPI->>StripeAPI: Process payment
        StripeAPI->>StripeServer: POST /api/webhook
        activate StripeServer
        
        Note over StripeServer: Verify signature
        Note over StripeServer: Handle checkout.session.completed
        
        StripeServer->>Database: Update Order status = "completed"
        Database-->>StripeServer: OK
        
        StripeServer-->>StripeAPI: Return 200 success
        deactivate StripeServer
        
        StripeAPI->>Frontend: Redirect to success URL
        deactivate StripeAPI
        
        Frontend->>User: Show order confirmation
    else Payment Failed
        StripeAPI->>StripeServer: POST /api/webhook
        activate StripeServer
        
        Note over StripeServer: Handle checkout.session.async_payment_failed
        
        StripeServer->>Database: Update Order status = "failed"
        
        StripeServer-->>StripeAPI: Return 200 success
        deactivate StripeServer
        
        StripeAPI->>Frontend: Redirect to cancel URL
        deactivate StripeAPI
        
        Frontend->>User: Show error message
    end

```
