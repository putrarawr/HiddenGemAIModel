<?php

namespace App\Services\Scrapers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GroqCloudScraperService
{
    protected string $baseUrl = 'https://api.groq.com/openai/v1';

    /**
     * Fetch models from Groq Cloud API.
     *
     * @return array
     */
    public function fetchModels(): array
    {
        try {
            $apiKey = config('services.groq.api_key') ?? env('GROQ_API_KEY');

            if (!$apiKey) {
                Log::warning('Groq API Key is not set in environment.');
                return [];
            }

            $response = Http::withToken($apiKey)
                ->timeout(30)
                ->get("{$this->baseUrl}/models");

            if ($response->failed()) {
                Log::error('Groq Cloud scraper failed to fetch models', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return [];
            }

            $data = $response->json('data', []);
            $models = [];

            foreach ($data as $item) {
                if (empty($item['active'])) {
                    continue;
                }

                $modelId = $item['id'] ?? '';
                $name = $item['name'] ?? $modelId;
                $author = $item['owned_by'] ?? 'Groq';

                $paramSize = $this->extractParameterSize($modelId . ' ' . $name);

                // Filter <= 14B models for our lightweight catalog
                if ($paramSize <= 14.0) {
                    $models[] = [
                        'name' => "Groq: {$name}",
                        'slug' => Str::slug("groq-{$author}-{$modelId}"),
                        'author' => $author,
                        'parameter_size' => $paramSize,
                        'context_window' => $item['context_window'] ?? 8192,
                        'access_type' => 'free_cloud_api',
                        'source' => 'groq',
                        'description' => "Ultra-fast inference model hosted on Groq LPU Cloud ({$name}).",
                        'raw_metadata' => $item,
                    ];
                }
            }

            return $models;
        } catch (\Throwable $e) {
            Log::error('Groq Cloud scraper exception: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Helper to extract parameter size (in Billions) from string.
     */
    protected function extractParameterSize(string $text): float
    {
        if (preg_match('/(\d+(?:\.\d+)?)\s*b/i', $text, $matches)) {
            return (float) $matches[1];
        }
        if (preg_match('/(\d+(?:\.\d+)?)\s*m/i', $text, $matches)) {
            return round((float) $matches[1] / 1000.0, 2);
        }
        return 8.0;
    }
}
