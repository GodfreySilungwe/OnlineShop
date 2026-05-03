#!/usr/bin/env python
"""
Migration script to create the Payment table for manual payment tracking.
Run this after updating models.py and before starting the Flask app.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Payment

def migrate():
    app = create_app()
    with app.app_context():
        try:
            print("[INFO] Creating Payment table...")
            db.create_all()
            print("[SUCCESS] Payment table created successfully!")
            print("[INFO] The Payment model is now ready for use.")
        except Exception as e:
            print(f"[ERROR] Migration failed: {str(e)}")
            sys.exit(1)

if __name__ == '__main__':
    migrate()
