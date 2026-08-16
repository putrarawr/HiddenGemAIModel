<?php

namespace App\Console\Commands;

use App\Models\AiModel;
use App\Models\Category;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ExportModelsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:export-models {--file=storage/app/ai_models_export.json : Path to export JSON file}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Export all categories and AI models to a portable JSON dataset file.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $filePath = base_path($this->option('file'));
        $this->info("Exporting AI Models dataset to {$filePath}...");

        $categories = Category::all(['id', 'name', 'slug', 'icon']);
        $models = AiModel::with(['category', 'benchmarkScores'])->get();

        $data = [
            'version' => '1.0',
            'exported_at' => now()->toIso8601String(),
            'total_categories' => $categories->count(),
            'total_models' => $models->count(),
            'categories' => $categories->map(fn ($c) => [
                'name' => $c->name,
                'slug' => $c->slug,
                'icon' => $c->icon,
            ])->toArray(),
            'models' => $models->map(fn ($m) => [
                'name' => $m->name,
                'slug' => $m->slug,
                'author' => $m->author,
                'parameter_size' => $m->parameter_size,
                'context_window' => $m->context_window,
                'access_type' => $m->access_type,
                'category_slug' => $m->category?->slug ?? 'general',
                'hardware_specs' => $m->hardware_specs,
                'pros_cons' => $m->pros_cons,
                'run_commands' => $m->run_commands,
                'is_verified_gem' => $m->is_verified_gem,
                'review_status' => $m->review_status,
                'source' => $m->source,
                'benchmark_scores' => $m->benchmarkScores->map(fn ($b) => [
                    'benchmark_name' => $b->benchmark_name,
                    'score' => $b->score,
                    'baseline_comparison' => $b->baseline_comparison,
                ])->toArray(),
            ])->toArray(),
        ];

        $dir = dirname($filePath);
        if (!File::exists($dir)) {
            File::makeDirectory($dir, 0755, true);
        }

        File::put($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // Also save a copy in database/seeders/data/ai_models_export.json for default seeder
        $seederCopy = base_path('database/seeders/data/ai_models_export.json');
        File::makeDirectory(dirname($seederCopy), 0755, true, true);
        File::put($seederCopy, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        $this->info("✓ Successfully exported {$models->count()} models and {$categories->count()} categories!");
        $this->info("  Export file: {$filePath}");

        return Command::SUCCESS;
    }
}
