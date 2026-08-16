<?php

use App\Http\Controllers\ModelCatalogController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/models', [ModelCatalogController::class, 'index']);
    Route::get('/models/{slug}', [ModelCatalogController::class, 'show']);
    Route::get('/categories', [ModelCatalogController::class, 'categories']);
    Route::post('/sync', [ModelCatalogController::class, 'sync']);
    Route::get('/export', [ModelCatalogController::class, 'export']);
    Route::post('/import', [ModelCatalogController::class, 'import']);
});
