# 🚗 AutoPartsPro — Full Stack E-commerce Project
**UCT Full Stack Internship Project #3 — E-commerce Website for Automotive Parts**

---

## 📁 Project Structure

```
autoparts-fullstack/
├── backend/
│   ├── server.js              ← Main server (zero dependencies!)
│   ├── db.js                  ← JSON file-based database helper
│   ├── package.json
│   ├── data/
│   │   └── db.json            ← Database (products, users, orders, cart, reviews)
│   ├── middleware/
│   │   └── auth.js            ← JWT signing/verification + password hashing
│   └── routes/
│       ├── auth.js            ← Register / Login
│       ├── products.js        ← Product CRUD + search/filter
│       ├── cart.js            ← Shopping cart (per user/session)
│       ├── orders.js          ← Order placement + tracking
│       ├── reviews.js         ← Product reviews
│       └── admin.js           ← Admin dashboard stats
└── frontend/
    └── index.html             ← Full UI connected to backend API
```

---

## 🚀 How to Run

### Prerequisites
- Node.js v16+ (no npm install needed — zero external dependencies!)

### Start the server
```bash
cd backend
node server.js
```

The server starts at **http://localhost:3000**

Open **http://localhost:3000** in your browser to see the full app.

### Dev mode (auto-restart on file change — Node 18+)
```bash
node --watch server.js
```

---

## 🔑 Default Admin Credentials
| Field    | Value                      |
|----------|----------------------------|
| Email    | admin@autopartspro.com     |
| Password | admin123                   |
| Role     | admin                      |

---

## 📡 REST API Reference

### Auth
| Method | Endpoint          | Auth | Description          |
|--------|-------------------|------|----------------------|
| POST   | /api/auth/register | —   | Create new account   |
| POST   | /api/auth/login    | —   | Login, get JWT token |
| GET    | /api/auth/me       | ✅  | Get current user     |

**Register body:**
```json
{ "name": "Ravi Kumar", "email": "ravi@example.com", "password": "pass123" }
```
**Login body:**
```json
{ "email": "ravi@example.com", "password": "pass123" }
```
**Response includes JWT token** — send as `Authorization: Bearer <token>` for protected routes.

---

### Products
| Method | Endpoint                  | Auth    | Description            |
|--------|---------------------------|---------|------------------------|
| GET    | /api/products             | —       | List/search/filter     |
| GET    | /api/products/:id         | —       | Get single product     |
| GET    | /api/products/categories  | —       | All categories + count |
| POST   | /api/products             | 🔒 Admin | Create product        |
| PUT    | /api/products/:id         | 🔒 Admin | Update product        |
| DELETE | /api/products/:id         | 🔒 Admin | Delete product        |

**Query params for GET /api/products:**
```
?q=spark plug          # Search by name/brand/category
?category=Engine Parts # Filter by category
?brand=Bosch           # Filter by brand
?badge=new             # Filter by badge (new/sale/popular)
?minPrice=500&maxPrice=2000
?sort=price_asc        # price_asc | price_desc | rating | popular
?page=1&limit=12       # Pagination
```

---

### Cart
| Method | Endpoint           | Auth | Description                    |
|--------|--------------------|------|--------------------------------|
| GET    | /api/cart          | —    | Get cart (by user or session)  |
| POST   | /api/cart          | —    | Add item to cart               |
| PUT    | /api/cart/:id      | —    | Update item quantity           |
| DELETE | /api/cart/:id      | —    | Remove item                    |
| DELETE | /api/cart          | —    | Clear entire cart              |

**Add to cart body:** `{ "productId": 3, "qty": 1 }`
> Guest carts use `X-Session-Id` header. Logged-in users have persistent cart.

---

### Orders
| Method | Endpoint                  | Auth    | Description          |
|--------|---------------------------|---------|----------------------|
| POST   | /api/orders               | ✅      | Place order from cart|
| GET    | /api/orders               | ✅      | My orders (admin: all)|
| GET    | /api/orders/:id           | ✅      | Single order detail  |
| PATCH  | /api/orders/:id/status    | 🔒 Admin | Update order status |

**Place order body:**
```json
{
  "shippingAddress": "123 MG Road, Pune, 411001",
  "paymentMethod": "online"
}
```
Order automatically: deducts stock, calculates tax (18% GST) + shipping, clears cart.

**Order statuses:** `pending → confirmed → processing → shipped → delivered` (or `cancelled`)

---

### Reviews
| Method | Endpoint       | Auth | Description             |
|--------|----------------|------|-------------------------|
| GET    | /api/reviews   | —    | Get reviews (filter by ?productId=X) |
| POST   | /api/reviews   | ✅  | Add review (1 per product per user) |
| DELETE | /api/reviews/:id | ✅ | Delete own review       |

**Add review body:** `{ "productId": 1, "rating": 5, "comment": "Great product!" }`

---

### Admin Dashboard
| Method | Endpoint          | Auth    | Description                      |
|--------|-------------------|---------|----------------------------------|
| GET    | /api/admin/stats  | 🔒 Admin | Revenue, order stats, low stock |
| GET    | /api/admin/users  | 🔒 Admin | All registered users            |

---

## 🧱 Tech Stack

| Layer       | Technology                                      |
|-------------|------------------------------------------------|
| Backend     | Node.js (built-in `http` module — no Express!) |
| Database    | JSON file (`db.json`) — no external DB needed  |
| Auth        | Custom JWT (HMAC-SHA256) + SHA-256 passwords   |
| Frontend    | HTML5 + CSS3 + Vanilla JS                      |
| API Style   | RESTful JSON API                               |

---

## 🔐 Security Features
- JWT tokens (24-hour expiry, HMAC-SHA256 signed)
- Passwords hashed with SHA-256 before storage
- Role-based access control (customer vs admin)
- CORS headers for cross-origin requests
- Input validation on all routes

---

## 📊 Business Logic
- **Free shipping** on orders ≥ ₹999
- **18% GST** applied automatically
- **Stock tracking** — decremented on order
- **Low stock alerts** (< 10 units) in admin dashboard
- **Product ratings** recalculated on each review
- **One review per user per product** enforced

---

## 🧪 Test the API with curl

```bash
# Health check
curl http://localhost:3000/api/health

# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@autopartspro.com","password":"admin123"}'

# Get products
curl "http://localhost:3000/api/products?q=bosch&sort=rating"

# Admin stats (use token from login)
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

*Built as UCT Full Stack Internship Project — Project Report should cover:*
*Background → Problem Statement → System Design → API Implementation → Testing → Learnings*
