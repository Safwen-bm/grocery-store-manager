# Superette Faiza 🛒

A simple grocery store inventory & catalog web app. Backend built with Express + MongoDB (Mongoose), frontend built with React + Vite. Includes product browsing with search/category filters, and an admin-style product management interface (add/edit/delete, auto-calculated selling price from cost + profit margin, expiry date tracking, low-stock indicator).

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Frontend:** React 19, Vite, React Router, Axios

## Project Structure

superette-faiza/
├── backend/
│ ├── models/
│ │ └── Product.js
│ ├── routes/
│ │ └── products.js
│ └── server.js
├── frontend/
│ └── src/
│ └── pages/
│ ├── Home.jsx
│ ├── Products.jsx
│ ├── ProductDetails.jsx
│ └── ManageProducts.jsx
├── package.json
└── .env.example


## Setup

1. Clone the repo and install dependencies:

```bash
   npm install
   cd frontend && npm install && cd ..
```

2. Copy `.env.example` to `.env` in the project root and fill in your own MongoDB connection string:

```bash
   cp .env.example .env
```

```dotenv
   MONGO_URI=your_mongodb_connection_string_here
   PORT=5000
```

3. Run both backend and frontend together from the project root:

```bash
   npm start
```

   - Backend runs on `http://localhost:5000`
   - Frontend (Vite) runs on `http://localhost:5173`

## Features

- Browse products with live search and category filtering
- Product detail pages
- Add/edit/delete products (image upload via base64, auto-calculated selling price)
- Low-stock visual warning
- Expiry date tracking

## License

ISC