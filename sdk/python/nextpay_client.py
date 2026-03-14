from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional
import requests


@dataclass
class PayForgeClient:
    api_key: str
    base_url: str = "https://api.payforge.local/api/v1"

    def _request(self, method: str, path: str, payload: Optional[Dict[str, Any]] = None) -> Any:
        headers = {
            "content-type": "application/json",
            "x-api-key": self.api_key,
        }
        response = requests.request(method, f"{self.base_url.rstrip('/')}{path}", json=payload, headers=headers, timeout=30)
        data = response.json() if response.content else {}
        if not response.ok:
            raise RuntimeError(data.get("error", "payforge_request_failed"))
        return data

    def create_payment(self, amount: int, currency: str, customer_id: Optional[str] = None, metadata: Optional[Dict[str, str]] = None) -> Any:
        body = {
            "amount": amount,
            "currency": currency,
            "customerId": customer_id,
            "metadata": metadata or {},
        }
        return self._request("POST", "/payments", body)

    def get_payment(self, payment_id: str) -> Any:
        return self._request("GET", f"/payments/{payment_id}")

    def refund_payment(self, payment_id: str, amount: int, reason: Optional[str] = None) -> Any:
        return self._request("POST", f"/payments/{payment_id}/refund", {"amount": amount, "reason": reason})
