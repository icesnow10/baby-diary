# baby-diary

Baby diary and care dashboard for sleep, feedings, diaper changes, pumping, growth, medicine, and diaper inventory.

## Stack

- Next.js 15 with Pages Router
- Ant Design 5
- Recharts
- React Flow dependency available if care flows are added later
- JSON persistence in `resources/data.json`

## Features

- Sleep entries with start time, end time, and calculated duration.
- Feeding entries for left/right nursing time or bottle volume in ml for breast milk or formula.
- Diaper entries for wet, dirty, mix, or dry changes, with optional assadura or Hipoglos cream.
- Diaper inventory by size.
- Pumping entries by left/right breast with start, finish, and optional volume.
- Growth records with day, height, weight, and head circumference.
- Medicine records with multiple medication names, amounts, units, and time.

## Run

```bash
npm install
npm run dev
```

The app runs on http://localhost:3010.
