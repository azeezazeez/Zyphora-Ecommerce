<div align="center">

# 🛒 ZYPHORA

### Full-Stack E-Commerce Web Application

**Modern Shopping Experience • Secure Authentication • AI Shopping Assistant • Admin Management**

Zyphora is a full-stack e-commerce platform built with **React + TypeScript** on the frontend and **Spring Boot + Java** on the backend. The application includes customer authentication, OTP verification, Google OAuth, product browsing, cart and wishlist management, checkout, order tracking, profile management, transactional emails, an AI shopping assistant, and a protected admin dashboard.

<br>

🌐 **Live Demo:** https://zyphora-cart.vercel.app

</div>

---

## 📌 Overview

Zyphora is designed as a complete online shopping application rather than a simple product-listing project.

The system separates the customer-facing React application from a RESTful Spring Boot backend. Authentication and authorization are handled by Spring Security and JWT, persistent data is managed with PostgreSQL and Spring Data JPA, transactional emails are sent through the Brevo API, Google OAuth is handled by the backend, and the built-in AI assistant communicates with Groq.

The backend follows a layered structure:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
PostgreSQL
```

The frontend communicates with the backend through REST APIs and maintains authentication, cart, wishlist, and notification state using React Context.

---

# ✨ Key Highlights

| Area | Implementation |
| --- | --- |
| 🔐 Authentication | JWT authentication with Spring Security |
| 📧 Email Verification | 6-digit OTP verification for registration |
| 🔑 Password Recovery | OTP-based forgot-password and reset flow |
| 📱 Email OTP Login | Request and verify OTP for email-based authentication |
| 🔵 Google Login | Backend-managed Google OAuth 2.0 authorization flow |
| 🛍️ Shopping | Product browsing, categories, product details |
| 🛒 Cart | Add, update, remove, and clear cart items |
| ❤️ Wishlist | Add, remove, and check wishlist status |
| 📦 Orders | Checkout, order history, details, summary, cancellation |
| 💳 Payment Selection | COD, UPI, and CARD payment methods are supported as order selections |
| 📩 Order Emails | Transactional order and status emails through Brevo |
| 🤖 AI Assistant | Groq-powered Zyphora shopping assistant |
| 👨‍💼 Admin | Products, orders, statistics, and customer management |
| 🛡️ Security | JWT filtering, role-based authorization, validation, CORS |
| 🗄️ Database | PostgreSQL with Spring Data JPA / Hibernate |
| 🐳 Deployment | Dockerized Spring Boot backend |
| ⚡ Frontend | React 19, TypeScript, Vite, Tailwind CSS, Motion |

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │       Customer      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────┐
                    │     React + TypeScript      │
                    │       Vite Frontend         │
                    │                             │
                    │  • Storefront               │
                    │  • Authentication           │
                    │  • Cart / Wishlist          │
                    │  • Checkout / Orders        │
                    │  • Profile                  │
                    │  • Admin Dashboard           │
                    │  • AI Chatbot               │
                    └──────────────┬──────────────┘
                                   │
                              REST / JSON
                                   │
                                   ▼
                    ┌─────────────────────────────┐
                    │        Spring Boot          │
                    │          REST API           │
                    └──────────────┬──────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌─────────────┐     ┌───────────────┐    ┌───────────────┐
       │  Security   │     │ Service Layer │    │ Validation /  │
       │ JWT / Roles │     │ Business Logic│    │ Error Handling│
       └─────────────┘     └───────┬───────┘    └───────────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │ Spring Data JPA   │
                         │    Repository     │
                         └─────────┬─────────┘
                                   │
                                   ▼
                         ┌───────────────────┐
                         │    PostgreSQL     │
                         └───────────────────┘

       External Integrations
       ─────────────────────────────────────────────

       Spring Boot ──────► Brevo Email API
       Spring Boot ──────► Google OAuth / OpenID Connect
       Spring Boot ──────► Groq AI API
```

---

# 🚀 Features

## 👤 Customer Features

### Authentication & Account

- User registration
- Registration email OTP verification
- 6-digit OTP validation
- OTP expiry and resend cooldown handling
- OTP attempt protection
- Email OTP login
- Normal email/password login
- JWT-based authentication
- Google OAuth login
- Automatic profile loading after authentication
- Secure password hashing with BCrypt
- Forgot-password OTP
- Password reset
- View profile
- Update profile
- Change password
- Delete account
- Logout
- Client-side JWT expiration detection
- Automatic session cleanup after unauthorized responses

### Product Shopping

- Browse all products
- Browse products by category
- View individual product details
- Responsive product grid
- Product cards
- Product availability and stock validation

### Cart

- Add product to cart
- Update product quantity
- Remove product from cart
- Clear cart
- Cart drawer
- Cart page
- Quantity validation
- Empty-cart handling

### Wishlist

- Add product to wishlist
- Remove product from wishlist
- Check whether a product is already wishlisted
- Wishlist page
- Wishlist state management through React Context

### Checkout & Orders

- Checkout page
- Shipping address collection
- Payment method selection
- Supported payment methods:
  - `COD`
  - `UPI`
  - `CARD`
- Order creation
- Stock validation during order placement
- Order history
- Individual order details
- Order summary
- Order cancellation for eligible orders
- Order status lifecycle:
  - `PENDING`
  - `CONFIRMED`
  - `PROCESSING`
  - `SHIPPED`
  - `DELIVERED`
  - `CANCELLED`

> **Important:** The current implementation records the selected payment method. It does not contain a live payment-gateway integration or store card/CVV/UPI credentials.

### 📩 Email Communication

The backend uses the **Brevo Email API** for transactional emails, including:

- Registration OTP
- Email OTP authentication
- Password reset OTP
- Order-related emails
- Order status update emails

---

# 🤖 Zyphora AI Shopping Assistant

Zyphora includes a dedicated AI shopping assistant accessible from the frontend.

The backend exposes:

```text
POST /api/chat
```

The AI service communicates with the Groq API using the configured model:

```text
openai/gpt-oss-120b
```

The assistant is designed to help with:

- Product questions
- Categories
- Shopping recommendations
- Cart usage
- Orders
- Delivery
- Returns
- Payments
- Account usage
- General shopping questions

### AI safety behavior

The assistant is instructed not to invent:

- Product information
- Prices
- Stock availability
- Order status
- Delivery dates
- Discounts
- Account information
- Unsupported policies

It also does not directly access private customer account, cart, or order information.

The frontend stores AI chat history locally for the authenticated user and supports:

- Suggested questions
- Chat history
- Clear chat
- Refresh
- Responsive chat interface
- Mobile background locking while the chat is open

---

# 👨‍💼 Admin Features

The application contains a protected admin dashboard.

### Product Management

- Create products
- Update products
- Delete products

### Order Management

- View all orders
- View order statistics
- Update order status

### Customer Management

- View all customers
- View customer order statistics
- View customer total spending

### Admin Security

Admin APIs are protected by authentication and role-based authorization.

Frontend admin routes:

```text
/admin
/admin/products
/admin/orders
/admin/customers
```

Unauthorized users are redirected to the access-denied flow.

---

# 🔐 Authentication Architecture

## Standard Registration

```text
User
  │
  ▼
Register
  │
  ▼
6-Digit OTP Sent by Email
  │
  ▼
Verify OTP
  │
  ▼
Account Created
  │
  ▼
JWT Generated
  │
  ▼
Authenticated API Requests
```

## Email OTP Login

```text
User
  │
  ▼
Enter Email
  │
  ▼
Request OTP
  │
  ▼
Brevo Email
  │
  ▼
Verify OTP
  │
  ▼
Authenticated User + JWT
```

## Google OAuth

```text
React Frontend
      │
      ▼
/api/auth/google
      │
      ▼
Google Authorization
      │
      ▼
Google Callback
      │
      ▼
Google User Profile
      │
      ▼
Find/Create Zyphora User
      │
      ▼
Generate Zyphora JWT
      │
      ▼
/oauth-success?token=...
      │
      ▼
Frontend Loads User Profile
```

The Google authorization code is exchanged by the Spring Boot backend rather than exposing the Google client secret to the frontend.

---

# 🔑 Password Recovery Flow

```text
Forgot Password
      │
      ▼
Generate 6-Digit OTP
      │
      ▼
Send OTP through Brevo
      │
      ▼
Verify OTP
      │
      ▼
Reset Password
      │
      ▼
BCrypt Password Hash
```

The implementation includes OTP expiration and verification protection.

---

# 🛡️ Security

The backend implements multiple security layers:

- Spring Security
- JWT authentication
- JWT request filtering
- Stateless authentication
- Role-based authorization
- BCrypt password hashing
- Request validation
- CORS configuration
- Protected admin endpoints
- Authentication-required API requests
- Structured API error responses
- Resource-not-found handling
- OTP expiration
- OTP resend cooldown
- Maximum OTP attempt protection

The frontend also checks JWT expiration locally and removes expired authentication data.

---

# 🛠️ Technology Stack

## Frontend

![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-7.18-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-12-000000?style=for-the-badge&logo=framer&logoColor=white)
![Lucide](https://img.shields.io/badge/Lucide%20React-Icons-000000?style=for-the-badge)

### Frontend architecture

- React functional components
- React Context API
- React Router
- TypeScript interfaces
- Vite
- Tailwind CSS v4 integration
- Motion animations
- Responsive UI
- Local storage for authenticated user and AI chat state
- Centralized API service
- Protected application state

---

## Backend

![Java](https://img.shields.io/badge/Java-17-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.13-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge&logo=springsecurity&logoColor=white)
![Spring Data JPA](https://img.shields.io/badge/Spring%20Data%20JPA-6DB33F?style=for-the-badge&logo=spring&logoColor=white)
![JWT](https://img.shields.io/badge/JJWT-0.11.5-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge&logo=apachemaven&logoColor=white)

Backend technologies:

- Java 17
- Spring Boot 3.5.13
- Spring Web
- Spring Security
- Spring Data JPA
- Hibernate
- Jakarta Validation
- JJWT 0.11.5
- PostgreSQL
- Lombok
- Maven
- Spring Boot Mail dependency
- REST clients using `RestTemplate`

---

## Database

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Hibernate](https://img.shields.io/badge/Hibernate-ORM-59666C?style=for-the-badge&logo=hibernate&logoColor=white)

The backend uses PostgreSQL as the persistent database and Spring Data JPA / Hibernate for ORM and repository access.

Main domain entities include:

- User
- Admin
- Product
- CartItem
- WishlistItem
- Order
- OrderItem
- PasswordReset
- UpdateProfile

---

## External Services

### Brevo

Used for transactional email delivery:

- Registration OTP
- Email authentication OTP
- Password reset OTP
- Order emails
- Order status emails

### Google OAuth

Used for Google-based authentication.

### Groq

Used by the Zyphora AI shopping assistant.

---

## Development & Deployment

![Docker](https://img.shields.io/badge/Docker-Containerization-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Git](https://img.shields.io/badge/Git-Version%20Control-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-API%20Testing-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

---

# 📁 Project Structure

```text
Zyphora Ecommerce/
│
├── backend/
│   ├── Dockerfile
│   ├── pom.xml
│   ├── mvnw
│   ├── mvnw.cmd
│   │
│   └── src/main/
│       ├── java/com/ecommerce/backend/
│       │   │
│       │   ├── config/
│       │   │   ├── exception/
│       │   │   ├── JwtFilter.java
│       │   │   ├── PasswordConfig.java
│       │   │   ├── RestTemplateConfig.java
│       │   │   └── SecurityConfig.java
│       │   │
│       │   ├── controller/
│       │   │   ├── AdminController.java
│       │   │   ├── AuthController.java
│       │   │   ├── CartController.java
│       │   │   ├── ChatController.java
│       │   │   ├── HealthController.java
│       │   │   ├── OrderController.java
│       │   │   ├── ProductController.java
│       │   │   └── WishlistController.java
│       │   │
│       │   ├── dto/
│       │   ├── entity/
│       │   ├── repository/
│       │   ├── service/
│       │   │
│       │   └── EcommerceApplication.java
│       │
│       └── resources/
│           └── application.properties
│
├── frontend/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── vercel.json
│   │
│   └── src/
│       ├── components/
│       │   ├── ai/
│       │   ├── auth/
│       │   ├── cart/
│       │   ├── common/
│       │   └── product/
│       │
│       ├── context/
│       │   ├── AuthContext.tsx
│       │   ├── CartContext.tsx
│       │   ├── ToastContext.tsx
│       │   └── WishlistContext.tsx
│       │
│       ├── pages/
│       │   ├── admin/
│       │   ├── AccessDeniedPage.tsx
│       │   ├── CartPage.tsx
│       │   ├── CheckoutPage.tsx
│       │   ├── HomePage.tsx
│       │   ├── OrdersPage.tsx
│       │   ├── ProductDetailPage.tsx
│       │   ├── ProfilePage.tsx
│       │   ├── ShopPage.tsx
│       │   ├── VerifyOtpPage.tsx
│       │   └── WishlistPage.tsx
│       │
│       ├── services/
│       │   ├── api.ts
│       │
│       ├── types/
│       │   └── index.ts
│       │
│       ├── App.tsx
│       ├── index.css
│       └── main.tsx
│
└── README.md
```

---

# 🌐 Frontend Routes

## Customer Routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/shop` | Product shop |
| `/product/:id` | Product details |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/orders` | Order history |
| `/wishlist` | Wishlist |
| `/profile` | User profile |
| `/verify-otp` | OTP verification |
| `/access-denied` | Access denied |
| `*` | Not found |

## Admin Routes

| Route | Page |
| --- | --- |
| `/admin` | Admin dashboard |
| `/admin/products` | Product management |
| `/admin/orders` | Order management |
| `/admin/customers` | Customer management |

---

# 🔌 REST API

The backend currently exposes **39 controller routes** across authentication, products, cart, wishlist, orders, admin management, AI chat, Google OAuth, and health checking.

## Authentication

| Method | Endpoint | Description |
| :---: | --- | --- |
| `POST` | `/api/auth/register` | Start user registration |
| `POST` | `/api/auth/register/verify-otp` | Verify registration OTP |
| `POST` | `/api/auth/email/request-otp` | Request email login OTP |
| `POST` | `/api/auth/email/verify-otp` | Verify email login OTP |
| `GET` | `/api/auth/google` | Start Google OAuth |
| `GET` | `/api/auth/google/callback` | Google OAuth callback |
| `POST` | `/api/auth/login` | Email/password login |
| `POST` | `/api/auth/forgot-password/generate-otp` | Generate password reset OTP |
| `POST` | `/api/auth/forgot-password/reset` | Reset password |
| `GET` | `/api/auth/profile` | Get authenticated profile |
| `PUT` | `/api/auth/profile` | Update profile |
| `PUT` | `/api/auth/profile/change-password` | Change password |
| `DELETE` | `/api/auth/profile` | Delete account |

## Products

| Method | Endpoint | Description |
| :---: | --- | --- |
| `GET` | `/api/products` | Get all products |
| `GET` | `/api/products/{id}` | Get product by ID |

## Cart

| Method | Endpoint | Description |
| :---: | --- | --- |
| `GET` | `/api/cart/{userId}` | Get user cart |
| `POST` | `/api/cart/add` | Add item to cart |
| `PUT` | `/api/cart/update` | Update cart quantity |
| `DELETE` | `/api/cart/remove/{userId}/{productId}` | Remove cart item |
| `DELETE` | `/api/cart/clear/{userId}` | Clear cart |

## Wishlist

| Method | Endpoint | Description |
| :---: | --- | --- |
| `GET` | `/api/wishlist/{userId}` | Get wishlist |
| `POST` | `/api/wishlist/add` | Add wishlist item |
| `DELETE` | `/api/wishlist/remove/{userId}/{productId}` | Remove wishlist item |
| `GET` | `/api/wishlist/{userId}/check/{productId}` | Check wishlist status |

## Orders

| Method | Endpoint | Description |
| :---: | --- | --- |
| `POST` | `/api/orders/place/{userId}` | Place order |
| `GET` | `/api/orders/user/{userId}` | Get order history |
| `GET` | `/api/orders/{orderId}` | Get order details |
| `GET` | `/api/orders/user/{userId}/summary` | Get order summary |
| `PUT` | `/api/orders/{orderId}/cancel` | Cancel order |

## Admin

| Method | Endpoint | Description |
| :---: | --- | --- |
| `POST` | `/api/admin/products` | Create product |
| `PUT` | `/api/admin/products/{id}` | Update product |
| `DELETE` | `/api/admin/products/{id}` | Delete product |
| `GET` | `/api/admin/orders` | Get all orders |
| `GET` | `/api/admin/orders/stats` | Get order statistics |
| `PUT` | `/api/admin/orders/{orderId}/status` | Update order status |
| `GET` | `/api/admin/customers` | Get all customers |

## AI & Health

| Method | Endpoint | Description |
| :---: | --- | --- |
| `POST` | `/api/chat` | Generate AI assistant response |
| `GET` | `/health` | Backend health check |

---

# ⚙️ Environment Variables

The backend reads configuration from environment variables.

## Backend

Create the required environment variables before starting the backend:

```env
APP_NAME=Zyphora

SERVER_PORT=8080

FRONTEND_URL=http://localhost:3000

SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/zyphora
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_database_password
SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver

SPRING_JPA_HIBERNATE_DDL_AUTO=validate
SPRING_JPA_SHOW_SQL=false
SPRING_JPA_OPEN_IN_VIEW=false

JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRATION=86400000

BREVO_API_KEY=your_brevo_api_key
USER_MAIL=your_verified_sender_email

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

> Never commit real API keys, database passwords, JWT secrets, OAuth secrets, or other credentials to GitHub.

## Frontend

The frontend supports:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

If `VITE_API_BASE_URL` is not provided, the current frontend falls back to:

```text
https://zyphora-ecommerce.onrender.com/api
```

For local development, it is recommended to explicitly set:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

# 🏃 Running the Project Locally

## 1. Clone the repository

```bash
git clone https://github.com/azeezazeez/Zyphora-Ecommerce.git
cd Zyphora-Ecommerce
```

---

## 2. Configure PostgreSQL

Create a PostgreSQL database:

```sql
CREATE DATABASE zyphora;
```

Then configure the backend database environment variables:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/zyphora
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
```

The backend currently uses:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

by default, so the database schema is expected to already match the entity mappings.

---

## 3. Start the Backend

Open a terminal:

```bash
cd backend
```

Using Maven Wrapper:

### Windows

```bash
mvnw.cmd spring-boot:run
```

### Linux / macOS

```bash
./mvnw spring-boot:run
```

Or with Maven installed:

```bash
mvn spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

Health check:

```text
http://localhost:8080/health
```

---

## 4. Start the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

The project uses Vite with the configured development port `3000`.

---

# 🐳 Docker Backend

The backend contains a multi-stage Dockerfile.

Build the backend image:

```bash
cd backend

docker build -t zyphora-backend .
```

Run the container:

```bash
docker run -p 8080:8080 \
  -e FRONTEND_URL=http://localhost:3000 \
  -e SPRING_DATASOURCE_URL=jdbc:postgresql://host.docker.internal:5432/zyphora \
  -e SPRING_DATASOURCE_USERNAME=postgres \
  -e SPRING_DATASOURCE_PASSWORD=your_password \
  -e JWT_SECRET=your_secure_jwt_secret \
  -e BREVO_API_KEY=your_brevo_api_key \
  -e USER_MAIL=your_sender_email \
  -e GOOGLE_CLIENT_ID=your_google_client_id \
  -e GOOGLE_CLIENT_SECRET=your_google_client_secret \
  -e GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback \
  -e GROQ_API_KEY=your_groq_api_key \
  zyphora-backend
```

The Dockerfile builds with Maven and runs the application on Java 17.

---

# 🧪 API Testing

The backend can be tested with Postman or any REST client.

A typical authentication flow is:

```text
1. POST /api/auth/register
2. Receive registration OTP
3. POST /api/auth/register/verify-otp
4. Receive JWT
5. Send JWT in Authorization header
6. Access protected endpoints
```

Authenticated requests use:

```http
Authorization: Bearer <JWT_TOKEN>
```

Example order request:

```http
POST /api/orders/place/{userId}
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

```json
{
  "shippingAddress": "Your shipping address",
  "paymentMethod": "COD"
}
```

Allowed payment method values:

```text
COD
UPI
CARD
```

---

# 📦 Build Commands

## Frontend

Install dependencies:

```bash
npm install
```

Type-check:

```bash
npm run lint
```

Production build:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Backend

Build without tests:

```bash
./mvnw clean package -DskipTests
```

Run:

```bash
./mvnw spring-boot:run
```

---

# ☁️ Deployment

The current project contains deployment configuration for:

### Frontend

The frontend includes:

```text
vercel.json
```

with a SPA rewrite so client-side React Router routes can resolve correctly when directly refreshed.

The configured live frontend is:

```text
https://zyphora-cart.vercel.app
```

### Backend

The backend includes:

```text
Dockerfile
```

for containerized deployment.

The application is configured to receive database credentials, JWT configuration, email credentials, Google OAuth configuration, Groq credentials, and frontend origin through environment variables.

---

# 🧩 Application Modules

```text
Zyphora
│
├── Authentication
│   ├── Registration
│   ├── Email OTP
│   ├── Email OTP Login
│   ├── Password Login
│   ├── Google OAuth
│   ├── JWT
│   └── Password Recovery
│
├── Storefront
│   ├── Home
│   ├── Shop
│   ├── Product Details
│   ├── Cart
│   ├── Wishlist
│   └── Checkout
│
├── Orders
│   ├── Place Order
│   ├── Order History
│   ├── Order Details
│   ├── Order Summary
│   └── Order Cancellation
│
├── Account
│   ├── Profile
│   ├── Update Profile
│   ├── Change Password
│   └── Delete Account
│
├── AI
│   └── Zyphora AI Shopping Assistant
│
├── Admin
│   ├── Dashboard
│   ├── Products
│   ├── Orders
│   └── Customers
│
└── Infrastructure
    ├── PostgreSQL
    ├── JWT Security
    ├── Brevo
    ├── Google OAuth
    ├── Groq
    └── Docker
```

---

# 🧠 Engineering Concepts Demonstrated

This project demonstrates practical full-stack engineering concepts including:

- REST API design
- Layered backend architecture
- MVC-style separation
- DTO-based API communication
- Repository pattern through Spring Data JPA
- ORM with Hibernate
- JWT authentication
- Stateless security
- Role-based authorization
- OAuth 2.0 authorization-code flow
- OTP generation and verification
- Password hashing
- Request validation
- Exception handling
- CORS configuration
- Transactional order processing
- Database persistence
- External API integration
- Email service integration
- AI API integration
- React Context state management
- Client-side routing
- Protected routes
- Local storage session persistence
- Responsive UI development
- Docker containerization
- Production frontend deployment

---

# 📊 Order Lifecycle

Orders use the following status model:

```text
PENDING
   │
   ▼
CONFIRMED
   │
   ▼
PROCESSING
   │
   ▼
SHIPPED
   │
   ▼
DELIVERED
```

An eligible order can also move to:

```text
CANCELLED
```

The admin dashboard provides order status management.

---

# 📧 Transactional Email Flow

```text
Zyphora Backend
      │
      ├── Registration OTP
      ├── Login OTP
      ├── Password Reset OTP
      ├── Order Email
      └── Order Status Email
              │
              ▼
        Brevo Email API
              │
              ▼
        Customer Inbox
```

---

# 🤖 AI Request Flow

```text
Customer
   │
   ▼
Zyphora AI Chatbot
   │
   ▼
POST /api/chat
   │
   ▼
AIChatService
   │
   ▼
Groq API
   │
   ▼
AI Response
   │
   ▼
Chatbot UI
```

The API key remains on the backend; the frontend communicates with Zyphora's `/api/chat` endpoint instead of directly exposing the Groq credential.

---

# 📜 License

No explicit open-source license file is included in the current project.

If this repository is intended to be distributed publicly, add an appropriate `LICENSE` file before treating it as an open-source project.

---

# 👨‍💻 Author

<div align="center">

## Azeez

**Java Full Stack Developer**

Built with:

`React` • `TypeScript` • `Vite` • `Tailwind CSS` • `Spring Boot` • `Spring Security` • `PostgreSQL` • `JWT` • `Brevo` • `Google OAuth` • `Groq` • `Docker`

</div>

---

# ⭐ Project

If you find Zyphora useful or want to explore the implementation, feel free to star the repository and review the source code.

<div align="center">

### 🛒 ZYPHORA

**A complete full-stack e-commerce application built for real-world development practice.**

</div>
