# PriceLens

PriceLens is a polished single-page tool for tracking device prices, comparing store offers, and understanding the real effective price after discounts and GST.

## Highlights

- Product, store, and price-entry management
- Real-time discount and GST calculations
- Dashboard views for best deals and store comparisons
- CSV export for collected pricing data
- Clean static structure with separate HTML, CSS, and JavaScript files

## Project Structure

```text
.
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       └── app.js
├── index.html
└── README.md
```

## Run Locally

Because this is a static app, you can open `index.html` directly in a browser or serve the folder with any simple local server.

Example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Current Data Model

The current frontend stores data in `localStorage` with three main collections:

- `products`
- `stores`
- `entries`

That makes the app easy to prototype, but it is not suitable for multi-user access or persistent team data.

## How to Connect MongoDB

To connect this project to MongoDB professionally, the next step is to introduce a backend API instead of accessing the database directly from the browser.

Recommended approach:

1. Create a backend service with Node.js and Express.
2. Add MongoDB with Mongoose.
3. Move `products`, `stores`, and `entries` into database models.
4. Replace `localStorage` reads and writes with API requests such as:
   - `GET /api/products`
   - `POST /api/products`
   - `GET /api/stores`
   - `POST /api/stores`
   - `GET /api/entries`
   - `POST /api/entries`
5. Store the Mongo connection string in an environment variable like `MONGODB_URI`.

Suggested collections:

- `users`
- `products`
- `stores`
- `entries`

Suggested entry fields:

- `productId`
- `storeId`
- `mrp`
- `base`
- `discounts`
- `discMode`
- `gst`
- `grate`
- `note`
- `createdAt`
- `createdBy`

## How to Add Login

For login, keep authentication on the backend and let the frontend only consume secure APIs.

Recommended approach:

1. Add a `users` collection.
2. Store hashed passwords with `bcrypt`.
3. Create auth routes such as:
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/logout`
   - `GET /api/auth/me`
4. Use either:
   - HTTP-only session cookies for simpler web security, or
   - JWT auth if you need a separate API client/mobile app
5. Protect write routes so only logged-in users can create, edit, or delete entries.
6. Associate every record with a user or workspace if the app will support multiple people.

For a first production-ready version, session cookies are usually simpler and safer than storing tokens in browser storage.

## Suggested Next Upgrade Path

1. Add a backend API
2. Move storage from `localStorage` to MongoDB
3. Add authentication and protected routes
4. Add form validation and error states
5. Deploy frontend and backend separately

## Notes

This repository currently focuses on the frontend experience. MongoDB and login are best added as a second phase with a backend layer.
