<?php

namespace App\Http\Controllers;

use App\Models\AiModel;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

class ModelCatalogController extends Controller
{
    /**
     * GET /api/v1/models
     * Search, filter, and discover hidden gem AI models.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $categorySlug = $request->query('category');
        $maxRam = $request->query('max_ram');
        $accessType = $request->query('access_type');
        $verifiedOnly = $request->boolean('verified_only');
        $source = $request->query('source');

        $query = AiModel::with('category')
            ->orderBy('is_verified_gem', 'desc')
            ->orderBy('parameter_size', 'asc');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('author', 'ilike', "%{$search}%")
                  ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        if ($categorySlug && $categorySlug !== 'all') {
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }

        if ($accessType && $accessType !== 'all') {
            $query->where('access_type', $accessType);
        }

        if ($source && $source !== 'all') {
            $query->where('source', $source);
        }

        if ($verifiedOnly) {
            $query->where('is_verified_gem', true);
        }

        $models = $query->get();

        // Filter by max RAM requirement
        if ($maxRam && is_numeric($maxRam)) {
            $maxRamInt = (int) $maxRam;
            $models = $models->filter(function ($model) use ($maxRamInt) {
                $specs = $model->hardware_specs ?? [];
                $minRam = $specs['min_ram_gb'] ?? 8;
                return $minRam <= $maxRamInt;
            })->values();
        }

        return response()->json([
            'status' => 'success',
            'count' => $models->count(),
            'data' => $models,
        ]);
    }

    /**
     * GET /api/v1/models/{slug}
     * Get specific model detail.
     */
    public function show(string $slug): JsonResponse
    {
        $model = AiModel::with(['category', 'benchmarkScores'])->where('slug', $slug)->first();

        if (!$model) {
            return response()->json([
                'status' => 'error',
                'message' => 'Model not found',
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => $model,
        ]);
    }

    /**
     * GET /api/v1/categories
     * List all categories with model counts.
     */
    public function categories(): JsonResponse
    {
        $categories = Category::withCount('models')->get();

        return response()->json([
            'status' => 'success',
            'data' => $categories,
        ]);
    }

    /**
     * POST /api/v1/sync
     * Trigger background ingestion sync.
     */
    public function sync(Request $request): JsonResponse
    {
        $source = $request->input('source', 'all');

        Artisan::call('app:sync-models', [
            '--source' => $source,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "Ingestion sync completed for source: {$source}",
        ]);
    }

    /**
     * GET /api/v1/export
     * Export dataset as downloadable JSON file.
     */
    public function export()
    {
        Artisan::call('app:export-models');

        $filePath = base_path('storage/app/ai_models_export.json');
        if (!File::exists($filePath)) {
            return response()->json(['status' => 'error', 'message' => 'Export file failed'], 500);
        }

        return response()->download($filePath, 'hidden_gem_ai_models.json', [
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * POST /api/v1/import
     * Import JSON dataset.
     */
    public function import(Request $request): JsonResponse
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $path = storage_path('app/uploaded_import.json');
            $file->move(dirname($path), basename($path));

            Artisan::call('app:import-models', [
                '--file' => 'storage/app/uploaded_import.json',
            ]);
        } else {
            Artisan::call('app:import-models');
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Dataset imported successfully!',
        ]);
    }
}
