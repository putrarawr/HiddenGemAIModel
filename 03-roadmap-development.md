# Hidden Gem AI Discovery Hub — Development Roadmap

Roadmap disusun per fase berdasarkan urutan ketergantungan teknis (bukan berdasarkan estimasi waktu — durasi tiap fase disesuaikan dengan kapasitas tim saat eksekusi).

## Phase 1 — Backend Setup & Scraping Pipeline

- [ ] Inisialisasi project Laravel 13 dengan database PostgreSQL.
- [ ] Buat migration tabel `categories`, `ai_models`, `benchmark_scores`, dan `ingestion_logs`.
- [ ] Buat service class `OpenRouterScraperService` dan `HuggingFaceScraperService`.
- [ ] Implementasi agent extractor menggunakan `prism-php` / Gemini Flash API dengan response JSON schema tervalidasi.
- [ ] Buat console command `app:sync-models` dan daftarkan ke Laravel scheduler di `routes/console.php`.
- [ ] **(baru)** Implementasi dedup/idempotency check sebelum insert model baru (cek slug/hash gabungan `author+name+quantization`).
- [ ] **(baru)** Tulis log setiap run scraper ke `ingestion_logs` (status, jumlah item, error message).
- [ ] **(baru)** Tambahkan retry/backoff policy pada pemanggilan LLM extractor (Gemini/Groq) untuk menangani rate limit.

## Phase 2 — API Layer & Logic

- [ ] Buat controller `ModelCatalogController` dengan endpoint:
  - `GET /api/v1/models` (search, pagination, filtering by category/RAM).
  - `GET /api/v1/models/{slug}` (detail spesifik & benchmark).
  - `GET /api/v1/categories` (list kategori beserta jumlah model).
- [ ] Optimasi query PostgreSQL menggunakan index pada kolom `category_id`, `parameter_size`, dan `access_type`.
- [ ] **(baru)** Tambahkan index composite `(review_status, is_verified_gem)` untuk query katalog utama.
- [ ] **(baru)** Terapkan rate limiting (throttle middleware) khusus pada endpoint yang akan dipakai playground simulator.
- [ ] **(baru)** Tambahkan caching (Redis) untuk kombinasi filter yang sering diakses.

## Phase 3 — Frontend Development (React + Tailwind CSS)

- [ ] Setup stack frontend (Inertia.js + React atau standalone React client dengan Tailwind CSS & Lucide React).
- [ ] Bangun hero section landing page: typography modern, visual badge stats, dan live search.
- [ ] Buat grid component katalog model dengan badge spesifikasi (parameter size, min RAM, tag kategori).
- [ ] Implementasi filter sidebar interaktif (slider VRAM/RAM, checkbox lisensi, toggle free API).
- [ ] Buat modal detail model dengan syntax highlighter untuk one-click code copy.
- [ ] **(baru)** Desain empty state untuk hasil filter kosong.
- [ ] **(baru)** Desain error/fallback state untuk playground saat provider down atau kena rate limit.
- [ ] **(baru)** Tampilkan badge "needs review" secara berbeda (tidak sama dengan verified gem) agar user tidak salah percaya pada data yang belum divalidasi penuh.
- [ ] **(baru)** Tampilkan indikator "last synced" di detail model.

## Phase 4 — Testing & Deployment

- [ ] Test parsing worker terhadap 50 model Hugging Face pertama.
- [ ] Validasi error handling saat format README repositori tidak standar.
- [ ] Build Dockerfile untuk backend worker & frontend client.
- [ ] Deployment dan verifikasi cron scheduling harian.
- [ ] **(baru)** Unit test untuk service scraper (mock response API OpenRouter/HuggingFace/Ollama).
- [ ] **(baru)** Test skenario dedup — pastikan model yang sama dari dua sumber berbeda tidak duplikat di katalog.
- [ ] **(baru)** Test rate limit endpoint playground (pastikan throttle bekerja, tidak menghabiskan kuota provider gratis).
- [ ] **(baru)** Setup monitoring dasar untuk job scheduler (misal notifikasi jika `app:sync-models` gagal berturut-turut).
- [ ] **(baru)** Siapkan rollback plan sederhana jika deployment baru menyebabkan data korup di `ai_models`.

## Catatan Umum *(baru ditambahkan)*

- Tidak ada estimasi waktu per task sesuai permintaan — checklist ini murni urutan dependensi teknis, silakan disesuaikan dengan kapasitas eksekusi tim/personal.
- Disarankan setiap fase ditutup dengan review singkat sebelum lanjut ke fase berikutnya, khususnya Phase 1 → Phase 2 karena skema data jadi fondasi seluruh API dan UI di fase-fase setelahnya.
