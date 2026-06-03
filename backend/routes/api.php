<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\InstructorController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\StudentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['throttle:auth'])->prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::prefix('auth')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::middleware('jwt.required')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/password', [AuthController::class, 'updatePassword']);
        Route::post('/avatar', [AuthController::class, 'uploadAvatar']);
    });
});

Route::middleware('jwt.optional')->group(function () {
    Route::get('/catalog/stats', [CatalogController::class, 'stats']);
    Route::get('/catalog/categories', [CatalogController::class, 'categories']);
    Route::get('/catalog', [CatalogController::class, 'index']);
    Route::get('/catalog/{slug}', [CatalogController::class, 'show']);
    Route::get('/courses', [CatalogController::class, 'index']);
    Route::get('/courses/{slug}', [CatalogController::class, 'show']);
});

Route::middleware(['jwt.required', 'role:student,instructor,admin'])->prefix('student')->group(function () {
    Route::post('/enroll/{courseId}', [StudentController::class, 'enroll']);
    Route::get('/enrollments', [StudentController::class, 'enrollments']);
    Route::post('/favorites/{courseId}', fn ($courseId) => app(StudentController::class)->toggleFavorite($courseId, 'add'));
    Route::delete('/favorites/{courseId}', fn ($courseId) => app(StudentController::class)->toggleFavorite($courseId, 'remove'));
    Route::post('/reviews/{courseId}', [StudentController::class, 'postReview']);
    Route::get('/lesson/{lessonId}', [StudentController::class, 'lesson']);
    Route::post('/lesson/{lessonId}/progress', [StudentController::class, 'saveProgress']);
    Route::post('/lesson/{lessonId}/comments', [StudentController::class, 'postComment']);
    Route::get('/notifications', [StudentController::class, 'notifications']);
    Route::post('/notifications/{id}/read', [StudentController::class, 'markNotificationRead']);
    Route::get('/certificates', [StudentController::class, 'certificates']);
    Route::get('/dashboard', [StudentController::class, 'dashboard']);
    Route::get('/quiz/lesson/{lessonId}', [QuizController::class, 'show']);
    Route::post('/quiz/{quizId}/submit', [QuizController::class, 'submit']);
});

Route::middleware(['jwt.required', 'role:instructor,admin'])->prefix('instructor')->group(function () {
    Route::get('/dashboard', [InstructorController::class, 'dashboard']);
    Route::get('/courses', [InstructorController::class, 'courses']);
    Route::post('/courses', [InstructorController::class, 'createCourse']);
    Route::get('/courses/{id}', [InstructorController::class, 'showCourse']);
    Route::get('/courses/{id}/stats', [InstructorController::class, 'courseStats']);
    Route::put('/courses/{id}', [InstructorController::class, 'updateCourse']);
    Route::delete('/courses/{id}', [InstructorController::class, 'deleteCourse']);
    Route::post('/courses/{id}/modules', [InstructorController::class, 'addModule']);
    Route::put('/modules/{id}', [InstructorController::class, 'updateModule']);
    Route::delete('/modules/{id}', [InstructorController::class, 'deleteModule']);
    Route::post('/courses/{id}/lessons', [InstructorController::class, 'addLesson']);
    Route::put('/lessons/{id}', [InstructorController::class, 'updateLesson']);
    Route::delete('/lessons/{id}', [InstructorController::class, 'deleteLesson']);
    Route::post('/lessons/{id}/video', [InstructorController::class, 'uploadVideo']);
    Route::post('/lessons/{id}/materials', [InstructorController::class, 'uploadMaterial']);
    Route::delete('/materials/{id}', [InstructorController::class, 'deleteMaterial']);
    Route::get('/lessons/{id}/quiz', [InstructorController::class, 'getQuiz']);
    Route::post('/lessons/{id}/quiz', [InstructorController::class, 'saveQuiz']);
});

Route::middleware(['jwt.required', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard']);
    Route::get('/users', [AdminController::class, 'users']);
    Route::patch('/users/{id}/block', [AdminController::class, 'blockUser']);
    Route::get('/courses', [AdminController::class, 'courses']);
    Route::patch('/courses/{id}/status', [AdminController::class, 'updateCourseStatus']);
    Route::delete('/courses/{id}', [AdminController::class, 'deleteCourse']);
    Route::get('/comments', [AdminController::class, 'comments']);
    Route::delete('/comments/{id}', [AdminController::class, 'deleteComment']);
    Route::get('/contact-messages', [AdminController::class, 'contactMessages']);
    Route::get('/blog', [AdminController::class, 'blogPosts']);
    Route::get('/blog/{id}', [AdminController::class, 'blogPost']);
    Route::post('/blog', [AdminController::class, 'storeBlogPost']);
    Route::put('/blog/{id}', [AdminController::class, 'updateBlogPost']);
    Route::delete('/blog/{id}', [AdminController::class, 'deleteBlogPost']);
});

Route::prefix('blog')->group(function () {
    Route::get('/', [BlogController::class, 'index']);
    Route::get('/{slug}', [BlogController::class, 'show']);
});

Route::middleware(['throttle:30,15', 'jwt.optional'])->post('/contact', [ContactController::class, 'store']);
