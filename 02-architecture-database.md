# Hidden Gem AI Discovery Hub — Architecture & Database Design

## 1. Tech Stack Summary *(baru ditambahkan)*

| Layer | Teknologi |
|---|---|
| Backend framework | Laravel 13 |
| Database | PostgreSQL |
| Queue/worker | Laravel Queue + Horizon (disarankan, agar scraping job async & termonitor) |
| Cache | Redis (untuk cache hasil filter/search yang sering diakses) |
| AI extraction | Gemini Flash / Groq API via `prism-php` |
| Frontend | Inertia.js + React, Tailwind CSS, Lucide React |
| Deployment | Docker (backend worker & frontend client terpisah) |

## 2. Database Schema & Architecture Design

```
                    ┌─────────────────────────┐
                    │       categories        │
                    ├─────────────────────────┤
                    │ id (uuid, pk)           │
                    │ name (varchar)          │
                    │ slug (varchar, unique)  │
                    │ icon (varchar)          │
                    └────────────┬────────────┘
                                 │ 1:n
                                 ▼
┌─────────────────────────┐ 1:n ┌─────────────────────────┐
│     benchmark_scores    │◄────┤        ai_models        │
├─────────────────────────┤     ├─────────────────────────┤
│ id (uuid, pk)           │     │ id (uuid, pk)           │
│ model_id (uuid, fk)     │     │ name (varchar)          │
│ benchmark_name (varchar)│     │ slug (varchar, unique)  │
│ score (decimal)         │     │ author (varchar)        │
│ baseline_comparison     │     │ parameter_size (float)  │
└─────────────────────────┘     │ context_window (int)    │
                                 │ access_type (enum)      │
                                 │ hardware_specs (jsonb)  │
                                 │ pros_cons (jsonb)       │
                                 │ run_commands (jsonb)    │
                                 │ category_id (uuid, fk)  │
                                 │ is_verified_gem (bool)  │
                                 │ review_status (enum)    │◄── baru
                                 │ last_synced_at (ts)     │◄── baru
                                 │ source (varchar)        │◄── baru
                                 └────────────┬────────────┘
                                              │ 1:n
                                              ▼
                                 ┌─────────────────────────┐
                                 │     ingestion_logs      │◄── baru ditambahkan
                                 ├─────────────────────────┤
                                 │ id (uuid, pk)           │
                                 │ model_id (uuid, fk, null)│
                                 │ source (varchar)        │
                                 │ status (enum)           │
                                 │ items_processed (int)   │
                                 │ error_message (text)    │
                                 │ started_at (ts)         │
                                 │ finished_at (ts)        │
                                 └─────────────────────────┘
```

### 2.1 Catatan Tambahan Skema *(baru ditambahkan)*

Tabel `ai_models` disebutkan di roadmap Phase 1 (`buat migration tabel categories, ai_models, benchmark_scores, dan ingestion_logs`), tapi tabel `ingestion_logs` belum ada di ERD asli — sudah ditambahkan di atas beserta kolom pendukung berikut pada `ai_models`:

- `review_status` (enum: `pending`, `needs_review`, `published`) — untuk menampung hasil validasi extractor agent (lihat requirement 2.2 di file requirements).
- `last_synced_at` — timestamp sync terakhir, dipakai untuk indikator "data freshness" di UI.
- `source` — sumber data asal (`openrouter`, `huggingface`, `ollama`) agar bisa dilacak balik ke origin saat dedup atau debugging.

### 2.2 Indexing Strategy *(baru ditambahkan)*

- Index pada `category_id`, `parameter_size`, `access_type` (sudah disebut di roadmap).
- Tambahan index composite pada `(review_status, is_verified_gem)` — karena query utama katalog kemungkinan besar selalu memfilter model yang sudah `published` dan/atau `is_verified_gem = true`.
- Index pada `ingestion_logs.status` untuk mempercepat query monitoring job yang gagal.

## 3. Design Token & UI Theme (Obsidian Minimalist)

- **Backgrounds**: `#09090b` (base slate), `#121215` (card surface), `#18181b` (hover border).
- **Accents**: `#6366f1` (indigo primary), `#10b981` (emerald green for verified gem tag), `#06b6d4` (cyan for API status).
- **Typography**: JetBrains Mono untuk technical specs/code blocks, Inter atau Geist Sans untuk copy dashboard.

### 3.1 Status Color Mapping *(baru ditambahkan)*

Karena ada `review_status` baru, perlu token warna tambahan agar konsisten di UI:

- `pending` → abu-abu netral (`#71717a`)
- `needs_review` → amber warning (`#f59e0b`)
- `published` / `is_verified_gem` → tetap emerald `#10b981`

## 4. API Design Notes *(baru ditambahkan)*

- **Authentication**: endpoint publik (`GET /api/v1/models`, `/categories`) bersifat read-only tanpa auth; endpoint playground perlu rate limiting per IP/session karena memakai kuota API provider gratis.
- **Rate limiting**: gunakan Laravel throttle middleware, terutama untuk endpoint playground simulator agar tidak menghabiskan kuota free-tier provider.
- **Caching**: hasil `GET /api/v1/models` dengan kombinasi filter yang sering diakses bisa di-cache singkat (Redis) untuk mengurangi beban query Postgres saat traffic naik.
- **Versioning**: prefix `/api/v1/` sudah tepat — pastikan konsisten dipakai di semua endpoint baru ke depannya.
