# For AWS Lambda deployment
from backend.app import lambda_handler

# For local development
if __name__ == '__main__':
    from backend.app import create_app
    app = create_app()
    app.run(debug=True)
    app.run(debug=True, host='127.0.0.1', port=5000)
