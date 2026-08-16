<?php

namespace App\Console\Commands;

use App\Models\AiModel;
use App\Models\BenchmarkScore;
use App\Models\Category;
use App\Models\IngestionLog;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;

class ImportModelsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:import-models {--file=storage/app/ai_models_export.json : Path to JSON dataset file to import}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import categories and AI models from a pre-scraped JSON dataset file without making API calls.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $filePath = base_path($this->option('file'));

        if (!File::exists($filePath)) {
            $fallback = base_path('database/seeders/data/ai_models_export.json');
            if (File::exists($fallback)) {
                $filePath = $fallback;
            } else {
                $this->error("Import dataset file not found at {$filePath}");
                return Command::FAILURE;
            }
        }

        $this->info("Importing AI Models dataset from {$filePath}...");

        $content = File::get($filePath);
        $data = json_decode($content, true);

        if (!$data || !isset($data['models'])) {
            $this->error("Invalid JSON dataset format");
            return Command::FAILURE;
        }

        $startedAt = Carbon::now();

        // 1. Import Categories
        $categoriesData = $data['categories'] ?? [];
        foreach ($categoriesData as $cat) {
            Category::firstOrCreate(
                ['slug' => $cat['slug']],
                ['name' => $cat['name'], 'icon' => $cat['icon'] ?? 'sparkles']
            );
        }

        // 2. Import Models
        $modelsData = $data['models'] ?? [];
        $importedCount = 0;

        foreach ($modelsData as $item) {
            $categorySlug = $item['category_slug'] ?? 'general';
            $category = Category::where('slug', $categorySlug)->first()
                ?? Category::where('slug', 'general')->first();

            $aiModel = AiModel::updateOrCreate(
                ['slug' => $item['slug']],
                [
                    'name' => $item['name'],
                    'author' => $item['author'],
                    'parameter_size' => $item['parameter_size'],
                    'context_window' => $item['context_window'] ?? 4096,
                    'access_type' => $item['access_type'] ?? 'open_weights',
                    'hardware_specs' => $item['hardware_specs'] ?? [],
                    'pros_cons' => $item['pros_cons'] ?? [],
                    'run_commands' => $item['run_commands'] ?? [],
                    'category_id' => $category?->id,
                    'is_verified_gem' => $item['is_verified_gem'] ?? false,
                    'review_status' => $item['review_status'] ?? 'published',
                    'last_synced_at' => Carbon::now(),
                    'source' => $item['source'] ?? 'import',
                ]
            );

            // Import benchmark scores if present
            if (isset($item['benchmark_scores']) && is_array($item['benchmark_scores'])) {
                foreach ($item['benchmark_scores'] as $b) {
                    BenchmarkScore::updateOrCreate(
                        [
                            'model_id' => $aiModel->id,
                            'benchmark_name' => $b['benchmark_name'],
                        ],
                        [
                            'score' => $b['score'],
                            'baseline_comparison' => $b['baseline_comparison'] ?? null,
                        ]
                    );
                }
            }

            $importedCount++;
            $this->line("  ✓ Imported: {$aiModel->author}/{$aiModel->name}");
        }

        IngestionLog::create([
            'source' => 'json_import',
            'status' => 'success',
            'items_processed' => $importedCount,
            'error_message' => null,
            'started_at' => $startedAt,
            'finished_at' => Carbon::now(),
        ]);

        $this->info("✓ Successfully imported {$importedCount} AI models from JSON dataset!");

        return Command::SUCCESS;
    }
}
