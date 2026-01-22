#!/usr/bin/env python3
"""
Generate PNG from Mermaid diagrams using mermaid-js directly
"""

import subprocess
import os
import sys
from pathlib import Path

# Create output directory
output_dir = Path(r'c:\Users\PIU\Desktop\Personal Folder 23Oct2023\Quantic Work\Interactive webApp Assignment\docs\diagrams')
output_dir.mkdir(exist_ok=True)

# Create temporary file with all diagram JavaScript code
temp_script = r'c:\Users\PIU\Desktop\Personal Folder 23Oct2023\Quantic Work\Interactive webApp Assignment\scripts\render_diagrams.js'

js_code = """
const mermaid = require('mermaid');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Initialize mermaid
mermaid.initialize({ 
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose'
});

const diagrams = {
  'class_diagram': `classDiagram
    direction TB

    class Category {
        +int id
        +string name
        +int position
    }

    class MenuItem {
        +int id
        +string name
        +string description
        +string image_filename
        +int price_cents
        +boolean available
        +int category_id
        +datetime created_at
    }

    class Order {
        +int id
        +string customer_name
        +string customer_email
        +string customer_phone
        +int total_cents
        +string status
        +datetime created_at
    }

    class OrderItem {
        +int id
        +int order_id
        +int menu_item_id
        +int qty
        +int unit_price_cents
    }

    class Customer {
        +int id
        +string name
        +string email
        +string phone
        +boolean newsletter
        +datetime created_at
    }

    class Reservation {
        +int id
        +int customer_id
        +datetime time_slot
        +int table_number
        +int guests
        +datetime created_at
    }

    class Promotion {
        +int id
        +int menu_item_id
        +int percent
        +boolean active
        +datetime created_at
    }

    class Subscriber {
        +int id
        +string email
        +datetime created_at
    }

    class StripeCheckoutSession {
        <<external>>
        +string id
        +string url
        +string status
        +object line_items
        +string mode
        +string success_url
        +string cancel_url
    }

    class Cart {
        +MenuItem[] items
        +int totalCents
        +string customer_name
        +string customer_email
        +string customer_phone
        +addItem(MenuItem)
        +removeItem(MenuItem)
        +clearCart()
        +calculateTotal()
    }

    class StripeAPI {
        <<service>>
        +createCheckoutSession(lineItems)
        +retrievePrice(priceId)
        +handleWebhook(event)
        +constructEvent(payload, signature)
    }

    Category "1" -- "*" MenuItem: categorizes
    MenuItem "1" -- "*" OrderItem: includes
    Order "1" -- "*" OrderItem: contains
    MenuItem "1" -- "*" Promotion: hasDiscount
    Customer "1" -- "*" Reservation: makes
    Order "1" --> "1" Customer: placedBy
    Cart "1" --> "*" MenuItem: contains
    StripeCheckoutSession "1" --> "1" Cart: checkoutFor
    StripeAPI "1" --> "*" StripeCheckoutSession: creates
    Order "1" --> "1" StripeCheckoutSession: paymentVia`,
};

console.log('Generating diagrams...');

// For each diagram, generate a URL for manual conversion
for (const [name, code] of Object.entries(diagrams)) {
  console.log(`\\n📊 Diagram: ${name}`);
  console.log('   Mermaid code ready for conversion');
}
"""

# Create a simpler approach - just output the mermaid codes to files
print("📊 Creating Mermaid diagram files for conversion...")

# Create individual mermaid files
mermaid_files = {
    'class_diagram': """classDiagram
    direction TB

    class Category {
        +int id
        +string name
        +int position
    }

    class MenuItem {
        +int id
        +string name
        +string description
        +string image_filename
        +int price_cents
        +boolean available
        +int category_id
        +datetime created_at
    }

    class Order {
        +int id
        +string customer_name
        +string customer_email
        +string customer_phone
        +int total_cents
        +string status
        +datetime created_at
    }

    class OrderItem {
        +int id
        +int order_id
        +int menu_item_id
        +int qty
        +int unit_price_cents
    }

    class Customer {
        +int id
        +string name
        +string email
        +string phone
        +boolean newsletter
        +datetime created_at
    }

    class Reservation {
        +int id
        +int customer_id
        +datetime time_slot
        +int table_number
        +int guests
        +datetime created_at
    }

    class Promotion {
        +int id
        +int menu_item_id
        +int percent
        +boolean active
        +datetime created_at
    }

    class Subscriber {
        +int id
        +string email
        +datetime created_at
    }

    class StripeCheckoutSession {
        <<external>>
        +string id
        +string url
        +string status
        +object line_items
        +string mode
        +string success_url
        +string cancel_url
    }

    class Cart {
        +MenuItem[] items
        +int totalCents
        +string customer_name
        +string customer_email
        +string customer_phone
        +addItem(MenuItem)
        +removeItem(MenuItem)
        +clearCart()
        +calculateTotal()
    }

    class StripeAPI {
        <<service>>
        +createCheckoutSession(lineItems)
        +retrievePrice(priceId)
        +handleWebhook(event)
        +constructEvent(payload, signature)
    }

    Category "1" -- "*" MenuItem: categorizes
    MenuItem "1" -- "*" OrderItem: includes
    Order "1" -- "*" OrderItem: contains
    MenuItem "1" -- "*" Promotion: hasDiscount
    Customer "1" -- "*" Reservation: makes
    Order "1" --> "1" Customer: placedBy
    Cart "1" --> "*" MenuItem: contains
    StripeCheckoutSession "1" --> "1" Cart: checkoutFor
    StripeAPI "1" --> "*" StripeCheckoutSession: creates
    Order "1" --> "1" StripeCheckoutSession: paymentVia
""",
}

for name, code in mermaid_files.items():
    file_path = output_dir / f"{name}.mmd"
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"✅ Created: {file_path}")

print("\n✨ Mermaid diagram files created!")
print(f"\n📝 To convert these to PNG, use one of these methods:")
print(f"   1. Visit https://mermaid.live/ and paste the diagram code")
print(f"   2. Use: npm install -g @mermaid-js/mermaid-cli")
print(f"           mmdc -i diagram.mmd -o diagram.png")
print(f"   3. Use VS Code extension: 'Markdown Preview Mermaid Support'")
