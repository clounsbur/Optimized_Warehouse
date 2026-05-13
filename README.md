# Optimized Warehouse

A lightweight web-based warehouse management prototype for mapping inventory areas into cube-like locations and managing SKUs as stock changes.

## What it includes

- A floor map organized by area, zone, and bay.
- Superior area support for 29 zones.
- Cube status cards for empty and occupied locations.
- SKU entry with SKU number, product name, quantity, location, date added, lot number, supplier, and barcode.
- Inventory movement from one cube/location to another.
- Inventory removal and quantity adjustment.
- Search by SKU, product name, barcode, supplier, lot number, or location.
- Local browser persistence through `localStorage`.

## Run locally

```bash
npm run dev
```

Then open <http://localhost:5173>.

## Checks

```bash
npm run build
```
