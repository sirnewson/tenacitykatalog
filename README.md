# Tenacity Katalog

A responsive React storefront for Tenacity Locks Ltd. It combines an editorial product-of-the-month hero, category discovery, fast catalogue search and filtering, product details, and direct WhatsApp/call enquiries.

## Run locally

```bash
npm install
npm run dev
```

## Build and verify

```bash
npm run build
npm run test:sites
```

Edit product records in `data/products.json` and collection copy in `data/sections.json`. The build regenerates `public/catalog.json`, the public AI/search-friendly catalogue feed. Product images and downloadable PDFs are served from `public/`.
