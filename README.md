# AVID — Dasturlash o‘quv platformasi

Video kurslar, testlar, progress va blog — **itProger** uslubidagi oddiy o‘quv sayti (Laravel + statik frontend).

## Rollar

| Rol | Login | Parol |
|-----|-------|-------|
| Talaba | `demo@avid.uz` | `Demo1234!` |
| O‘qituvchi | `instructor@avid.uz` | `Instructor1234!` |
| Admin | `admin@avid.uz` | `Admin1234!` |

## Talablar

- PHP 8.2+
- Composer

## Ishga tushirish

```powershell
.\start.ps1
```

Yoki qo‘lda:

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve --host=127.0.0.1 --port=3000
```

Brauzer: http://127.0.0.1:3000

## Loyiha tuzilmasi

```
├── backend/              Laravel 9 — API, auth, SQLite
│   ├── app/              Controllers, models, services
│   ├── database/         Migratsiyalar, seeder, avid.db (lokal)
│   └── routes/           api.php, web.php (statika)
├── css/                  Stillar
├── js/                   Sahifa skriptlari, api.js
├── img/                  Rasmlar
├── uploads/              Video, avatar, materiallar (lokal)
├── docs/                 Arxitektura va roadmap
├── *.html                Sahifalar (katalog, dars, kabinetlar)
├── package.json          npm start → artisan serve
└── start.ps1             Windows: bir tugma bilan ishga tushirish
```

## Asosiy sahifalar

| Sahifa | Vazifa |
|--------|--------|
| `index.html` | Bosh sahifa, katalog |
| `course.html` | Kurs va darslar |
| `lesson.html` | Video, test, izoh |
| `blog.html` | Maqolalar (o‘qish hammaga) |
| `student-dashboard.html` | Talaba kabineti |
| `instructor-dashboard.html` | O‘qituvchi |
| `instructor-course-manage.html` | Kurs tahriri |
| `admin-dashboard.html` | Admin: foydalanuvchilar, kurslar, **blog**, izohlar |

## API (qisqa)

- `GET /api/catalog` — katalog
- `POST /api/auth/login` | `register`
- `POST /api/student/enroll/:id` — kursga yozilish
- `GET /api/student/lesson/:id` — dars
- `GET/POST /api/instructor/...` — kurs boshqaruvi
- `GET/POST/PUT/DELETE /api/admin/blog` — blog (faqat admin)

Batafsil: `docs/ARCHITECTURE.md`, reja: `docs/ROADMAP.md`.
