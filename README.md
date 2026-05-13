# Optimized Warehouse

A lightweight web-based warehouse management prototype for mapping inventory areas into cube-like locations and managing SKUs as stock changes.

## What it includes

- A simplified visual floor plan key for Superior, Michigan, Huron, and Erie.
- Area-based location modeling that still supports zone and bay selections behind the scenes.
- Superior area support for 29 zones.
- SKU entry with SKU number, product name, quantity, location, date added, lot number, supplier, and barcode.
- Inventory movement from one cube/location to another.
- Inventory removal and quantity adjustment.
- Search by SKU, product name, barcode, supplier, lot number, or location.
- Less visual clutter by showing area names on the floor plan instead of all zone numbers.
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
