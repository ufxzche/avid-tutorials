<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuizController extends Controller
{
    public function show(int $lessonId)
    {
        $lesson = Lesson::find($lessonId);
        if (!$lesson) {
            return response()->json(['error' => 'Dars topilmadi'], 404);
        }

        $quiz = Quiz::with(['questions' => fn ($q) => $q->select(
            'id', 'quiz_id', 'question', 'options_json'
        )])->where('lesson_id', $lessonId)->first();

        if (!$quiz) {
            return response()->json(['error' => 'Test topilmadi'], 404);
        }

        return response()->json([
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'questions' => $quiz->questions->map(fn ($q) => [
                    'id' => $q->id,
                    'question' => $q->question,
                    'options' => $q->options_json,
                ]),
            ],
        ]);
    }

    public function submit(int $quizId, Request $request)
    {
        $data = $request->validate([
            'answers' => 'required|array',
            'answers.*.question_id' => 'required|integer',
            'answers.*.selected_index' => 'required|integer|min:0',
        ]);

        $quiz = Quiz::find($quizId);
        if (!$quiz) {
            return response()->json(['error' => 'Test topilmadi'], 404);
        }

        $lesson = Lesson::find($quiz->lesson_id);
        $enrolled = Enrollment::where('user_id', Auth::id())->where('course_id', $lesson->course_id)->exists();
        if (!$enrolled && Auth::user()->role === 'student') {
            return response()->json(['error' => 'Kursga yoziling'], 403);
        }

        $questions = QuizQuestion::where('quiz_id', $quizId)->get()->keyBy('id');
        $total = $questions->count();
        if (!$total) {
            return response()->json(['error' => 'Savollar yo\'q'], 400);
        }

        $correct = 0;
        foreach ($data['answers'] as $answer) {
            $q = $questions->get($answer['question_id']);
            if ($q && (int) $q->correct_index === (int) $answer['selected_index']) {
                $correct++;
            }
        }

        $score = (int) round(($correct / $total) * 100);
        $passed = $score >= 70;

        QuizAttempt::updateOrCreate(
            ['user_id' => Auth::id(), 'quiz_id' => $quizId],
            ['score_percent' => $score, 'passed' => $passed]
        );

        return response()->json([
            'score_percent' => $score,
            'passed' => $passed,
            'correct' => $correct,
            'total' => $total,
        ]);
    }
}
