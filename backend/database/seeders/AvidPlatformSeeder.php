<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\BlogPost;
use App\Models\Category;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Module;
use App\Models\Quiz;
use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\PlatformService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AvidPlatformSeeder extends Seeder
{
    public function run(): void
    {
        $langs = [
            ['python', 'Python'], ['java', 'Java'], ['javascript', 'JavaScript'],
            ['typescript', 'TypeScript'], ['c', 'C'], ['cpp', 'C++'], ['csharp', 'C#'],
            ['go', 'Go'], ['rust', 'Rust'], ['php', 'PHP'], ['kotlin', 'Kotlin'],
            ['swift', 'Swift'], ['sql', 'SQL'], ['devops', 'DevOps'], ['linux', 'Linux'],
            ['data-science', 'Data Science'], ['machine-learning', 'Machine Learning'],
            ['cybersecurity', 'Cybersecurity'], ['web-development', 'Web Development'],
            ['mobile-development', 'Mobile Development'],
        ];

        foreach ($langs as [$slug, $name]) {
            Category::create(['slug' => $slug, 'name' => $name]);
        }

        User::create([
            'email' => 'admin@avid.uz',
            'password_hash' => Hash::make('Admin1234!'),
            'name' => 'Platform Admin',
            'role' => 'admin',
            'bio' => 'AVID administrator',
        ]);

        $instructor = User::create([
            'email' => 'instructor@avid.uz',
            'password_hash' => Hash::make('Instructor1234!'),
            'name' => 'Aziz Juraev',
            'role' => 'instructor',
            'bio' => 'Dasturlash bo\'yicha o\'qituvchi. Python, JavaScript, C++ va boshqa tillarni amaliy loyihalar orqali o\'rgataman.',
        ]);

        User::create([
            'email' => 'demo@avid.uz',
            'password_hash' => Hash::make('Demo1234!'),
            'name' => 'Demo Talaba',
            'role' => 'student',
        ]);

        $demoVideo = config('avid.demo_video');
        $icons = [
            'python' => 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
            'javascript' => 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
            'cpp' => 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
            'java' => 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
            'csharp' => 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
            'php' => 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
            'sql' => 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
        ];

        $flagship = [
            [
                'python-noldan',
                'Python noldan',
                'python',
                'Python dasturlash tilini noldan o\'rganing: sintaksis, mantiq va amaliy misollar.',
                'beginner',
                'Python asoslari',
                [
                    'Kirish va muhit sozlash',
                    'O\'zgaruvchilar va ma\'lumot turlari',
                    'Shartlar: if, elif, else',
                    'Tsikllar: for va while',
                    'Funksiyalar',
                    'Ro\'yxatlar (list)',
                    'Lug\'atlar (dict)',
                ],
            ],
            [
                'javascript-asoslari',
                'JavaScript — boshlang\'ich',
                'javascript',
                'Veb dasturlash uchun JavaScript: DOM, hodisalar va server bilan aloqa.',
                'beginner',
                'JavaScript asoslari',
                [
                    'JavaScript sintaksisi',
                    'DOM bilan ishlash',
                    'Hodisalar (events)',
                    'Fetch API',
                    'Asinxronlik: Promise va async/await',
                ],
            ],
            [
                'cpp-asoslari',
                'C++ asoslari',
                'cpp',
                'C++ tilida dasturlash: tezlik, xotira va obyektga yo\'naltirilgan yondashuv.',
                'beginner',
                'C++ dasturlash',
                [
                    'O\'zgaruvchilar va tiplar',
                    'Shartlar va operatorlar',
                    'Tsikllar',
                    'Funksiyalar',
                    'Klasslar va obyektlar',
                ],
            ],
            [
                'java-asoslari',
                'Java — boshlang\'ich',
                'java',
                'Java bilan platformaga bog\'liq bo\'lmagan dasturlash va OOP asoslari.',
                'beginner',
                'Java dasturlash',
                [
                    'JDK va birinchi dastur',
                    'O\'zgaruvchilar va tiplar',
                    'Shartlar va tsikllar',
                    'Metodlar',
                    'Klasslar va obyektlar',
                ],
            ],
            [
                'csharp-asoslari',
                'C# asoslari',
                'csharp',
                'Microsoft ekotizimida C#: sintaksis, .NET va obyektga yo\'naltirilgan dasturlash.',
                'beginner',
                'C# dasturlash',
                [
                    'C# kirish',
                    'O\'zgaruvchilar',
                    'Shartlar va tsikllar',
                    'Metodlar',
                    'Klasslar',
                ],
            ],
            [
                'php-asoslari',
                'PHP — veb dasturlash',
                'php',
                'Server tomoni dasturlash: PHP sintaksisi, formalarni qayta ishlash va MySQL.',
                'beginner',
                'PHP asoslari',
                [
                    'PHP kirish',
                    'O\'zgaruvchilar va massivlar',
                    'Shartlar va tsikllar',
                    'Funksiyalar',
                    'MySQL bilan ishlash',
                ],
            ],
            [
                'sql-asoslari',
                'SQL va ma\'lumotlar bazasi',
                'sql',
                'Ma\'lumotlarni saqlash va so\'rovlar: SELECT, JOIN, indekslar va dizayn.',
                'beginner',
                'SQL asoslari',
                [
                    'Ma\'lumotlar bazasi nima?',
                    'SELECT va WHERE',
                    'JOIN so\'rovlari',
                    'INSERT, UPDATE, DELETE',
                    'Indekslar va normalizatsiya',
                ],
            ],
        ];

        $previewLessonIds = [];
        $platform = app(PlatformService::class);

        foreach ($flagship as [$slug, $title, $lang, $desc, $level, $moduleTitle, $lessonTitles]) {
            $cat = Category::where('slug', $lang)->first();
            $course = Course::create([
                'slug' => $slug,
                'title' => $title,
                'description' => $desc,
                'programming_language' => $lang,
                'level' => $level,
                'is_free' => true,
                'price' => 0,
                'instructor_id' => $instructor->id,
                'category_id' => $cat?->id,
                'thumbnail_url' => './img/bg.jpg',
                'icon_url' => $icons[$lang] ?? './img/lessons.png',
                'status' => 'published',
                'duration_minutes' => 0,
                'lesson_count' => 0,
                'enrollment_count' => random_int(120, 420),
                'rating_avg' => 4.7,
                'rating_count' => random_int(8, 40),
                'published_at' => now()->subDays(random_int(1, 60)),
            ]);

            $module = Module::create([
                'course_id' => $course->id,
                'title' => $moduleTitle,
                'sort_order' => 1,
            ]);

            foreach ($lessonTitles as $i => $lessonTitle) {
                $sort = $i + 1;
                $lesson = Lesson::create([
                    'course_id' => $course->id,
                    'module_id' => $module->id,
                    'title' => $lessonTitle,
                    'description' => "{$lessonTitle} — amaliy video dars va qisqa tushuntirish.",
                    'video_url' => $demoVideo,
                    'duration_seconds' => 480 + $sort * 90,
                    'sort_order' => $sort,
                    'is_preview' => $sort === 1,
                ]);
                if ($sort === 1) {
                    $previewLessonIds[] = ['id' => $lesson->id, 'title' => $lessonTitle];
                }
            }

            $platform->updateCourseStats($course->id);
        }

        foreach ($previewLessonIds as $preview) {
            $quiz = Quiz::create([
                'lesson_id' => $preview['id'],
                'title' => $preview['title'] . ' — test',
            ]);
            QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question' => 'Video darsni to\'liq ko\'rish progress uchun muhimmi?',
                'options_json' => ['Ha, progress shunday hisoblanadi', 'Yo\'q, faqat test yetarli', 'Faqat admin ko\'radi', 'Hech qachon saqlanmaydi'],
                'correct_index' => 0,
            ]);
            QuizQuestion::create([
                'quiz_id' => $quiz->id,
                'question' => 'Keyingi darsga o\'tish uchun nima qilish kerak?',
                'options_json' => ['Oldingi mavzularni o\'rganish', 'To\'lov qilish', 'Sharh yozish', 'Hech narsa'],
                'correct_index' => 0,
            ]);
        }

        foreach (
            [
                ['first-course', 'Birinchi kurs', 'Birinchi kursga yozildingiz', '🎓'],
                ['first-lesson', 'Birinchi dars', 'Birinchi videoni tamomladingiz', '▶️'],
                ['reviewer', 'Sharhchi', 'Kursga sharh qoldirdingiz', '⭐'],
            ] as $a
        ) {
            Achievement::create([
                'slug' => $a[0],
                'title' => $a[1],
                'description' => $a[2],
                'icon' => $a[3],
            ]);
        }

        $blogs = [
            [
                'python-yoki-javascript-2026',
                '2026 da nima tanlash: Python yoki JavaScript?',
                'Ikki mashhur tilni solishtiramiz — kimga qaysi biri mos.',
                "Python — ma'lumotlar tahlili, sun'iy intellekt va skriptlar uchun qulay.\n\nJavaScript — brauzer va veb-ilovalar uchun asosiy til. Agar veb-sayt yoki SPA qilmoqchi bo'lsangiz, JavaScriptdan boshlang. Agar universal til va aniq sintaksis kerak bo'lsa — Python.\n\nIkkalasini ham o'rganish mumkin: avval bittasini chuqur, keyin ikkinchisini qo'shing.",
                './img/20945802.jpg',
            ],
            [
                'backend-dasturchi-bolish',
                'Backend dasturchi bo\'lish yo\'li',
                'Qadam-baqadam reja: tillar, bazalar va amaliy loyihalar.',
                "1. Bitta tilni tanlang (Python, Java yoki PHP).\n2. SQL va REST API o'rganing.\n3. Git va Linux asoslarini bilib oling.\n4. Kichik loyiha: blog API yoki ro'yxatdan o'tish.\n5. Portfolioda 2–3 loyiha ko'rsating.\n\nAVID kurslarida video darslar va testlar shu yo'lni qisqartiradi.",
                './img/bg.jpg',
            ],
            [
                'boshlanuvchi-ide',
                'Boshlanuvchilar uchun eng yaxshi IDE',
                'VS Code, PyCharm va boshqa muhitlar — qisqa taqqoslash.',
                "VS Code — bepul, yengil, ko'p til uchun.\nPyCharm — Python uchun kuchli, Community bepul.\nIntelliJ IDEA — Java uchun standart.\n\nBoshlang'ich uchun VS Code + kerakli extension yetarli. Kurs videolarida har bir til uchun sozlash ko'rsatiladi.",
                './img/lessons.png',
            ],
        ];

        foreach ($blogs as $i => [$slug, $title, $excerpt, $content, $image]) {
            BlogPost::create([
                'slug' => $slug,
                'title' => $title,
                'excerpt' => $excerpt,
                'content' => $content,
                'image_url' => $image,
                'published_at' => now()->subDays(5 - $i),
            ]);
        }

        BlogPost::create([
            'slug' => 'platform-launch',
            'title' => 'AVID — yangi dasturlash maktabi',
            'excerpt' => 'Video kurslar, testlar va progress kuzatuvi bir joyda.',
            'content' => "AVID endi to'liq o'quv platformasi: Python, JavaScript, C++, Java va boshqa yo'nalishlar.\n\nRo'yxatdan o'ting, kurs tanlang va darslarni o'z sur'atingizda o'ting.",
            'image_url' => './img/20945802.jpg',
            'published_at' => now()->subDays(14),
        ]);

        foreach (['avatars', 'videos', 'thumbnails', 'materials'] as $dir) {
            $path = config('avid.uploads_path') . DIRECTORY_SEPARATOR . $dir;
            if (!is_dir($path)) {
                mkdir($path, 0755, true);
            }
        }
    }
}
