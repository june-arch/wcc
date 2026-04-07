# WCC Oranye Capture — Wedding Management System

Aplikasi manajemen booking & timeline wedding photography berbasis web.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Neon PostgreSQL |
| ORM | Prisma |
| Auth | BetterAuth |
| Deploy | Vercel |

---

## Cara Deploy (Step by Step)

### 1. Buat Neon Database

1. Buka [console.neon.tech](https://console.neon.tech) → **New Project**
2. Pilih region terdekat (Singapore)
3. Setelah project dibuat, buka **Connection Details**
4. Salin **Connection String** (format: `postgresql://user:pass@ep-xxx...`)
5. Simpan dua nilai:
   - `DATABASE_URL` = connection string dengan pooling
   - `DIRECT_URL` = connection string tanpa pooling (untuk migrate)

### 2. Clone & Setup Lokal

```bash
git clone <repo-url>
cd wcc-oranye-capture

# Install dependencies
npm install

# Copy env file
cp .env.example .env.local
# Edit .env.local dengan nilai yang sebenarnya
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema ke Neon
npm run db:push

# Seed data awal dari PDF booking
npx ts-node prisma/seed.ts
```

### 4. Jalankan Lokal

```bash
npm run dev
# Buka http://localhost:3000
```

Daftar akun baru di `/login` → klik **Daftar sekarang**.

---

### 5. Deploy ke Vercel

#### A. Via GitHub (Recommended)

1. Push kode ke GitHub repository
2. Buka [vercel.com](https://vercel.com) → **Add New Project**
3. Import repository
4. Di bagian **Environment Variables**, tambahkan:

```
DATABASE_URL          = <neon connection string pooled>
DIRECT_URL            = <neon connection string direct>
BETTER_AUTH_SECRET    = <random string 32+ chars>
BETTER_AUTH_URL       = https://your-app.vercel.app
NEXT_PUBLIC_APP_URL   = https://your-app.vercel.app
```

5. Klik **Deploy**

#### B. Generate BETTER_AUTH_SECRET

```bash
openssl rand -base64 32
```

Atau gunakan: [generate-secret.vercel.app](https://generate-secret.vercel.app)

#### C. Setelah Deploy — Run Seed via Vercel CLI

```bash
npx vercel env pull .env.production.local
npx ts-node prisma/seed.ts
```

---

## Fitur Aplikasi

### Dashboard
- Ringkasan statistik (total booking, pendapatan, task)
- Booking mendatang dengan countdown
- To Do list aktif

### Booking Management
- **Toggle view**: List ⇔ Kalender bulanan
- Filter berdasarkan status & pencarian
- Detail panel: info lengkap, tasks, pembayaran
- Form tambah booking baru

### To Do List (Kanban)
- 3 kolom: Belum — Proses — Selesai
- Klik ikon status untuk cycle (Todo → In Progress → Done)
- Filter berdasarkan status & prioritas
- Progress bar keseluruhan

### Keuangan
- Total nilai kontrak, sudah dibayar, sisa
- Breakdown per bulan
- Tabel detail per booking
- Progress bar pelunasan

---

## Struktur Folder

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...all]/      # BetterAuth handler
│   │   ├── bookings/           # CRUD bookings
│   │   │   └── [id]/
│   │   │       ├── tasks/      # Add task
│   │   │       └── payments/   # Add payment
│   │   └── tasks/[taskId]/     # Update/delete task
│   ├── dashboard/
│   │   ├── bookings/           # Halaman booking
│   │   ├── tasks/              # To Do list
│   │   ├── finance/            # Keuangan
│   │   └── settings/           # Pengaturan
│   └── login/                  # Login/register
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── BookingsClient.tsx      # List + Calendar view
│   ├── BookingDetailPanel.tsx  # Side panel detail
│   ├── BookingModal.tsx        # Form tambah booking
│   ├── TasksClient.tsx         # Kanban tasks
│   ├── FinanceClient.tsx       # Finance dashboard
│   └── DashboardClient.tsx     # Overview dashboard
├── lib/
│   ├── auth.ts                 # BetterAuth server config
│   ├── auth-client.ts          # BetterAuth client
│   ├── prisma.ts               # Prisma singleton
│   └── utils.ts                # Helper functions
└── types/
    └── index.ts                # TypeScript types

prisma/
├── schema.prisma               # Database schema
└── seed.ts                     # Data awal dari PDF
```

---

## Data Booking dari PDF

Data berikut sudah di-seed otomatis:

| Klien | Tanggal | Paket | Status |
|-------|---------|-------|--------|
| Jannah & Sahal | 5-6 Apr | 800k | ✅ Lunas |
| Wardatul & Alvin | 3-4 Apr | 1100k | DP 300k |
| Ilmi | 8-9 Apr | 900k | Pending |
| Hasni & Romadhon | 19-20 Apr | 800k | Lunas |
| Lia | 11-12 Apr | 1000k | DP 300k |
| Diah & Habib | 30 Apr | 900k | DP 200k |
| Tesi | 26 Apr | 200k | Pending |
| Aini & Ziska | 3 Jun | 650k | DP 300k |
| Aci | 14-15 Jun | 1000k | DP 200k |
| Ima | Juli | 900k | DP 500k |
