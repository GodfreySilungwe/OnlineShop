# print_routes.py
from backend.app import create_app

app = create_app()
with app.app_context():
    print("Registered routes:")
    for rule in sorted(app.url_map.iter_rules(), key=lambda r: str(r)):
        methods = ",".join(sorted(rule.methods - {'HEAD','OPTIONS'}))
        print(f"{rule}  →  methods: {methods}")