# GavelMind v2 — sesuai brief lengkap

Membangun ulang aplikasi mengikuti brief baru, tetap dengan tema gelap (#191919, font Onest, aksen oranye) dan gaya kartu glow yang sudah ada. Prinsip inti tetap: AI hanya menyiapkan bahan dan draf nilai; juri yang memutuskan, AI tidak pernah meranking atau menentukan pemenang.

## Halaman baru

```text
/app           Entries: tambah proyek, tabel, filter, kartu Analyze
/app/p/:id     Laporan proyek (bento)
/app/rubric    Editor rubrik + pratinjau langsung
/app/results   Leaderboard + Finalize + Export + Change log
```
Alamat lama (/, /rubric, /leaderboard, /changelog, /report/:id) diarahkan ke alamat baru.

## 1. Entries
- Tempel beberapa URL (satu per baris) atau "Scan showcase page": tempel satu URL halaman, muncul daftar proyek contoh dengan kotak centang dan "Add selected".
- Daftar proyek: nama, URL repo, URL video demo (opsional), status analisis, status juri (Not reviewed / In review / Finalized).
- Pilih banyak + "Analyze selected", kolom cari, filter status, tampilan kosong dengan ajakan jelas.

## 2. Kartu Analyze (interaksi utama)
- Kartu input berisi URL + tombol Analyze, ada di Entries dan di atas laporan.
- Saat dijalankan, kartu berubah jadi orb bercahaya oranye (denyut pelan, cahaya berputar, cincin progres tipis) yang berganti label: Cloning repository → Running in sandbox → Checking rules → Drafting scores, dengan satu kalimat penjelasan di bawahnya.
- Selesai: orb mengecil, kartu melebar jadi ringkasan (nama, cek lolos, total draf, "Open full report").
- Tombol Cancel selama proses, keadaan gagal dengan "Retry". Jika pengguna memilih gerak dikurangi: bilah progres + teks saja.

## 3. Laporan proyek (bento)
- Header: nama, tautan, status, status juri.
- Ringkasan: 3 kalimat netral, stack, apa yang dilakukan / tidak dilakukan.
- Cek aturan: dibuat selama event, pakai konektor wajib, ada demo, repo publik, berhasil jalan — masing-masing lolos/peringatan/gagal + alasan + tautan bukti.
- Materi terkumpul, 3 tab: Description, Repository (ringkasan README, stack, hasil run sandbox), Demo video (URL, status transkrip, transkrip bisa dilipat). Tiap item diberi label sumber.
- Draf nilai: per kriteria, tabel nilai tiap model (nama model dari data), rata-rata draf, indikator "sepakat" (selisih ≤ 1), alasan + bukti.
- Panel juri (kolom kanan di laptop): nilai akhir 0–10 + catatan opsional per kriteria, tombol "Use AI draft" dan "Clear", tersimpan otomatis. Glow mengikuti kursor hanya di laptop.
- Rincian skor: kriteria, bobot %, draf AI, nilai juri, kontribusi, total, plus rumus dalam kalimat biasa.
- Pilihan gaya tulisan ringkasan: Neutral, Concise, Detailed (menggantikan serious/sarcastic/playful). Hanya mengubah kata, tidak pernah angka.
- Pemberitahuan "AI scores are suggestions to help you decide. The final decision is yours." di setiap tempat nilai muncul.

## 4. Rubrik
- Tambah, hapus, ganti nama, atur bobot dengan slider. Total harus 100%, jika tidak muncul peringatan dan Save dimatikan.
- Pratinjau langsung perubahan total untuk proyek yang dipilih.

## 5. Hasil
- Leaderboard hanya dari total nilai akhir juri; yang belum dinilai tampil "Awaiting judge review" tanpa peringkat.
- Finalize dengan dialog konfirmasi; juri memilih pemenangnya sendiri, aplikasi hanya mencatat.
- Export CSV, JSON, Markdown dibuat di browser, berisi rubrik, nilai akhir juri, dan kalimat "AI scores are drafts; final scores are the judge's decisions."
- Change log: setiap perubahan (nilai, catatan, rubrik, finalisasi) dengan nilai lama, baru, dan waktu.

## Kualitas
Setiap daftar dan kartu punya tampilan memuat, kosong, dan gagal. Teks lugas tanpa klaim keadilan atau bebas bias.

## Technical details
- Proyek memakai TanStack Router (bukan React Router); rute baru: `app.index.tsx`, `app.p.$id.tsx`, `app.rubric.tsx`, `app.results.tsx`, redirect dari rute lama.
- `src/lib/api.ts` tetap satu-satunya sumber data, store in-memory + `useSyncExternalStore`, ditambah fungsi bertipe dan berkomentar: listProjects, addProjects, scanShowcase, analyzeProject (stage callback + AbortSignal), getReport, saveJudgeScore, getRubric, saveRubric, finalize, exportResults, getChangeLog. Model drafts `{ model, score, reason, evidence }[]` dengan nama model dari data.
- Orb dibuat dari nol dengan SVG + CSS keyframes (tanpa library pihak ketiga), `prefers-reduced-motion` → progress bar.
- Warna tetap lewat variabel di `:root` `src/styles.css`; GlowCard dipakai ulang, glow dimatikan di layar sentuh.
- Test: perbarui test judgeTotal/leaderboard, tambah test bobot harus 100% untuk Save, agreement ≤ 1 poin, dan isi export memuat kalimat wajib.
