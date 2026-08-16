<?php

namespace App\Services\Scrapers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class OpenRouterScraperService
{
    protected string $baseUrl = 'https://openrouter.ai/api/v1';

    /**
     * Fetch free-tier AI models from OpenRouter API.
     *
     * @return array
     */
    public function fetchFreeModels(): array
    {
        try {
            $response = Http::timeout(30)->get("{$this->baseUrl}/models");

            if ($response->failed()) {
                Log::error('OpenRouter scraper failed to fetch models', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return [];
            }

            $data = $response->json('data', []);
            $freeModels = [];

            foreach ($data as $item) {
                $pricing = $item['pricing'] ?? [];
                $promptPrice = floatval($pricing['prompt'] ?? -1);
                $completionPrice = floatval($pricing['completion'] ?? -1);

                // Filter models where prompt and completion pricing is zero or free-tier
                if ($promptPrice === 0.0 && $completionPrice === 0.0) {
                    $idParts = explode('/', $item['id'] ?? '');
                    $author = count($idParts) > 1 ? $idParts[0] : 'OpenRouter';
                    $name = count($idParts) > 1 ? $idParts[1] : ($item['id'] ?? 'unknown');

                    // Extract parameter size estimate from model id/name if available (e.g. 7b, 8b, 14b)
                    $paramSize = $this->extractParameterSize($item['id'] . ' ' . ($item['name'] ?? ''));

                    // Filter only models <= 14B parameters
                    if ($paramSize <= 14.0) {
                        $freeModels[] = [
                            'name' => $item['name'] ?? $name,
                            'slug' => Str::slug("{$author}-{$name}"),
                            'author' => $author,
                            'parameter_size' => $paramSize,
                            'context_window' => $item['context_length'] ?? 4096,
                            'access_type' => 'free_cloud_api',
                            'source' => 'openrouter',
                            'description' => $item['description'] ?? '',
                            'raw_metadata' => $item,
                        ];
                    }
                }
            }

            return $freeModels;
        } catch (\Throwable $e) {
            Log::error('OpenRouter scraper exception: ' . $e->getMessage());
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
        return 7.0; // Default reasonable small size estimate
    }
}
