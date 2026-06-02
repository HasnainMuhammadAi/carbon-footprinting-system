# 🍑 SwatCarbon — Peach Business Carbon Footprint System
### Swat, Pakistan | Role-Based Modular Carbon Management

---

## 📁 Project Structure

```
swatcarbon/
├── carbon-backend/          ← Node.js + Express API
├── carbon-frontend/         ← React.js + Tailwind UI
└── carbon_footprint_schema.sql  ← MySQL database schema
```

---

## ⚙️ Setup — Backend

### 1. Create MySQL Database
```sql
CREATE DATABASE carbon_footprint_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carbon_footprint_db;
-- Then run: carbon_footprint_schema.sql
```

### 2. Configure .env
Edit `carbon-backend/.env`:
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=carbon_footprint_db
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=24h
```

### 3. Install & Run
```bash
cd carbon-backend
npm install
npm run dev        # uses nodemon
# or
npm start          # production
```

Backend runs at: http://localhost:5000

---

## 🎨 Setup — Frontend

### 1. Configure .env
Edit `carbon-frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 2. Install & Run
```bash
cd carbon-frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

---

## 👥 Roles & Default Access

| Role             | Can Access |
|------------------|------------|
| `owner`          | Dashboard, all modules, all reports |
| `farming_admin`  | Farming module only |
| `transport_admin`| Transport module only |
| `storage_admin`  | Storage module only |
| `packaging_admin`| Packaging module only |

### Register first owner via API (Postman/curl):
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "full_name": "Ahmad Khan",
  "email": "owner@swatcarbon.pk",
  "password": "securepassword",
  "role": "owner"
}
```

---

## 🌐 API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| GET/POST | /api/farms | Authenticated |
| GET/POST/DELETE | /api/farming | owner, farming_admin |
| GET/POST/DELETE | /api/transport | owner, transport_admin |
| GET/POST/DELETE | /api/storage | owner, storage_admin |
| GET/POST/DELETE | /api/packaging | owner, packaging_admin |
| GET | /api/reports/owner | owner only |
| GET | /api/reports/monthly | owner only |

---

## 🗄️ Database
Run `carbon_footprint_schema.sql` in MySQL after creating the database.
The schema includes all 8 tables with emission factors pre-seeded (IPCC 2006 values).
