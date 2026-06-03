<?php

use App\Http\Controllers\ComposeController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ImageController;
use App\Http\Controllers\SeController;
use App\Http\Controllers\ListeningController;
use App\Http\Controllers\MockController;
use App\Http\Controllers\ReadingController;
use App\Http\Controllers\SpeakingController;
use App\Http\Controllers\VocabularyReviewController;
use App\Http\Controllers\DrillController;
use App\Http\Controllers\GlossaryController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RewriteController;
use App\Http\Controllers\SubmissionController;
use App\Http\Controllers\VocabularyController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('/', HomeController::class)->name('home');

    Route::get('/compose', [ComposeController::class, 'show'])->name('compose.show');
    Route::post('/compose', [ComposeController::class, 'store'])->name('compose.store');
    Route::post('/compose/draft', [ComposeController::class, 'saveDraft'])->name('compose.draft');
    Route::post('/compose/sample', [ComposeController::class, 'sample'])->name('compose.sample');

    Route::get('/submissions', [SubmissionController::class, 'index'])->name('submissions.index');
    Route::get('/submissions/{id}', [SubmissionController::class, 'show'])
        ->whereNumber('id')->name('submissions.show');
    Route::get('/submissions/{id}/status', [SubmissionController::class, 'status'])
        ->whereNumber('id')->name('submissions.status');
    Route::post('/submissions/{id}/coach', [SubmissionController::class, 'coach'])
        ->whereNumber('id')->name('submissions.coach');

    Route::get('/reading', [ReadingController::class, 'index'])->name('reading.index');
    Route::get('/reading/sessions/{session}', [ReadingController::class, 'session'])->whereNumber('session')->name('reading.sessions.show');
    Route::get('/reading/{passage}', [ReadingController::class, 'show'])->whereNumber('passage')->name('reading.show');
    Route::post('/reading/{passage}/sample', [ReadingController::class, 'sample'])->whereNumber('passage')->name('reading.sample');
    Route::post('/reading/{passage}', [ReadingController::class, 'store'])->whereNumber('passage')->name('reading.store');

    Route::get('/speaking', [SpeakingController::class, 'index'])->name('speaking.index');
    Route::post('/speaking/sessions/{session}/followup', [SpeakingController::class, 'followup'])->whereNumber('session')->name('speaking.sessions.followup');
    Route::get('/speaking/sessions/{session}/audio', [SpeakingController::class, 'audio'])->whereNumber('session')->name('speaking.sessions.audio');
    Route::get('/speaking/sessions/{session}', [SpeakingController::class, 'session'])->whereNumber('session')->name('speaking.sessions.show');
    Route::get('/speaking/{prompt}', [SpeakingController::class, 'show'])->whereNumber('prompt')->name('speaking.show');
    Route::post('/speaking/{prompt}/sample', [SpeakingController::class, 'sample'])->whereNumber('prompt')->name('speaking.sample');
    Route::post('/speaking/{prompt}/vocab-suggest', [SpeakingController::class, 'vocabSuggest'])->whereNumber('prompt')->name('speaking.vocab-suggest');
    Route::post('/speaking/{prompt}', [SpeakingController::class, 'store'])->whereNumber('prompt')->name('speaking.store');

    Route::get('/images', [ImageController::class, 'index'])->name('images.index');
    Route::get('/images/sessions/{session}/audio', [ImageController::class, 'audio'])->whereNumber('session')->name('images.sessions.audio');
    Route::get('/images/sessions/{session}', [ImageController::class, 'session'])->whereNumber('session')->name('images.sessions.show');
    Route::get('/images/{prompt}/image', [ImageController::class, 'image'])->whereNumber('prompt')->name('images.image');
    Route::get('/images/{prompt}', [ImageController::class, 'show'])->whereNumber('prompt')->name('images.show');
    Route::post('/images/{prompt}/writing', [ImageController::class, 'storeWriting'])->whereNumber('prompt')->name('images.store-writing');
    Route::post('/images/{prompt}/speaking', [ImageController::class, 'storeSpeaking'])->whereNumber('prompt')->name('images.store-speaking');

    Route::get('/listening', [ListeningController::class, 'index'])->name('listening.index');
    Route::get('/listening/sessions/{session}', [ListeningController::class, 'session'])->whereNumber('session')->name('listening.sessions.show');
    Route::get('/listening/{passage}', [ListeningController::class, 'show'])->whereNumber('passage')->name('listening.show');
    Route::get('/listening/{passage}/audio', [ListeningController::class, 'audio'])->whereNumber('passage')->name('listening.audio');
    Route::post('/listening/{passage}/sample', [ListeningController::class, 'sample'])->whereNumber('passage')->name('listening.sample');
    Route::post('/listening/{passage}', [ListeningController::class, 'store'])->whereNumber('passage')->name('listening.store');

    Route::get('/vocabulary/review', [VocabularyReviewController::class, 'index'])->name('vocabulary.review');
    Route::post('/vocabulary/review/{entry}', [VocabularyReviewController::class, 'answer'])->whereNumber('entry')->name('vocabulary.review.answer');

    Route::get('/mock', [MockController::class, 'index'])->name('mock.index');
    Route::post('/mock', [MockController::class, 'create'])->name('mock.create');
    Route::get('/mock/{session}', [MockController::class, 'show'])->whereNumber('session')->name('mock.show');

    Route::get('/profile', ProfileController::class)->name('profile');

    Route::get('/drill', [DrillController::class, 'index'])->name('drill.index');
    Route::get('/drill/summary', [DrillController::class, 'summary'])->name('drill.summary');
    Route::post('/drill/{card}/answer', [DrillController::class, 'answer'])->name('drill.answer');

    Route::get('/vocabulary', [VocabularyController::class, 'index'])->name('vocabulary.index');
    Route::post('/vocabulary/suggest', [VocabularyController::class, 'suggest'])->name('vocabulary.suggest');
    Route::post('/vocabulary', [VocabularyController::class, 'store'])->name('vocabulary.store');
    Route::put('/vocabulary/{entry}', [VocabularyController::class, 'update'])->whereNumber('entry')->name('vocabulary.update');
    Route::delete('/vocabulary/{entry}', [VocabularyController::class, 'destroy'])->name('vocabulary.destroy');

    Route::get('/glossary', GlossaryController::class)->name('glossary');

    Route::get('/software', [SeController::class, 'index'])->name('se.index');
    Route::get('/software/flashcards', [SeController::class, 'flashcards'])->name('se.flashcards');
    Route::post('/software/flashcards/{progress}/answer', [SeController::class, 'flashcardAnswer'])->whereNumber('progress')->name('se.flashcard-answer');
    Route::get('/software/sessions/{session}/audio', [SeController::class, 'audio'])->whereNumber('session')->name('se.sessions.audio');
    Route::get('/software/sessions/{session}', [SeController::class, 'session'])->whereNumber('session')->name('se.sessions.show');
    Route::get('/software/{prompt}', [SeController::class, 'show'])->whereNumber('prompt')->name('se.show');
    Route::post('/software/{prompt}/writing', [SeController::class, 'storeWriting'])->whereNumber('prompt')->name('se.store-writing');
    Route::post('/software/{prompt}/speaking', [SeController::class, 'storeSpeaking'])->whereNumber('prompt')->name('se.store-speaking');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/generate', [DashboardController::class, 'generate'])->name('dashboard.generate');
    Route::post('/dashboard/save', [DashboardController::class, 'save'])->name('dashboard.save');
    Route::delete('/dashboard/{type}/{id}', [DashboardController::class, 'destroy'])
        ->whereIn('type', ['reading', 'speaking', 'writing'])
        ->whereNumber('id')
        ->name('dashboard.destroy');

    Route::get('/submissions/{submission}/rewrite', [RewriteController::class, 'show'])->name('rewrite.show');
    Route::post('/submissions/{submission}/rewrite', [RewriteController::class, 'store'])->name('rewrite.store');
});

require __DIR__.'/auth.php';
