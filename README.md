<div align="center">

# 🛒 ZYPHORA – Full Stack E-Commerce Web Application

### 🛍️ Seamless Shopping • 🔐 Secure Authentication • ⚡ Scalable Backend

**Zyphora** is a full-stack e-commerce web application built using **React + TypeScript (Frontend)** and **Spring Boot + Java (Backend)**. It provides a complete shopping experience with secure authentication, email OTP verification, product management, cart and wishlist functionality, order processing, customer management, and an admin dashboard.

<br>

🌐 **Live Demo:** https://zyphora-cart.vercel.app

⏳ *Note: initial load may take 5 - 10 seconds to load*

</div>

---

# 💡 Key Highlights

| 🚀    | Highlight                                                                                                                             |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 🔌    | Built **30+ REST API endpoints** covering authentication, products, cart, wishlist, orders, admin operations, and customer management |
| 🔐    | Implemented **JWT-based authentication** with Spring Security and role-based access control                                           |
| 📧    | Implemented **email OTP verification** for user registration and password recovery                                                    |
| 🔑    | Added **forgot-password and password reset flow** with secure OTP validation                                                          |
| 🏗️   | Designed backend using **layered architecture (Controller → Service → Repository)**                                                   |
| 🛒    | Implemented complete **cart, wishlist, checkout, order history, and order cancellation** functionality                                |
| 👨‍💼 | Developed admin functionality for **products, orders, order statistics, and customer management**                                     |
| 🛡️   | Added request validation, authentication filters, CORS configuration, and secured API access                                          |
| 🗄️   | Integrated **PostgreSQL with Spring Data JPA / Hibernate** for persistent data management                                             |
| 📩    | Integrated **Brevo Email API** for transactional OTP and email communication                                                          |
| 🐳    | Added **Docker support** for backend containerization and deployment                                                                  |
| ⚡     | Implemented centralized API response handling and structured exception handling                                                       |

---

# 🏗️ Architecture

```text
                         ┌──────────────────┐
                         │      USER        │
                         └────────┬─────────┘
                                  │
                                  ▼
                     ┌────────────────────────┐
                     │ React + TypeScript     │
                     │ Vite Frontend          │
                     └───────────┬────────────┘
                                 │
                              REST API
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      Spring Boot         │
                    │       Controller         │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │       Service Layer      │
                    │ Business Logic / JWT /   │
                    │ OTP / Email / Processing │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      Repository Layer    │
                    │      Spring Data JPA     │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                         ┌────────────────┐
                         │   PostgreSQL   │
                         └────────────────┘

              External Email Communication
                         │
                         ▼
                  ┌───────────────┐
                  │  Brevo Email  │
                  │      API      │
                  └───────────────┘
```

### 🔐 Authentication Flow

```text
┌────────┐
│  User  │
└───┬────┘
    │
    ▼
┌─────────────────────┐
│ Register with Email │
│ Username + Password │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 6-Digit Email OTP   │
│      Verification   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   User Account      │
│      Created        │
└──────────┬──────────┘
           │
           ▼
┌──────────┴──────────┐
│       Login         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│     JWT Token       │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────┐
│ Secured API Requests │
└──────────────────────┘
```

### 📧 Password Recovery Flow

```text
┌────────┐
│  User  │
└───┬────┘
    │
    ▼
┌───────────────────┐
│ Forgot Password   │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Generate 6-Digit  │
│       OTP         │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Send OTP via      │
│   Brevo Email API │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Verify OTP        │
│ 5 Min Expiry      │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│ Reset Password    │
│ BCrypt Encoded    │
└───────────────────┘
```

---

# 🚀 Features

## 👤 User Features

* 📝 User Registration & Login
* 🔐 JWT Authentication
* 📧 Email OTP verification during registration
* ⏱️ OTP expiration and verification attempt protection
* 🔄 OTP resend cooldown
* 🔑 Forgot Password functionality
* 📧 Password reset OTP through Brevo Email API
* 🔒 Secure password encoding using Spring Security
* 👤 View and update user profile
* 🔐 Change account password
* 🗑️ Permanently delete account
* 🛍️ Browse Products
* 🔎 Browse products by categories
* 📦 View individual product details
* 🛒 Add products to cart
* ➕ Update cart quantities
* ➖ Remove products from cart
* 🧹 Clear cart
* ❤️ Add products to wishlist
* 💔 Remove products from wishlist
* 🔍 Check wishlist status
* 💳 Checkout and place orders
* 📦 View order history
* 🔎 View individual order details
* 📊 View order summary
* ❌ Cancel eligible orders

---

## 🔐 Admin Features

* 🛡️ Role-Based Access Control
* ➕ Add Products
* ✏️ Update Products
* 🗑️ Delete Products
* 📦 View All Orders
* 🔄 Update Order Status
* 📊 View Order Statistics
* 👥 View All Customers
* 📈 View customer order statistics
* 💰 View customer total spending
* 🔐 Secured Admin API endpoints
* 👨‍💼 Dedicated Admin Dashboard
* 📦 Admin Order Management
* 🛍️ Admin Product Management
* 👥 Admin Customer Management

---

## ⚙️ System Features

* 🔌 RESTful API Architecture
* 🔐 Spring Security with JWT Authentication
* 🛡️ JWT Request Filtering
* 👮 Role-Based Authorization
* 🔒 Stateless Security using JWT
* 📧 Brevo Email API Integration
* 📩 Transactional Email Support
* 🔢 Secure 6-Digit OTP Generation
* ⏱️ OTP Expiration Handling
* 🚫 Maximum OTP Attempt Protection
* ⏳ OTP Resend Cooldown
* 🔑 Secure Password Reset Flow
* 🔒 BCrypt Password Encryption
* 🧹 Input Validation and Request Validation
* 🚨 Structured API Error Responses
* ⚠️ Resource Not Found Exception Handling
* 🌐 Configured CORS for Production and Local Development
* 🗄️ Spring Data JPA / Hibernate
* 🐘 PostgreSQL Database
* 🐳 Dockerized Backend
* 🔄 REST Client Configuration
* 📊 Order Statistics
* ❤️ Wishlist Management
* 🛒 Cart Management
* 📦 Order Lifecycle Management
* ❤️ Responsive React Frontend
* ⚡ Vite-based Frontend Build
* 🎨 Tailwind CSS Integration
* ✨ Motion-based UI Animations
* 🧩 React Context API for Authentication, Cart, Wishlist, and Toast Notifications

---

# 🛠 Tech Stack

### 💻 Frontend

![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge\&logo=typescript\&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.1-06B6D4?style=for-the-badge\&logo=tailwindcss\&logoColor=white)
![React Router](https://img.shields.io/badge/React%20Router-7-CA4245?style=for-the-badge\&logo=reactrouter\&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-12-000000?style=for-the-badge\&logo=framer\&logoColor=white)

### 🔧 Backend

![Java](https://img.shields.io/badge/Java%2017-ED8B00?style=for-the-badge\&logo=openjdk\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5-6DB33F?style=for-the-badge\&logo=springboot\&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge\&logo=springsecurity\&logoColor=white)
![Spring Data JPA](https://img.shields.io/badge/Spring%20Data%20JPA-6DB33F?style=for-the-badge\&logo=spring\&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-0.11.5-000000?style=for-the-badge\&logo=jsonwebtokens\&logoColor=white)
![Maven](https://img.shields.io/badge/Maven-C71A36?style=for-the-badge\&logo=apachemaven\&logoColor=white)

### 🗄 Database

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge\&logo=postgresql\&logoColor=white)
![Hibernate](https://img.shields.io/badge/Hibernate-59666C?style=for-the-badge\&logo=hibernate\&logoColor=white)

### 📧 Email & Communication

![Brevo](https://img.shields.io/badge/Brevo-0B996E?style=for-the-badge\&logo=brevo\&logoColor=white)
![Spring Mail](https://img.shields.io/badge/Spring%20Mail-6DB33F?style=for-the-badge\&logo=spring\&logoColor=white)

### 🧰 Tools

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge\&logo=git\&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge\&logo=github\&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge\&logo=postman\&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge\&logo=docker\&logoColor=white)
![Lombok](https://img.shields.io/badge/Lombok-BD2C00?style=for-the-badge\&logo=java\&logoColor=white)

---

# 🌐 API Endpoints

|  Method  | Endpoint                                    | Description                                |
| :------: | ------------------------------------------- | ------------------------------------------ |
|  `POST`  | `/api/auth/register`                        | Register user and request OTP              |
|  `POST`  | `/api/auth/register/verify-otp`             | Verify registration OTP and create account |
|  `POST`  | `/api/auth/login`                           | Authenticate user and generate JWT         |
|  `POST`  | `/api/auth/forgot-password/generate-otp`    | Generate and send password reset OTP       |
|  `POST`  | `/api/auth/forgot-password/reset`           | Verify OTP and reset password              |
|   `GET`  | `/api/auth/profile`                         | Get authenticated user profile             |
|   `PUT`  | `/api/auth/profile`                         | Update authenticated user profile          |
|   `PUT`  | `/api/auth/profile/change-password`         | Change authenticated user password         |
| `DELETE` | `/api/auth/profile`                         | Delete authenticated user account          |
|   `GET`  | `/api/products`                             | Get all products                           |
|   `GET`  | `/api/products/{id}`                        | Get product by ID                          |
|   `GET`  | `/api/cart/{userId}`                        | Get user's cart                            |
|  `POST`  | `/api/cart/add`                             | Add product to cart                        |
|   `PUT`  | `/api/cart/update`                          | Update cart item quantity                  |
| `DELETE` | `/api/cart/remove/{userId}/{productId}`     | Remove product from cart                   |
| `DELETE` | `/api/cart/clear/{userId}`                  | Clear user's cart                          |
|   `GET`  | `/api/wishlist/{userId}`                    | Get user's wishlist                        |
|  `POST`  | `/api/wishlist/add`                         | Add product to wishlist                    |
| `DELETE` | `/api/wishlist/remove/{userId}/{productId}` | Remove product from wishlist               |
|   `GET`  | `/api/wishlist/{userId}/check/{productId}`  | Check wishlist status                      |
|  `POST`  | `/api/orders/place/{userId}`                | Place a new order                          |
|   `GET`  | `/api/orders/user/{userId}`                 | Get user's order history                   |
|   `GET`  | `/api/orders/{orderId}`                     | Get order details                          |
|   `GET`  | `/api/orders/user/{userId}/summary`         | Get user's order summary                   |
|   `PUT`  | `/api/orders/{orderId}/cancel`              | Cancel an order                            |
|  `POST`  | `/api/admin/products`                       | Create product                             |
|   `PUT`  | `/api/admin/products/{id}`                  | Update product                             |
| `DELETE` | `/api/admin/products/{id}`                  | Delete product                             |
|   `GET`  | `/api/admin/orders`                         | Get all orders                             |
|   `GET`  | `/api/admin/orders/stats`                   | Get order statistics                       |
|   `PUT`  | `/api/admin/orders/{orderId}/status`        | Update order status                        |
|   `GET`  | `/api/admin/customers`                      | Get all customers                          |
|   `GET`  | `/health`                                   | Backend health check                       |

---

# 👨‍💻 Author

<div align="center">

### **Azeez**

📌 Open to opportunities in **Java Full Stack Development**

</div>

---

# ⭐ Support

<div align="center">

If you like this project, give it a ⭐ on GitHub!

### 🛒 ZYPHORA

**Built with React • TypeScript • Vite • Tailwind CSS • Spring Boot • Spring Security • PostgreSQL • JWT • Brevo • Docker**

</div>
