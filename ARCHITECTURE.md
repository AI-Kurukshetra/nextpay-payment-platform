# System Architecture

System uses microservice architecture.

Services:

API Gateway
│
├── Auth Service
├── Payment Service
├── Customer Service
├── Subscription Service
├── Fraud Detection Service
└── Analytics Service

Infrastructure:
- Redis for caching
- Kafka for events
- PostgreSQL for storage
