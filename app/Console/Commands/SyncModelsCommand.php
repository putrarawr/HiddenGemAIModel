<?php

namespace App\Console\Commands;

use App\Models\AiModel;
use App\Models\Category;
use App\Models\IngestionLog;
use App\Services\Extractor\LlmExtractorService;
use App\Services\Scrapers\HuggingFaceScraperService;
use App\Services\Scrapers\OllamaScraperService;
use App\Services\Scrapers\OpenRouterScraperService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class SyncModelsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-models 
                            {--source=all : Source to sync (all, openrouter, huggingface, ollama)} 
                            {--force : Force overwrite existing models instead of skipping duplicates}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync AI models from OpenRouter, HuggingFace, and Ollama, skip duplicates, run LLM extraction agent, and index hidden gems.';

    /**
     * Execute the console command.
     */
    public function handle(
        OpenRouterScraperService $openRouterScraper,
        HuggingFaceScraperService $huggingFaceScraper,
        OllamaScraperService $ollamaScraper,
        LlmExtractorService $extractor
    ): int {
        $startedAt = Carbon::now();
        $sourceOption = strtolower($this->option('source'));
        $forceOverwrite = $this->option('force');
        $this->info("Starting AI Model Ingestion Sync [Source: {$sourceOption}] [Force Overwrite: " . ($forceOverwrite ? 'Yes' : 'No') . "]...");

        $this->seedCategories();

        $scrapedModels = [];

        // Scrape OpenRouter
        if ($sourceOption === 'all' || $sourceOption === 'openrouter') {
            $this->info('Scraping OpenRouter free models...');
            $openRouterModels = $openRouterScraper->fetchFreeModels();
            $this->info('Found ' . count($openRouterModels) . ' free OpenRouter models.');
            $scrapedModels = array_merge($scrapedModels, $openRouterModels);
        }

        // Scrape HuggingFace
        if ($sourceOption === 'all' || $sourceOption === 'huggingface') {
            $this->info('Scraping HuggingFace open-weights models...');
            $hfModels = $huggingFaceScraper->fetchOpenWeightModels(30);
            $this->info('Found ' . count($hfModels) . ' open-weights HuggingFace models.');
            $scrapedModels = array_merge($scrapedModels, $hfModels);
        }

        // Scrape Ollama
        if ($sourceOption === 'all' || $sourceOption === 'ollama') {
            $this->info('Scraping Ollama library & local models...');
            $ollamaModels = $ollamaScraper->fetchModels();
            $this->info('Found ' . count($ollamaModels) . ' Ollama models.');
            $scrapedModels = array_merge($scrapedModels, $ollamaModels);
        }

        $itemsProcessed = 0;
        $itemsSkipped = 0;
        $errorMessages = [];
        $processedSlugs = [];

        foreach ($scrapedModels as $modelData) {
            try {
                $slug = Str::slug($modelData['slug'] ?? ($modelData['author'] . '-' . $modelData['name']));

                // 1. In-batch duplicate validation: skip if already processed in current run
                if (in_array($slug, $processedSlugs)) {
                    $itemsSkipped++;
                    $this->line("  ➜ Skipped duplicate in current batch: {$modelData['author']}/{$modelData['name']} [Slug: {$slug}]");
                    continue;
                }

                // 2. Database duplicate validation: skip if already exists in database unless --force flag is passed
                $existingModel = AiModel::where('slug', $slug)
                    ->orWhere(function ($query) use ($modelData) {
                        $query->where('name', $modelData['name'])
                              ->where('author', $modelData['author']);
                    })
                    ->first();

                if ($existingModel && !$forceOverwrite) {
                    $itemsSkipped++;
                    $processedSlugs[] = $slug;
                    $this->line("  ➜ Skipped existing model: {$existingModel->author}/{$existingModel->name} [Status: Already Indindexed]");
                    continue;
                }

                $extracted = $extractor->extractAttributes($modelData);

                // Find matching category
                $categorySlug = $extracted['category_slug'] ?? 'general';
                $category = Category::where('slug', $categorySlug)->first()
                    ?? Category::where('slug', 'general')->first();

                $attributes = [
                    'name' => $modelData['name'],
                    'slug' => $slug,
                    'author' => $modelData['author'],
                    'parameter_size' => $modelData['parameter_size'],
                    'context_window' => $modelData['context_window'] ?? 4096,
                    'access_type' => $modelData['access_type'] ?? 'open_weights',
                    'hardware_specs' => $extracted['hardware_specs'] ?? [],
                    'pros_cons' => [
                        'pros' => $extracted['pros'] ?? [],
                        'cons' => $extracted['cons'] ?? [],
                    ],
                    'run_commands' => $extracted['run_commands'] ?? [],
                    'category_id' => $category?->id,
                    'is_verified_gem' => $extracted['is_verified_gem'] ?? false,
                    'review_status' => $extracted['review_status'] ?? 'published',
                    'last_synced_at' => Carbon::now(),
                    'source' => $modelData['source'],
                ];

                $aiModel = AiModel::updateOrCreate(['slug' => $slug], $attributes);
                $processedSlugs[] = $slug;

                $itemsProcessed++;
                $this->line("  ✓ Synced model: {$aiModel->author}/{$aiModel->name} [Source: {$aiModel->source}] [Status: {$aiModel->review_status}]");
            } catch (\Throwable $e) {
                $errorMsg = "Failed processing {$modelData['name']}: {$e->getMessage()}";
                $errorMessages[] = $errorMsg;
                $this->error("  ✗ {$errorMsg}");
            }
        }

        $finishedAt = Carbon::now();
        $status = empty($errorMessages) ? 'success' : ($itemsProcessed > 0 ? 'partial' : 'failed');

        // Log to ingestion_logs table
        IngestionLog::create([
            'source' => $sourceOption,
            'status' => $status,
            'items_processed' => $itemsProcessed,
            'error_message' => empty($errorMessages) ? null : implode("\n", $errorMessages),
            'started_at' => $startedAt,
            'finished_at' => $finishedAt,
        ]);

        $this->info("Sync completed! Processed {$itemsProcessed} new models, skipped {$itemsSkipped} duplicates. Logged status: [{$status}].");

        return Command::SUCCESS;
    }

    /**
     * Seed initial categories if empty.
     */
    protected function seedCategories(): void
    {
        $defaultCategories = [
            ['name' => 'Coding & Software Dev', 'slug' => 'coding', 'icon' => 'code'],
            ['name' => 'Research & Reasoning', 'slug' => 'research', 'icon' => 'brain'],
            ['name' => 'Vision & Multimodal', 'slug' => 'vision', 'icon' => 'eye'],
            ['name' => 'Low-Spec & Lightweight', 'slug' => 'low-spec', 'icon' => 'cpu'],
            ['name' => 'General Assistant', 'slug' => 'general', 'icon' => 'sparkles'],
        ];

        foreach ($defaultCategories as $cat) {
            Category::firstOrCreate(
                ['slug' => $cat['slug']],
                ['name' => $cat['name'], 'icon' => $cat['icon']]
            );
        }
    }
}
