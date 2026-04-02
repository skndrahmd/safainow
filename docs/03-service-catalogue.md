# SafaiNow — Service Catalogue

## Individual Services (The Basket)

The admin manages a basket of individual services. These are the building blocks for all packages and the Custom Package. Admin has full CRUD over this list.

| # | English | Urdu |
|---|---|---|
| 1 | Brooming | جھاڑو دینا |
| 2 | Mopping | پوچھا لگانا |
| 3 | Dusting | گرد صاف کرنا |
| 4 | Window Cleaning | کھڑکیاں صاف کرنا |
| 5 | Mirror Cleaning | آئینہ صاف کرنا |
| 6 | Carpet Vacuuming | قالین صاف کرنا |
| 7 | Sofa Cleaning | سوفہ صاف کرنا |
| 8 | Curtain Cleaning | پردے صاف کرنا |
| 9 | Bathroom Cleaning | باتھ روم صاف کرنا |
| 10 | Kitchen Cleaning | کچن صاف کرنا |
| 11 | Refrigerator Cleaning | فریج صاف کرنا |
| 12 | Stove Cleaning | اسٹو صاف کرنا |
| 13 | Clothes Washing | کپڑے دھونا |
| 14 | Clothes Drying | کپڑے سکھانا |
| 15 | Ironing | استری کرنا |

## Packages

| Package | Type | Includes | Pricing |
|---|---|---|---|
| Standard Cleaning | `cleaning` | Brooming, Mopping, Dusting | Flat — admin set |
| Special Cleaning | `cleaning` | Standard + Window, Mirror, Bathroom, Kitchen Cleaning | Flat — admin set |
| Advanced Deep Cleaning | `cleaning` | Special + Carpet Vacuum, Sofa, Curtain, Fridge, Stove Cleaning | Flat — admin set |
| Clothes Washing & Drying | `standalone` | Clothes Washing, Clothes Drying, Ironing | Flat — admin set |
| Custom Package | `custom` | Customer picks any combination from all 15 services | Sum of selected service prices |

## Package Types (Enum)

```typescript
type PackageType = 'cleaning' | 'standalone' | 'custom'
```

- `cleaning` — mutually exclusive with other cleaning packages
- `standalone` — can be combined with one cleaning package
- `custom` — fully standalone, cannot be combined with anything

## Package Combination Rules

|  | Standard | Special | Advanced | Clothes | Custom |
|---|---|---|---|---|---|
| Standard | — | ❌ | ❌ | ✅ | ❌ |
| Special | ❌ | — | ❌ | ✅ | ❌ |
| Advanced | ❌ | ❌ | — | ✅ | ❌ |
| Clothes | ✅ | ✅ | ✅ | — | ❌ |
| Custom | ❌ | ❌ | ❌ | ❌ | — |

## Important Rules

- Customer can select only **one cleaning package** per booking
- Clothes Washing & Drying can be added **alongside any single cleaning package**
- Custom Package is **fully standalone** — selecting it clears all other selections
- All packages apply to the **entire house** — no per-room configuration
- Combination rules are enforced on both **frontend (UI)** and **backend (API validation)**
- Each package has a **detail page** showing name, description, full service list and price
- `price_at_booking` is snapshotted on booking creation to preserve historical pricing

## Admin Package Management Rules

- Admin can create new packages using only services from the basket
- Admin can edit package name, description, flat price and constituent services
- Admin can enable/disable a package (disabled = hidden from customer app)
- Admin can delete a package permanently
- If an individual service is disabled/deleted, it is automatically removed from all packages
- Admin assigns package type on creation — this drives combination logic on the frontend
- **Package display order is controlled by admin via drag-and-drop** — the `sort_order` field determines the order packages appear in the customer app

## Package Display Order

Packages are displayed in both the admin dashboard and customer app ordered by `sort_order` (ascending). Admin can reorder packages via drag-and-drop in the admin dashboard. New packages are automatically assigned the next available `sort_order` value (placed at the end of the list).
