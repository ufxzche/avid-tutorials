# AVID — Roadmap v1.0 (itProger-konsepsiya)

## Maqsad

Oddiy, tez va tushunarli dasturlash o‘quv platformasi: video darslar, testlar, progress, izohlar.  
**Emas:** Udemy/Coursera/LMS, to‘lovlar, chat, gamifikatsiya, korporativ funksiyalar.

## Asosiy foydalanuvchi oqimi

1. O‘qituvchi kurs yaratadi → modul/dars → video + materiallar + test  
2. Foydalanuvchi ro‘yxatdan o‘tadi → kursga yoziladi (bepul)  
3. Darslarni ko‘radi → progress saqlanadi → test topshiradi → izoh qoldiradi  

---

## Arxitektura (qisqa)

| Qatlam | Texnologiya | Holat |
|--------|-------------|--------|
| Frontend | HTML + CSS + vanilla JS | Mos |
| API | Laravel 9 (`backend/`) | Asosiy |
| DB | SQLite + fayl yuklamalar | Mos |
| Auth | JWT (httpOnly cookie) | Mos |
| Eski | `server/` (Node/Express) | **Olib tashlangan** |

Yagona server: `php artisan serve` — statika + `/api/*` bir joyda.

---

## Konsepsiyaga mos bo‘limlar (saqlash va rivojlantirish)

- Autentifikatsiya, ro‘yxatdan o‘tish, profil  
- Katalog, qidiruv, kategoriyalar (texnologiya bo‘yicha)  
- Kurs sahifasi, modullar, darslar  
- Video, materiallar (PDF/DOCX/ZIP)  
- Izohlar (dars ostida)  
- Testlar (darsga bog‘langan)  
- Progress (% kurs bo‘yicha)  
- O‘qituvchi kabineti (kurs/dars boshqaruvi)  
- Admin (foydalanuvchilar, kurslar, blog)  
- Blog / maqolalar  

---

## Mos kelmaydigan funksiyalar (ixtiyoriy / v1.0 dan chiqarish)

Quyidagilar kodda **mavjud**, lekin itProger-konsepsiyasi uchun **shart emas**:

| Funksiya | Qayerda | Tavsiya |
|----------|---------|---------|
| XP, daraja (level) | `users`, student-dashboard, StudentController | UI dan olib tashlash; API award o‘chirish |
| Yutuqlar (achievements) | DB + dashboard | O‘chirish yoki o‘chirib qo‘yish |
| Sertifikatlar | `certificates`, dashboard | v1.0 dan tashqari |
| Sevimlilar (favorites) | course.html, API | Ixtiyoriy |
| Kurs narxi / bepul / $ | katalog, instructor form | Barcha kurslar bepul — UI yashirish |
| Murakkab instructor analitika | dashboard (soat, revenue) | Talabalar + ko‘rishlar yetarli |
| Ichki bildirishnomalar | `notifications`, dashboard | Soddalashtirish yoki yashirish |
| Kurs sharhlari + reyting | course.html, `reviews` | Izohlar darsda yetarli; sharhlar ixtiyoriy |
| `server/` Node backend | `server/` papka | Arxivlash / o‘chirish |
| To‘lov, chat, Redis, korporativ modullar | Eski reja | Bekor qilingan |

---

## Tayyorlik: ~**76%** (yangi konsepsiya bo‘yicha)

| Modul | Og‘irlik | Tayyorlik | Izoh |
|-------|----------|-----------|------|
| Auth + profil | 10% | 90% | Login, register, profil, parol tiklash (dev) |
| Katalog + qidiruv + kategoriya | 15% | 85% | Filtr, qidiruv ishlaydi; narx UI ortiqcha |
| Kurs + yozilish | 10% | 80% | Enroll, modullar, demo-dars |
| Video + materiallar | 18% | 85% | Yuklash, ko‘rish bor |
| Izohlar | 10% | 90% | Dars ostida |
| Testlar | 12% | 70% | API/UI bor; har darsda test to‘liq emas |
| Progress | 15% | 75% | % ishlaydi; XP bilan aralashgan |
| O‘qituvchi kabineti | 12% | 85% | `instructor-course-manage.html` |
| Admin | 5% | 75% | Foydalanuvchilar, kurslar, blog, izohlar |
| Blog | 5% | 70% | O‘qish bor; admin tahriri yo‘q |
| Tozalash + barqarorlik | 8% | 35% | Eski Node, konsept UI chalkashligi |

**Jami:** taxminan **76%** — asosiy oqim ishlaydi, lekin konseptsiyaga “yengillashtirish” va sirtqi funksiyalarni ajratish kerak.

---

## Roadmap → v1.0 (faqat zarur vazifalar)

### Faza A — Konseptsiyani kod bilan moslashtirish (1–2 kun)

- [ ] Student dashboard: faqat **Mening kurslarim** + progress % (XP, sertifikat, yutuqlar olib tashlangan)  
- [ ] Katalog va kurs kartalari: **narx / $ / bepul** belgilarini olib tashlash  
- [ ] Instructor forma: narx va “bepul” maydonlarini olib tashlash (backend default: bepul)  
- [ ] XP/achievement/certificate award logikasini o‘chirish (yoki feature flag)  
- [ ] `server/` papkasini o‘chirish yoki `docs/legacy-node/` ga ko‘chirish  
- [ ] README va positioning: itProger-uslubi, LMS emas  

### Faza B — Asosiy o‘quv tajribasi (2–3 kun)

- [ ] Har publikatsiya qilingan kursda kamida bitta **preview** dars + test shabloni (seed yoki qoida)  
- [ ] Progress: kurs sahifasida va kabinetda aniq % (bitta manba — `enrollments.progress_percent`)  
- [ ] Dars sahifasi: video → materiallar → test → izohlar tartibi (itProger oqimi)  
- [ ] Kursga yozilish: doim **bepul**, bitta tugma  

### Faza C — O‘qituvchi (1–2 kun)

- [ ] Kabinet statistikasi soddalashtiriladi: **talabalar**, **ko‘rishlar**, (ixtiyoriy) **o‘rtacha baho**  
- [ ] Kurs boshqaruvi: modul/dars CRUD barqarorligi, validatsiya xabarlari  
- [ ] Video/material yuklash cheklovlari va xato holatlari  

### Faza D — Admin + blog (1–2 kun)

- [ ] Admin: foydalanuvchilar (blok), kurslar ro‘yxati, aloqa xabarlari (minimal)  
- [ ] Blog: admin orqali post qo‘shish/tahrirlash (oddiy CRUD)  

### Faza E — Reliz sifati (1–2 kun)

- [ ] Mobil moslashuv (katalog, dars player, formlar)  
- [ ] Xatoliklarni bir xil ko‘rsatish (`api.js` + Laravel 422)  
- [ ] Smoke-test: ro‘yxatdan o‘tish → kurs → 3 dars → test → izoh  
- [ ] `migrate:fresh --seed` + `start.ps1` hujjatlashtirish  

---

## v1.0 dan keyin (faqat agar kerak bo‘lsa — hozir reja emas)

- Parolni email orqali tiklash (SMTP)  
- Kurs sharhlari (agar jamiyat kerak bo‘lsa)  
- Sevimlilar ro‘yxati  
- PDF sertifikat (gamifikatsiyasiz, oddiy “tugatdim” hujjati)  

## Qasddan reja qilinmagan

Stripe, Payme, obuna, savat, WebSocket chat, shaxsiy xabarlar, uy vazifasi baholash, gamifikatsiya, kod kompilyatori, mikroservislar, Redis, Docker-prod, murakkab BI, korporativ kabinetlar, marketplace.
