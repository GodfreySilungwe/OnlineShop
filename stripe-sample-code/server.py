#! /usr/bin/env python3.6

import os
import json
from flask import Flask, jsonify, request, redirect, make_response
from dotenv import load_dotenv
from flask_cors import CORS
# Load environment variables
load_dotenv()

import stripe

from stripe import StripeClient
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Verify we're in test mode
if stripe.api_key and stripe.api_key.startswith('sk_test_'):
    print("[INFO] Stripe server using TEST environment")
else:
    print("[WARNING] Stripe server NOT using test keys!")

print(f"Stripe API Key loaded: {stripe.api_key[:20]}..." if stripe.api_key else "Stripe API Key NOT loaded!")

stripe_client = StripeClient(str(os.getenv("STRIPE_SECRET_KEY")))

app = Flask(__name__)

CORS(app)

# Helper method to parse request body (JSON or form data)
def parse_request_body():
    data = {}

    json_data = request.get_json(silent=True)
    if json_data and isinstance(json_data, dict):
        data.update(json_data)

    if request.form:
        data.update(request.form.to_dict())

    if request.args:
        data.update(request.args.to_dict())

    return data


@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = parse_request_body()
    price_id = data['priceId']

    # Get the price's type from Stripe
    price = stripe.Price.retrieve(price_id)
    price_type = price.type
    mode = 'subscription' if price_type == 'recurring' else 'payment'

    checkout_session = stripe.checkout.Session.create(
      line_items=[
        {
          'price': price_id,
          'quantity': 1
        }
      ],
      mode=mode,
      # Defines where Stripe will redirect a customer after successful payment
      success_url=f"{os.getenv('DOMAIN')}/done?session_id={{CHECKOUT_SESSION_ID}}",
      # Defines where Stripe will redirect if a customer cancels payment
      cancel_url=f"{os.getenv('DOMAIN')}",
    )

    response = make_response(redirect(checkout_session.url, code=303))

    return response




@app.route('/api/webhook', methods=['POST'])
def webhook_received():
    # Replace this endpoint secret with your endpoint's unique secret
    # If you are testing with the CLI, find the secret by running 'stripe listen'
    # If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    # at https://dashboard.stripe.com/webhooks
    endpoint_secret = ''
    request_data = json.loads(request.data)

    # Only verify the event if you have an endpoint secret defined.
    # Otherwise use the basic event deserialized with JSON.parse
    if endpoint_secret:
        sig_header = request.headers.get('stripe-signature')
        try:
            event = stripe.Webhook.construct_event(
                request.data, sig_header, endpoint_secret
            )
        except stripe.error.SignatureVerificationError as e:
            app.logger.info('⚠️  Webhook signature verification failed.')
            return jsonify({'error': str(e)}), 400
    else:
        event = request_data

    # Handle the event
    match event['type']:
        case 'checkout.session.completed':
            session = event['data']['object']
            status = session['status']
            app.logger.info(f'Checkout Session status is {status}.')
            # Then define and call a method to handle the checkout session completed.
            # handle_checkout_session_completed(session);
        case 'checkout.session.async_payment_failed':
            session = event['data']['object']
            status = session['status']
            app.logger.info(f'Checkout Session status is {status}.')
            # Then define and call a method to handle the checkout session failed.
            # handle_checkout_session_failed(session);
        case _:
            # Unexpected event type
            app.logger.info(f'Unhandled event type {event["type"]}')

    # Return a 200 response to acknowledge receipt of the event
    return jsonify({'status': 'success'})

@app.route('/api/thin-webhook', methods=['POST'])
def thin_webhook():
    # Replace this endpoint secret with your endpoint's unique secret
    # If you are testing with the CLI, find the secret by running 'stripe listen'
    # If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    # at https://dashboard.stripe.com/webhooks
    thin_endpoint_secret = ''
    payload = request.data
    sig_header = request.headers.get('Stripe-Signature')

    try:
        event_notif = stripe_client.parse_event_notification(
            payload, sig_header, thin_endpoint_secret
        )
    except Exception as e:
        app.logger.info(f"⚠️  Thin webhook signature verification failed: {e}")
        return jsonify({'error': 'bad signature'}), 400

    if event_notif.type == "v2.account.created":
        event_notif.fetch_related_object()
        event_notif.fetch_event()
    else:
        app.logger.info(f'Unhandled event type {event_notif.type}')

    return jsonify({'status': 'success'})


if __name__ == '__main__':
    app.run(port=4242, host="::1", debug=True)

