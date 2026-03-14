# API Specification

Base URL
/api/v1

Auth
POST /auth/login
POST /auth/register

Payments
POST /payments
GET /payments/{id}
POST /payments/{id}/refund

Customers
POST /customers
GET /customers/{id}

Subscriptions
POST /subscriptions
GET /subscriptions/{id}

Webhooks
POST /webhooks
