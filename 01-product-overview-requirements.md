# Hidden Gem AI Discovery Hub — Product Overview & Requirements

Platform agregator dan kurasi model AI gratis / open-weights tersembunyi (hidden gem) yang memanfaatkan pipeline Laravel worker dan LLM extractor untuk mengkategorikan spesialisasi model (coding, riset, vision, low-spec).

---

## 1. Product Overview & Goals

### 1.1 Problem Statement

- Developer dan antusias AI kesulitan menemukan model AI open-source/free-tier berkualitas tinggi karena dominasi nama-nama besar di pasar.
- Banyak model berukuran kecil (≤8B) yang memiliki performa setara model raksasa, namun informasinya tersebar di leaderboard mentah atau repositori Hugging Face yang sulit dipahami secara instan.
- Minimnya kurasi berbasis spesifikasi hardware (RAM/VRAM) dan implementasi siap pakai (one-click config).

### 1.2 Core Value Proposition

- **Automated hidden gem discovery** — kurasi otomatis model gratis dan underrated dengan formula performa per parameter.
- **Hardware-first filtering** — pencarian berdasarkan kapasitas spesifikasi laptop (RAM 8GB, CPU-only, VRAM 4GB–8GB).
- **Zero-friction setup** — snippet instan untuk Ollama, Python SDK, dan cURL API yang siap disalin.

### 1.3 Target Users / Persona *(baru ditambahkan)*

| Persona | Kebutuhan Utama | Pain Point |
|---|---|---|
| Hobbyist/Self-host enthusiast | Model ringan yang jalan di laptop pribadi | Bingung memilih quantization/model yang cocok dengan RAM terbatas |
| Indie developer | Model gratis untuk prototyping fitur AI | Malas baca dokumentasi teknis panjang, butuh snippet langsung pakai |
| Researcher/student | Model open-weights untuk eksperimen tanpa biaya | Leaderboard resmi (LMSYS, HF) terlalu ramai & tidak difilter by use-case |

### 1.4 Success Metrics / KPI *(baru ditambahkan)*

- Jumlah model unik terindeks & terverifikasi sebagai "gem" per minggu.
- Rasio klik "copy config" per kunjungan detail model (proxy untuk utilitas nyata).
- Tingkat keberhasilan sync job (persentase run scraper tanpa error dari total scheduled run).
- Retention pengguna yang kembali menggunakan filter/playground (jika analytics tersedia).

### 1.5 Out of Scope *(baru ditambahkan)*

- Tidak menyediakan hosting/inference model sendiri — hanya agregasi & link ke provider/repo asli.
- Tidak menangani model berbayar penuh (paid-only) di luar free-tier/open-weights.
- Tidak menyediakan fine-tuning atau training pipeline untuk pengguna.

---

## 2. Functional Requirements

### 2.1 Scraping & Ingestion Engine

- Fetch metadata berkala dari OpenRouter API (`pricing.prompt == 0`), Hugging Face Hub API, dan library model Ollama.
- Filter awal: parameter size ≤14B, status lisensi permissif (Apache-2.0, MIT, OpenRAIL), dan ambang batas rasio rating/download.
- **Idempotency & dedup** *(baru ditambahkan)*: mekanisme untuk mencegah duplikasi entri saat model yang sama muncul di lebih dari satu sumber (misal nama sama tapi provider berbeda), menggunakan slug/hash gabungan `author+name+quantization`.
- **Ingestion logging** *(baru ditambahkan)*: setiap run scraper mencatat status (success/partial/failed), jumlah item diproses, dan error detail ke tabel `ingestion_logs` untuk observability.

### 2.2 AI Processing & Extraction Agent

- Ekstraksi otomatis dari `README.md` repositori menggunakan Gemini Flash / Groq API.
- Parsing output terstruktur (JSON format):
  - Primary use-case (coding, research/reasoning, vision, document analysis, ultra-low-spec).
  - 3 poin keunggulan utama dan 1 limitasi teknis.
  - Rekomendasi hardware (minimum RAM, kuantisasi ideal Q4_K_M, kebutuhan VRAM).
  - One-click execution command (`ollama run ...` atau format API endpoint).
- **Validasi & fallback** *(baru ditambahkan)*: jika README tidak standar atau ekstraksi gagal validasi schema, model masuk status `needs_review` alih-alih otomatis dipublikasikan sebagai gem.
- **Rate limit & retry** *(baru ditambahkan)*: extractor agent perlu backoff/retry policy terhadap rate limit LLM provider (Gemini/Groq) agar job scraping harian tidak gagal total karena satu request bermasalah.

### 2.3 Catalog & Discovery UI

- Landing page: hero section dengan estetika obsidian/dark minimalist, metrik real-time model terindeks, dan search bar interaktif.
- Smart filtering: filter multi-kategori, slider kebutuhan RAM/VRAM, dan tipe akses (open-weights/GGUF vs free cloud API).
- Model detail modal/inspector: ringkasan benchmark, pros/cons, copy config tab (Ollama, Python, .env), dan direct link repo.
- Lightweight playground simulator: testing prompt sederhana menggunakan endpoint free provider.
- **Empty & error state UI** *(baru ditambahkan)*: desain state saat hasil filter kosong, saat playground provider down, dan saat data model belum lengkap (masih `needs_review`).

## 3. Non-Functional Requirements *(baru ditambahkan)*

- **Performance**: endpoint listing model (`GET /api/v1/models`) harus tetap responsif meski filter kombinasi kompleks (kategori + RAM range + access type sekaligus).
- **Security**: playground simulator tidak boleh mengekspos API key provider ke client — semua request diproksi lewat backend.
- **Scalability**: pipeline scraping dirancang agar mudah menambah sumber baru (misal Replicate, Modal) tanpa mengubah struktur inti `ai_models`.
- **Data freshness**: ada indikator "last synced" per model agar pengguna tahu seberapa update data yang ditampilkan.
- **Abuse prevention**: rate limiting pada endpoint playground publik untuk mencegah penyalahgunaan kuota API provider gratis.
