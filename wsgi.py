#!/usr/bin/env python
"""
Flask application entry point
"""
import os
from dotenv import load_dotenv

# Load environment variables FIRST before importing the app
load_dotenv()

from backend.app import create_app, db

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        # Create database tables if they don't exist
        db.create_all()
    
    # Run the Flask development server
    app.run(debug=True, host='127.0.0.1', port=5000)
