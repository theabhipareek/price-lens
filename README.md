# PriceLens
---PS:THIS IS MADE TO GUIDE YOU WELL(Readme is AI generated while the code is Abhi generated) Have a great time using it!!

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




## Notes

This repository currently focuses on the frontend experience. MongoDB and login are best added as a second phase with a backend layer.
