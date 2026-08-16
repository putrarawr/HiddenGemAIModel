<?php

namespace App\Services\Scrapers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OllamaScraperService
{
    protected string $localUrl = 'http://localhost:11434/api/tags';

    /**
     * Popular Ollama library curated models.
     */
    protected array $curatedLibrary = [
        ['name' => 'deepseek-r1:8b', 'author' => 'DeepSeek', 'param' => 8.0, 'context' => 128000, 'type' => 'gguf', 'cat' => 'research'],
        ['name' => 'deepseek-r1:1.5b', 'author' => 'DeepSeek', 'param' => 1.5, 'context' => 128000, 'type' => 'gguf', 'cat' => 'low-spec'],
        ['name' => 'qwen2.5-coder:7b', 'author' => 'Qwen', 'param' => 7.0, 'context' => 32768, 'type' => 'gguf', 'cat' => 'coding'],
        ['name' => 'qwen2.5-coder:1.5b', 'author' => 'Qwen', 'param' => 1.5, 'context' => 32768, 'type' => 'gguf', 'cat' => 'coding'],
        ['name' => 'llama3.2:3b', 'author' => 'Meta', 'param' => 3.0, 'context' => 128000, 'type' => 'gguf', 'cat' => 'general'],
        ['name' => 'llama3.2:1b', 'author' => 'Meta', 'param' => 1.0, 'context' => 128000, 'type' => 'gguf', 'cat' => 'low-spec'],
        ['name' => 'phi4:14b', 'author' => 'Microsoft', 'param' => 14.0, 'context' => 16384, 'type' => 'gguf', 'cat' => 'research'],
        ['name' => 'gemma2:9b', 'author' => 'Google', 'param' => 9.0, 'context' => 8192, 'type' => 'gguf', 'cat' => 'general'],
        ['name' => 'gemma2:2b', 'author' => 'Google', 'param' => 2.0, 'context' => 8192, 'type' => 'gguf', 'cat' => 'low-spec'],
        ['name' => 'starcoder2:3b', 'author' => 'BigCode', 'param' => 3.0, 'context' => 16384, 'type' => 'gguf', 'cat' => 'coding'],
        ['name' => 'llava:7b', 'author' => 'Llava', 'param' => 7.0, 'context' => 4096, 'type' => 'gguf', 'cat' => 'vision'],
    ];

    /**
     * Fetch models from local Ollama instance & curated Ollama library.
     *
     * @return array
     */
    public function fetchModels(): array
    {
        $models = [];

        // 1. Fetch from local running Ollama instance if available
        try {
            $response = Http::timeout(3)->get($this->localUrl);
            if ($response->successful()) {
                $localModels = $response->json('models', []);
                foreach ($localModels as $item) {
                    $name = $item['name'] ?? '';
                    $sizeBytes = $item['size'] ?? 0;
                    $sizeGb = round($sizeBytes / (1024 * 1024 * 1024), 2);
                    $paramSize = $this->extractParameterSize($name);

                    $models[] = [
                        'name' => "Ollama Local: {$name}",
                        'slug' => Str::slug("ollama-local-{$name}"),
                        'author' => 'Local Machine',
                        'parameter_size' => $paramSize > 0 ? $paramSize : 7.0,
                        'context_window' => 8192,
                        'access_type' => 'gguf',
                        'source' => 'ollama',
                        'description' => "Model lokal terpasan di Ollama ({$sizeGb} GB disk size)",
                        'raw_metadata' => $item,
                    ];
                }
            }
        } catch (\Throwable $e) {
            Log::info("Local Ollama endpoint not reachable or skipped: {$e->getMessage()}");
        }

        // 2. Fetch curated Ollama library models
        foreach ($this->curatedLibrary as $item) {
            $name = $item['name'];
            $author = $item['author'];
            $slug = Str::slug("ollama-{$name}");

            $models[] = [
                'name' => "Ollama: {$name}",
                'slug' => $slug,
                'author' => $author,
                'parameter_size' => $item['param'],
                'context_window' => $item['context'],
                'access_type' => 'gguf',
                'source' => 'ollama',
                'description' => "Official Ollama Library model {$name} by {$author}",
                'raw_metadata' => $item,
            ];
        }

        return $models;
    }

    protected function extractParameterSize(string $text): float
    {
        if (preg_match('/(\d+(?:\.\d+)?)\s*b/i', $text, $matches)) {
            return (float) $matches[1];
        }
        return 7.0;
    }
}
