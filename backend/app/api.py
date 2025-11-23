import os
from flask import Blueprint, jsonify, request
from . import db
from .models import MenuItem, Category, Order, OrderItem

# Simple admin secret (dev-only). Configure ADMIN_SECRET in your environment or .env
ADMIN_SECRET = os.getenv('ADMIN_SECRET', 'dev-secret')

api_bp = Blueprint('api', __name__)

@api_bp.route('/menu', methods=['GET'])
def list_menu():
    categories = Category.query.order_by(Category.position).all()
    result = []
    for c in categories:
        items = MenuItem.query.filter_by(category_id=c.id).all()
        result.append({
            'id': c.id,
            'name': c.name,
            'items': [
                {'id': i.id, 'name': i.name, 'description': i.description, 'price_cents': i.price_cents, 'available': i.available}
                for i in items
            ]
        })
    return jsonify(result)

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
            'items': items
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
        {'id': i.id, 'name': i.name, 'description': i.description, 'price_cents': i.price_cents, 'available': i.available, 'category_id': i.category_id}
        for i in items
    ])


@api_bp.route('/admin/menu_items', methods=['POST'])
def admin_create_menu_item():
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    data = request.get_json() or {}
    name = data.get('name')
    price = data.get('price_cents')
    category_id = data.get('category_id')
    if not name or price is None:
        return jsonify({'error': 'name and price_cents required'}), 400
    mi = MenuItem(name=name, description=data.get('description'), price_cents=int(price), available=bool(data.get('available', True)), category_id=category_id)
    db.session.add(mi)
    db.session.commit()
    return jsonify({'id': mi.id}), 201


@api_bp.route('/admin/menu_items/<int:item_id>', methods=['PUT', 'PATCH'])
def admin_update_menu_item(item_id):
    if not _is_admin(request):
        return jsonify({'error': 'unauthorized'}), 401
    mi = MenuItem.query.get(item_id)
    if not mi:
        return jsonify({'error': 'not found'}), 404
    data = request.get_json() or {}
    if 'name' in data:
        mi.name = data['name']
    if 'description' in data:
        mi.description = data['description']
    if 'price_cents' in data:
        mi.price_cents = int(data['price_cents'])
    if 'available' in data:
        mi.available = bool(data['available'])
    if 'category_id' in data:
        mi.category_id = data['category_id']
    db.session.commit()
    return jsonify({'ok': True})

