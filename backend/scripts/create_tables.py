"""Create missing tables (dev helper).
Run from repo backend folder after activating venv:

powershell:
& "..\.venv\Scripts\Activate.ps1"
$env:FLASK_APP="app.py"
python scripts/create_tables.py
"""
from app import db
from app import models

print('Creating database tables (if not exist)...')
db.create_all()
print('Done')
