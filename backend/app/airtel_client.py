import os
import requests


class AirtelClient:
    def __init__(self):
        # Default to Airtel staging root; the client composes the API prefix below
        # Use staging base URL by default; can be overridden with AIRTEL_BASE_URL env var
        self.base = os.getenv('AIRTEL_BASE_URL', 'https://openapiuat.airtel.mw')
        # API prefix (path) used by the merchant collection APIs
        self.api_prefix = os.getenv('AIRTEL_API_PREFIX', 'merchant-collection/v1').strip('/')
        self.token = os.getenv('AIRTEL_BEARER_TOKEN')
        self.country = os.getenv('AIRTEL_COUNTRY', 'MW')
        self.currency = os.getenv('AIRTEL_CURRENCY', 'MWK')
        # Receiving number used by the merchant to receive payments (default provided)
        # Can be overridden with AIRTEL_RECEIVING_NUMBER env var
        self.receiving_number = os.getenv('AIRTEL_RECEIVING_NUMBER', '+265995718815')
        print(f"[INFO] AirtelClient using base URL: {self.base} and receiving number: {self.receiving_number}")

    def _headers(self):
        h = {
            'x-country': self.country,
            'x-currency': self.currency,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        }
        if self.token:
            h['Authorization'] = f'Bearer {self.token}'
        return h

    def _url(self, path: str) -> str:
        return f"{self.base.rstrip('/')}/{self.api_prefix}/{path.lstrip('/')}"


    def register_merchants(self, merchants):
        url = self._url('merchant')
        payload = {'merchants': merchants}
        r = requests.post(url, json=payload, headers=self._headers(), timeout=30)
        return r

    def fetch_merchants(self):
        url = self._url('fetch')
        r = requests.get(url, headers=self._headers(), timeout=30)
        return r

    def create_payment(self, payload):
        url = self._url('payments')
        r = requests.post(url, json=payload, headers=self._headers(), timeout=30)
        return r

    def refund_payment(self, payload):
        url = self._url('payments/refund')
        r = requests.post(url, json=payload, headers=self._headers(), timeout=30)
        return r
    def create_cashin(self, payload):
        """Call the Airtel `standard/v2/cashin/` endpoint.

        This endpoint uses the root `/standard/v2/cashin/` path (not the configured
        `AIRTEL_API_PREFIX`). It also supports additional headers `x-signature`
        and `x-key` which should be provided via environment variables
        `AIRTEL_SIGNATURE` and `AIRTEL_KEY`.
        """
        url = f"{self.base.rstrip('/')}/standard/v2/cashin/"
        headers = self._headers()
        sig = os.getenv('AIRTEL_SIGNATURE')
        key = os.getenv('AIRTEL_KEY')
        if sig:
            headers['x-signature'] = sig
        if key:
            headers['x-key'] = key
        r = requests.post(url, json=payload, headers=headers, timeout=30)
        return r
