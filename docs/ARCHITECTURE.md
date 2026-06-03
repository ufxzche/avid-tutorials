# AVID — Arxitektura (itProger-konsepsiya)

## Prinsip

Bitta monolitik veb-ilova: statik frontend + Laravel API. Oddiylik va tezlik ustuvor.

```
[Foydalanuvchi brauzeri]
        │
        ▼
[Laravel :3000]
   ├── routes/web.php      → HTML/CSS/JS (loyiha ildizi)
   ├── routes/api.php      → JSON API (/api/*)
   ├── uploads/            → video, materiallar, avatarlar
   └── database/avid.db    → SQLite
```

## Rollar

| Rol | Vazifa |
|-----|--------|
| Mehmon | Katalog, blog, kurs tavsifi (demo-dars) |
| Talaba | Yozilish, dars, test, progress, izoh |
| O‘qituvchi | Kurs/modul/dars, video, material, test |
| Admin | Foydalanuvchilar, moderatsiya, blog |

## Asosiy jadvallar (o‘quv zanjiri)

`users` → `courses` → `modules` → `lessons` → (`lesson_materials`, `quizzes`)  
`enrollments` + `lesson_progress` — progress  
`lesson_comments` — izohlar  

## Ixtiyoriy jadvallar (v1.0 da ishlatilmaydi)

`achievements`, `user_achievements`, `certificates`, `favorites`, `notifications` — tarixiy/LMS izlari; yangi UI da talab qilinmaydi.

## Frontend sahifalar

| Sahifa | Maqsad |
|--------|--------|
| index.html | Katalog + qidiruv |
| course.html | Kurs + darslar ro‘yxati |
| lesson.html | Video + material + test + izoh |
| student-dashboard.html | Progress (soddalashtiriladi) |
| instructor-dashboard.html | Kurslar ro‘yxati |
| instructor-course-manage.html | Kurs tahriri |
| login/register/profile | Auth |
| blog.html, blog-post.html | Maqolalar |
| admin-dashboard.html | Admin (foydalanuvchilar, kurslar, blog, izohlar) |

## API guruhlari

- `/api/auth/*` — JWT cookie  
- `/api/catalog/*` — ochiq katalog  
- `/api/student/*` — dars, progress, test, izoh  
- `/api/instructor/*` — CRUD kurs kontenti  
- `/api/admin/*` — boshqaruv  
- `/api/blog/*` — maqolalar  
