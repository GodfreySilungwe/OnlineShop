import os
import random
import time
from datetime import datetime
from flask import Blueprint, jsonify, request, redirect
from flask import send_from_directory, abort
from werkzeug.utils import secure_filename
from . import db
from .models import MenuItem, Category, Order, OrderItem, Subscriber, Customer, Reservation, Promotion
import stripe

# Explicitly use test mode with test keys
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
# Verify we're in test mode
if stripe.api_key and stripe.api_key.startswith('sk_test_'):
    print("[INFO] Using Stripe TEST environment")
else:
    print("[WARNING] Not using Stripe test keys!")

# Simple admin secret (dev-only). Configure ADMIN_SECRET in your environment or .env
ADMIN_SECRET = os.getenv('ADMIN_SECRET', 'dev-secret')

api_bp = Blueprint('api', __name__)

@api_bp.route('/menu', methods=['GET'])
def list_menu():
    categories = Category.query.order_by(Category.position).all()
    # fetch all active promotions (keyed by menu_item_id)
    try:
        active_promos = {p.menu_item_id: p.percent for p in Promotion.query.filter_by(active=True).all()}
    except Exception:
        # promotions table may not exist yet
        active_promos = {}
    
    result = []
    for c in categories:
        items = MenuItem.query.filter_by(category_id=c.id).all()
        result.append({
            'id': c.id,
            'name': c.name,
            'items': [
                {
                    'id': i.id,
                    'name': i.name,
                    'description': i.description,
                    'price_cents': i.price_cents,
                    'available': i.available,
                    'image_filename': getattr(i, 'image_filename', None),
                    'discount_percent': active_promos.get(i.id)  # None if no discount, otherwise the percent
                }
                for i in items
            ]
        })
    return jsonify({'categories': result, 'promotions': list(active_promos.items())})

@api_bp.route('/cart/checkout', methods=['POST'])
def checkout():
    data = request.get_json() or {}
    items = data.get('items', [])
    name = data.get('customer_name')
    email = data.get('customer_email')
    phone = data.get('customer_phone')

    if not items or not name:
        return jsonify({'error': 'Missing items or customer name'}), 400

    total = 0
    order = Order(customer_name=name, customer_email=email, customer_phone=phone, status='pending')
    db.session.add(order)
    db.session.flush()

    for it in items:
        mi = MenuItem.query.get(it.get('menu_item_id'))
        if not mi:
            db.session.rollback()
            return jsonify({'error': f"Menu item {it.get('menu_item_id')} not found"}), 400
        qty = int(it.get('qty', 1))
        total += mi.price_cents * qty
        oi = OrderItem(order_id=order.id, menu_item_id=mi.id, qty=qty, unit_price_cents=mi.price_cents)
        db.session.add(oi)

    order.total_cents = total
    db.session.commit()

    return jsonify({'order_id': order.id, 'status': order.status})


@api_bp.route('/stripe-checkout', methods=['POST'])
def stripe_checkout():
    """Create a Stripe checkout session for the cart items and create an order in database."""
    # Ensure Stripe API key is set at runtime
    stripe_key = os.getenv('STRIPE_SECRET_KEY')
    
    if stripe_key:
        stripe.api_key = stripe_key
    else:
        return jsonify({'error': 'Stripe is not configured'}), 500
    
    data = request.get_json() or {}
    items = data.get('items', [])
    customer_name = data.get('customer_name')
    customer_email = data.get('customer_email')
    customer_phone = data.get('customer_phone')

    if not items or not customer_name:
        return jsonify({'error': 'Missing items or customer name'}), 400

    if not stripe.api_key:
        return jsonify({'error': 'Stripe is not configured'}), 500

    try:
        # STEP 1: Create order in database BEFORE creating Stripe session
        print(f"[INFO] Creating order for customer: {customer_name}")
        order = Order(
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            status='pending'
        )
        db.session.add(order)
        db.session.flush()  # Get the order ID
        order_id = order.id
        print(f"[INFO] Order created with ID: {order_id}")
        
        # STEP 2: Prepare line items for Stripe and create OrderItems
        line_items = []
        order_total_cents = 0
        
        for it in items:
            menu_item = MenuItem.query.get(it.get('menu_item_id'))
            if not menu_item:
                db.session.rollback()
                return jsonify({'error': f"Menu item {it.get('menu_item_id')} not found"}), 400
            
            qty = int(it.get('qty', 1))
            price_cents = int(menu_item.price_cents)
            order_total_cents += price_cents * qty
            
            # Create OrderItem
            order_item = OrderItem(
                order_id=order_id,
                menu_item_id=menu_item.id,
                qty=qty,
                unit_price_cents=price_cents
            )
            db.session.add(order_item)
            print(f"[INFO] Added item {menu_item.name} (qty: {qty}) to order")
            
            # For Stripe, price is in cents
            line_items.append({
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': menu_item.name,
                        'description': menu_item.description,
                    },
                    'unit_amount': price_cents,
                },
                'quantity': qty,
            })
        
        # Update order total
        order.total_cents = order_total_cents
        db.session.commit()
        print(f"[INFO] Order {order_id} saved with total: {order_total_cents} cents")

        # STEP 3: Create Stripe checkout session
        domain = os.getenv('DOMAIN', 'http://localhost:5173')
        
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=line_items,
            mode='payment',
            customer_email=customer_email,
            success_url=f"{domain}/success?session_id={{CHECKOUT_SESSION_ID}}&order_id={order_id}",
            cancel_url=f"{domain}/cart",
            metadata={
                'order_id': str(order_id),
                'customer_name': customer_name,
                'customer_phone': customer_phone,
            }
        )
        
        print(f"[INFO] Stripe session created: {checkout_session.id}")

        return jsonify({
            'sessionId': checkout_session.id,
            'url': checkout_session.url,
            'orderId': order_id,
        }), 200

    except stripe.error.StripeError as e:
        print(f"[ERROR] Stripe error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        print(f"[ERROR] General exception: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create checkout session'}), 500


@api_bp.route('/')
def index():
    """Return menu categories and items as JSON for the frontend."""
    categories = Category.query.order_by(Category.position).all()
    # prepare items for JSON response
    cats = []
    for c in categories:
        items = MenuItem.query.filter_by(category_id=c.id).all()
        cats.append({
            'id': c.id,
            'name': c.name,
            'items': [
                {
                    'id': i.id,
                    'name': i.name,
                    'description': i.description,
                    'price_cents': i.price_cents,
                    'available': i.available,
                    'image_filename': getattr(i, 'image_filename', None),
                    'category_id': i.category_id
                }
                for i in items
            ]
        })
    # This endpoint serves the same data the frontend expects during development.
    return jsonify(cats)


# --- Admin routes (dev-only simple auth) ---------------------------------
def _is_admin(req):
    token = req.headers.get('X-Admin-Secret') or req.args.get('admin_secret')
    return token and token == ADMIN_SECRET


@api_bp.route('/admin/orders', methods=['GET'])
def admin_list_orders():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    orders = Order.query.order_by(Order.created_at.desc()).all()
    result = []
    for o in orders:
        items = OrderItem.query.filter_by(order_id=o.id).all()
        result.append({
            'id': o.id,
            'customer_name': o.customer_name,
            'customer_email': o.customer_email,
            'customer_phone': o.customer_phone,
            'total_cents': o.total_cents,
            'status': o.status,
            'created_at': o.created_at.isoformat(),
            'items': [
                {'menu_item_id': it.menu_item_id, 'qty': it.qty, 'unit_price_cents': it.unit_price_cents}
                for it in items
            ]
        })
    return jsonify(result)


@api_bp.route('/admin/menu_items', methods=['GET'])
def admin_list_menu_items():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    items = MenuItem.query.order_by(MenuItem.created_at.desc()).all()
    return jsonify([
        {'id': i.id, 'name': i.name, 'description': i.description, 'price_cents': i.price_cents, 'available': i.available, 'category_id': i.category_id, 'image_filename': getattr(i, 'image_filename', None)}
        for i in items
    ])


@api_bp.route('/admin/categories', methods=['GET'])
def admin_list_categories():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    cats = Category.query.order_by(Category.position).all()
    return jsonify([{'id': c.id, 'name': c.name, 'position': c.position} for c in cats])


@api_bp.route('/admin/categories', methods=['POST'])
def admin_create_category():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    data = request.get_json() or {}
    name = data.get('name')
    position = data.get('position', 0)
    if not name:
        return jsonify({'error': 'name is required'}), 400
    cat = Category(name=name, position=int(position))
    db.session.add(cat)
    db.session.commit()
    return jsonify({'id': cat.id, 'name': cat.name, 'position': cat.position}), 201


@api_bp.route('/admin/categories/<int:cat_id>', methods=['PUT', 'PATCH'])
def admin_update_category(cat_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    cat = Category.query.get(cat_id)
    if not cat:
        return jsonify({'error': 'not found'}), 404
    data = request.get_json() or {}
    if 'name' in data:
        cat.name = data['name']
    if 'position' in data:
        cat.position = int(data['position'])
    db.session.commit()
    return jsonify({'ok': True})


@api_bp.route('/admin/categories/<int:cat_id>', methods=['DELETE'])
def admin_delete_category(cat_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    cat = Category.query.get(cat_id)
    if not cat:
        return jsonify({'error': 'not found'}), 404
    db.session.delete(cat)
    db.session.commit()
    return jsonify({'ok': True}), 200


@api_bp.route('/admin/menu_items', methods=['POST'])
def admin_create_menu_item():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    # support both JSON body and multipart/form-data with file upload
    data = {}
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict()
    else:
        data = request.get_json() or {}

    name = data.get('name')
    price = data.get('price_cents')
    category_id = data.get('category_id')
    # require name, price and category for created items
    if not name or price is None or category_id is None:
        return jsonify({'error': 'name, price_cents and category_id are required'}), 400
    # validate category exists
    cat = Category.query.get(category_id)
    if not cat:
        return jsonify({'error': f'category {category_id} not found'}), 400

    image_filename = None
    # if an image file is included, save it to Images/ and record filename
    if 'image' in request.files:
        img = request.files.get('image')
        if img and img.filename:
            images_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'Images'))
            try:
                os.makedirs(images_dir, exist_ok=True)
            except Exception:
                pass
            fname = secure_filename(img.filename)
            # prefix with timestamp to avoid collisions
            fname = f"{int(time.time())}_{fname}"
            save_path = os.path.join(images_dir, fname)
            img.save(save_path)
            image_filename = fname

    mi = MenuItem(name=name, description=data.get('description'), price_cents=int(price), available=bool(data.get('available', True)), category_id=category_id)
    if image_filename:
        mi.image_filename = image_filename
    db.session.add(mi)
    db.session.commit()
    return jsonify({'id': mi.id, 'image_filename': getattr(mi, 'image_filename', None)}), 201


@api_bp.route('/admin/menu_items/<int:item_id>', methods=['PUT', 'PATCH'])
def admin_update_menu_item(item_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    mi = MenuItem.query.get(item_id)
    if not mi:
        return jsonify({'error': 'not found'}), 404
    # accept multipart/form-data for updating image; if multipart, prefer request.form
    if request.content_type and request.content_type.startswith('multipart/form-data'):
        data = request.form.to_dict() or {}
    else:
        # parse JSON silently to avoid raising on unsupported media types
        data = request.get_json(silent=True) or {}
    if 'name' in data:
        mi.name = data['name']
    if 'description' in data:
        mi.description = data['description']
    if 'price_cents' in data:
        mi.price_cents = int(data['price_cents'])
    if 'available' in data:
        mi.available = bool(data['available'])
    if 'category_id' in data:
        # validate category exists before assigning
        new_cat = Category.query.get(data['category_id'])
        if not new_cat:
            return jsonify({'error': f'category {data["category_id"]} not found'}), 400
        mi.category_id = data['category_id']
    # handle image upload when present
    if 'image' in request.files:
        img = request.files.get('image')
        if img and img.filename:
            images_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'Images'))
            try:
                os.makedirs(images_dir, exist_ok=True)
            except Exception:
                pass
            fname = secure_filename(img.filename)
            fname = f"{int(time.time())}_{fname}"
            save_path = os.path.join(images_dir, fname)
            try:
                img.save(save_path)
                mi.image_filename = fname
            except Exception as e:
                db.session.rollback()
                return jsonify({'error': 'failed to save uploaded image', 'details': str(e)}), 500
    db.session.commit()
    return jsonify({'ok': True})


@api_bp.route('/admin/menu_items/<int:item_id>', methods=['DELETE'])
def admin_delete_menu_item(item_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    mi = MenuItem.query.get(item_id)
    if not mi:
        return jsonify({'error': 'not found'}), 404
    # prevent deletion if this item appears in past orders to keep order history intact
    deps = OrderItem.query.filter_by(menu_item_id=mi.id).all()
    if deps:
        order_ids = sorted({d.order_id for d in deps})
        return jsonify({'error': 'item referenced by existing orders; cannot delete', 'order_ids': order_ids}), 400
    try:
        db.session.delete(mi)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'delete failed', 'details': str(e)}), 500
    return jsonify({'ok': True}), 200


@api_bp.route('/gallery', methods=['GET'])
def gallery_list():
    """Return list of image filenames in the project Images/ folder."""
    # Images folder is located at repository root: ../../Images relative to this file
    images_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'Images'))
    try:
        files = [f for f in os.listdir(images_dir) if os.path.isfile(os.path.join(images_dir, f))]
    except Exception:
        files = []
    return jsonify(sorted(files))


@api_bp.route('/reservations', methods=['POST'])
def create_reservation():
    """Create a reservation.

    Expected JSON:
      {
        "name": "Full Name",
        "email": "user@example.com",
        "phone": "optional",
        "guests": 2,
        "time_slot": "2025-11-25T18:30" ,  # ISO format
        "newsletter": true  # optional
      }
    """
    data = request.get_json() or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    guests = int(data.get('guests') or 1)
    newsletter = bool(data.get('newsletter', False))
    timeslot_raw = data.get('time_slot')

    if not name or not email or not timeslot_raw:
        return jsonify({'error': 'name, email and time_slot are required'}), 400

    try:
        # accept ISO format
        time_slot = datetime.fromisoformat(timeslot_raw)
    except Exception:
        return jsonify({'error': 'invalid time_slot format; use ISO datetime'}), 400

    # find or create customer by email
    customer = Customer.query.filter_by(email=email).first()
    if not customer:
        customer = Customer(name=name, email=email, phone=phone or None, newsletter=newsletter)
        db.session.add(customer)
        db.session.flush()
    else:
        # update name/phone/newsletter if provided
        customer.name = name or customer.name
        if phone:
            customer.phone = phone
        if newsletter:
            customer.newsletter = True

    # table assignment: 1..30
    TOTAL_TABLES = 30
    # get reserved table numbers for the same timeslot
    existing = Reservation.query.filter_by(time_slot=time_slot).all()
    taken_tables = {r.table_number for r in existing}
    available = [t for t in range(1, TOTAL_TABLES + 1) if t not in taken_tables]

    if not available:
        db.session.rollback()
        return jsonify({'error': 'no tables available for that time slot'}), 409

    table_number = random.choice(available)

    res = Reservation(customer_id=customer.id, time_slot=time_slot, table_number=table_number, guests=guests)
    db.session.add(res)
    db.session.commit()

    return jsonify({'reservation_id': res.id, 'table_number': table_number, 'time_slot': time_slot.isoformat()}), 201


@api_bp.route('/admin/reservations', methods=['GET'])
def admin_list_reservations():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    resv = Reservation.query.order_by(Reservation.time_slot.desc()).all()
    out = []
    for r in resv:
        cust = Customer.query.get(r.customer_id)
        out.append({
            'id': r.id,
            'customer': {'id': cust.id, 'name': cust.name, 'email': cust.email, 'phone': cust.phone},
            'time_slot': r.time_slot.isoformat(),
            'table_number': r.table_number,
            'guests': r.guests,
            'created_at': r.created_at.isoformat()
        })
    return jsonify(out)


@api_bp.route('/admin/reservations/<int:res_id>', methods=['DELETE'])
def admin_delete_reservation(res_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    r = Reservation.query.get(res_id)
    if not r:
        return jsonify({'error': 'not found'}), 404
    try:
        db.session.delete(r)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'delete failed', 'details': str(e)}), 500
    return jsonify({'ok': True}), 200


@api_bp.route('/admin/promotions', methods=['GET'])
def admin_list_promotions():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    try:
        promos = Promotion.query.order_by(Promotion.created_at.desc()).all()
        return jsonify([{'id': p.id, 'menu_item_id': p.menu_item_id, 'percent': p.percent, 'active': p.active} for p in promos])
    except Exception:
        # promotions table doesn't exist yet
        return jsonify([])


@api_bp.route('/admin/promotions', methods=['POST'])
def admin_create_promotion():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    data = request.get_json() or {}
    menu_item_id = data.get('menu_item_id')
    percent = data.get('percent')
    active = bool(data.get('active', True))
    if menu_item_id is None or percent is None:
        return jsonify({'error': 'menu_item_id and percent are required'}), 400
    # check if item exists
    item = MenuItem.query.get(menu_item_id)
    if not item:
        return jsonify({'error': f'menu item {menu_item_id} not found'}), 404
    # check if promotion already exists for this item
    existing = Promotion.query.filter_by(menu_item_id=menu_item_id).first()
    if existing:
        return jsonify({'error': f'promotion already exists for item {menu_item_id}'}), 400
    try:
        percent = int(percent)
        if percent < 0 or percent > 100:
            raise ValueError()
    except Exception:
        return jsonify({'error': 'percent must be an integer 0-100'}), 400
    promo = Promotion(menu_item_id=menu_item_id, percent=percent, active=active)
    db.session.add(promo)
    db.session.commit()
    return jsonify({'id': promo.id, 'menu_item_id': promo.menu_item_id, 'percent': promo.percent, 'active': promo.active}), 201


@api_bp.route('/admin/promotions/<int:pid>', methods=['PUT', 'PATCH'])
def admin_update_promotion(pid):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    promo = Promotion.query.get(pid)
    if not promo:
        return jsonify({'error': 'not found'}), 404
    data = request.get_json() or {}
    if 'percent' in data:
        try:
            p = int(data['percent'])
            if p < 0 or p > 100:
                raise ValueError()
            promo.percent = p
        except Exception:
            return jsonify({'error': 'percent must be an integer 0-100'}), 400
    if 'active' in data:
        promo.active = bool(data['active'])
    db.session.commit()
    return jsonify({'ok': True})


@api_bp.route('/admin/promotions/<int:pid>', methods=['DELETE'])
def admin_delete_promotion(pid):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    promo = Promotion.query.get(pid)
    if not promo:
        return jsonify({'error': 'not found'}), 404
    db.session.delete(promo)
    db.session.commit()
    return jsonify({'ok': True}), 200


@api_bp.route('/images/<path:filename>')
def serve_image(filename):
    images_dir = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', 'Images'))
    # basic security: don't allow path traversal
    full_path = os.path.normpath(os.path.join(images_dir, filename))
    if not full_path.startswith(os.path.abspath(images_dir)):
        abort(404)
    if not os.path.exists(full_path):
        abort(404)
    return send_from_directory(images_dir, filename)


@api_bp.route('/newsletter', methods=['POST'])
def newsletter_signup():
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    if not email:
        return jsonify({'error': 'email required'}), 400
    # basic email validation
    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({'error': 'invalid email'}), 400
    existing = Subscriber.query.filter_by(email=email).first()
    if existing:
        return jsonify({'status': 'already_subscribed'}), 200
    sub = Subscriber(email=email)
    db.session.add(sub)
    db.session.commit()
    return jsonify({'status': 'subscribed', 'id': sub.id}), 201


# --- Airtel Money integration ------------------------------------------------
from .airtel_client import AirtelClient
import json

airtel_client = AirtelClient()


@api_bp.route('/airtel/merchants', methods=['POST'])
def airtel_register_merchants():
    """Register one or more merchants with Airtel. Expects JSON body with `merchants` list."""
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    data = request.get_json() or {}
    merchants = data.get('merchants')
    if not merchants:
        return jsonify({'error': 'merchants list required'}), 400
    try:
        resp = airtel_client.register_merchants(merchants)
        try:
            body = resp.json()
        except Exception:
            body = {'raw': resp.text}
        return jsonify({'status_code': resp.status_code, 'response': body}), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/airtel/merchants', methods=['GET'])
def airtel_fetch_merchants():
    """Fetch registered merchants from Airtel."""
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    try:
        resp = airtel_client.fetch_merchants()
        try:
            body = resp.json()
        except Exception:
            body = {'raw': resp.text}
        return jsonify({'status_code': resp.status_code, 'response': body}), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/airtel/payments', methods=['POST'])
def airtel_create_payment():
    """Create a payment (transfer) via Airtel. Forwards JSON body to Airtel API."""
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    payload = request.get_json() or {}
    if not payload:
        return jsonify({'error': 'json payload required'}), 400
    try:
        resp = airtel_client.create_payment(payload)
        try:
            body = resp.json()
        except Exception:
            body = {'raw': resp.text}
        return jsonify({'status_code': resp.status_code, 'response': body}), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/airtel/payments/refund', methods=['POST'])
def airtel_refund_payment():
    """Request a refund for a transaction via Airtel."""
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    payload = request.get_json() or {}
    if not payload:
        return jsonify({'error': 'json payload required'}), 400
    try:
        resp = airtel_client.refund_payment(payload)
        try:
            body = resp.json()
        except Exception:
            body = {'raw': resp.text}
        return jsonify({'status_code': resp.status_code, 'response': body}), resp.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@api_bp.route('/airtel/notify/<partnerCode>', methods=['POST'])
def airtel_notify(partnerCode):
    """Receive notifications from Airtel. This is a simple receiver that logs payload."""
    data = request.get_json(silent=True) or {}
    # For now: persist nothing, but log to stdout and return success
    print(f"[AIRTEL NOTIFY] partner={partnerCode} payload=", json.dumps(data))
    return jsonify({'st': True, 'msg': 'SUCCESS'}), 200

