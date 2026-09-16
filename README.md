<div align="center">

# 🛒 ZYPHORA – Full Stack E-Commerce Web Application

### 🛍️ Seamless Shopping • 🔐 Secure Authentication • ⚡ Scalable Backend

**Zyphora** is a full-stack e-commerce web application built using **React (Frontend)** and **Spring Boot (Backend)**. It provides a seamless shopping experience with secure authentication, product management, and order processing.

<br>

🌐 **Live Demo:** https://zyphora-cart.vercel.app

⏳ *Note: initial load may take 5 - 10 seconds to load*

</div>

---

# 💡 Key Highlights

| 🚀  | Highlight                                                                           |
| --- | ----------------------------------------------------------------------------------- |
| 🔌  | Built **10+ REST APIs** for authentication, product, and order management           |
| 🔐  | Implemented **JWT-based authentication** with role-based authorization              |
| 🏗️ | Designed backend using **layered architecture (Controller → Service → Repository)** |
| ⚡   | Optimized database queries for improved performance                                 |

---

# 🏗️ Architecture

```text
                         ┌──────────────────┐
                         │      USER        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  React Frontend  │
                         └────────┬─────────┘
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
                    └────────────┬─────────────┘
                                 │
                                 ▼
                    ┌──────────────────────────┐
                    │      Repository Layer    │
                    └────────────┬─────────────┘
                                 │
                                 ▼
                         ┌────────────────┐
                         │   PostgreSQL   │
                         └────────────────┘
```

### 🔐 Authentication Flow

```text
┌────────┐
│  User  │
└───┬────┘
    │
    ▼
┌──────────┐
│  Login   │
└────┬─────┘
     │
     ▼
┌────────────────┐
│   JWT Token    │
└───────┬────────┘
        │
        ▼
┌──────────────────────┐
│ Secured API Requests │
└──────────────────────┘
```

---

# 🚀 Features

## 👤 User Features

* 📝 User Registration & Login (JWT Authentication)
* 🛍️ Browse Products with Categories
* 🛒 Add to Cart & Manage Cart
* 📦 Place Orders & Track Orders

---

## 🔐 Admin Features

* ➕ Add / Update / Delete Products
* 📦 Manage Orders
* 🛡️ Role-Based Access Control

---

## ⚙️ System Features

* 🔌 RESTful API Architecture
* 🔐 Secure Authentication using JWT
* ⚡ Optimized Database Queries
* 📈 Scalable Backend Design

---

# 🛠 Tech Stack

### 💻 Frontend

![React](https://img.shields.io/badge/React.js-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge\&logo=html5\&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge\&logo=css3\&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge\&logo=javascript\&logoColor=black)

### 🔧 Backend

![Java](https://img.shields.io/badge/Java%208-ED8B00?style=for-the-badge\&logo=openjdk\&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-6DB33F?style=for-the-badge\&logo=springboot\&logoColor=white)
![Spring Security](https://img.shields.io/badge/Spring%20Security-6DB33F?style=for-the-badge\&logo=springsecurity\&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge\&logo=jsonwebtokens\&logoColor=white)

### 🗄 Database

![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge\&logo=postgresql\&logoColor=white)

### 🧰 Tools

![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge\&logo=git\&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge\&logo=github\&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge\&logo=postman\&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge\&logo=docker\&logoColor=white)

---

# 🌐 API Endpoints

| Method | Endpoint             | Description      |
| :----: | -------------------- | ---------------- |
| `POST` | `/api/auth/register` | Register user    |
| `POST` | `/api/auth/login`    | Login user       |
|  `GET` | `/api/products`      | Get all products |
| `POST` | `/api/orders`        | Create order     |

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

**Built with React • Spring Boot • Spring Security • PostgreSQL • JWT**

</div>
