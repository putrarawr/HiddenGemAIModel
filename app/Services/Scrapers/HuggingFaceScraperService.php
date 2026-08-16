<?php

namespace App\Services\Scrapers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class HuggingFaceScraperService
{
    protected string $baseUrl = 'https://huggingface.co/api/models';

    /**
     * Fetch open-weights AI models (small <=14B) from Hugging Face Hub API.
     *
     * @param int $limit
     * @return array
     */
    public function fetchOpenWeightModels(int $limit = 30): array
    {
        try {
            $response = Http::timeout(30)->get($this->baseUrl, [
                'sort' => 'downloads',
                'direction' => -1,
                'limit' => $limit,
                'full' => 'true',
                'filter' => 'text-generation',
            ]);

            if ($response->failed()) {
                Log::error('HuggingFace scraper failed to fetch models', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return [];
            }

            $models = $response->json();
            $filteredModels = [];

            foreach ($models as $item) {
                $modelId = $item['id'] ?? '';
                $idParts = explode('/', $modelId);
                $author = count($idParts) > 1 ? $idParts[0] : 'HuggingFace';
                $name = count($idParts) > 1 ? $idParts[1] : $modelId;

                $paramSize = $this->extractParameterSize($modelId);

                // Filter models <= 14B
                if ($paramSize <= 14.0 && $paramSize > 0) {
                    $tags = $item['tags'] ?? [];
                    $license = $this->extractLicense($tags);

                    $filteredModels[] = [
                        'name' => $name,
                        'slug' => Str::slug("{$author}-{$name}"),
                        'author' => $author,
                        'parameter_size' => $paramSize,
                        'context_window' => 4096,
                        'access_type' => 'open_weights',
                        'source' => 'huggingface',
                        'description' => "Open-weights model by {$author}. License: {$license}",
                        'raw_metadata' => $item,
                    ];
                }
            }

            return $filteredModels;
        } catch (\Throwable $e) {
            Log::error('HuggingFace scraper exception: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Helper to extract parameter size (in Billions) from model name or tags.
     */
    protected function extractParameterSize(string $text): float
    {
        if (preg_match('/(\d+(?:\.\d+)?)\s*b/i', $text, $matches)) {
            return (float) $matches[1];
        }
        return 0.0;
    }

    /**
     * Helper to extract license tag.
     */
    protected function extractLicense(array $tags): string
    {
        foreach ($tags as $tag) {
            if (str_starts_with($tag, 'license:')) {
                return str_replace('license:', '', $tag);
            }
        }
        return 'permissive';
    }
}
