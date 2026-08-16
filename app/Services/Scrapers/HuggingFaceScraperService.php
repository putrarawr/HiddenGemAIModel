<?php

namespace App\Services\Scrapers;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class HuggingFaceScraperService
{
    protected string $baseUrl = 'https://huggingface.co/api/models';

    /**
     * Fetch open-weights AI models (small <=14B) from Hugging Face Hub API across multiple queries.
     *
     * @param int $limit
     * @return array
     */
    public function fetchOpenWeightModels(int $limit = 60): array
    {
        try {
            $filters = ['text-generation', 'gguf', 'conversational'];
            $allModels = [];
            $seenIds = [];

            foreach ($filters as $filter) {
                $response = Http::timeout(30)->get($this->baseUrl, [
                    'sort' => 'downloads',
                    'direction' => -1,
                    'limit' => $limit,
                    'full' => 'true',
                    'filter' => $filter,
                ]);

                if ($response->successful()) {
                    $models = $response->json() ?? [];
                    foreach ($models as $item) {
                        $modelId = $item['id'] ?? '';
                        if (empty($modelId) || in_array($modelId, $seenIds)) {
                            continue;
                        }

                        $idParts = explode('/', $modelId);
                        $author = count($idParts) > 1 ? $idParts[0] : 'HuggingFace';
                        $name = count($idParts) > 1 ? $idParts[1] : $modelId;

                        $paramSize = $this->extractParameterSize($modelId);

                        // Filter models <= 14B and > 0B
                        if ($paramSize <= 14.0 && $paramSize > 0) {
                            $seenIds[] = $modelId;
                            $tags = $item['tags'] ?? [];
                            $license = $this->extractLicense($tags);

                            $allModels[] = [
                                'name' => $name,
                                'slug' => Str::slug("hf-{$author}-{$name}"),
                                'author' => $author,
                                'parameter_size' => $paramSize,
                                'context_window' => 8192,
                                'access_type' => 'open_weights',
                                'source' => 'huggingface',
                                'description' => "Open-weights model by {$author}. License: {$license}",
                                'raw_metadata' => $item,
                            ];
                        }
                    }
                }
            }

            return $allModels;
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
        if (preg_match('/(\d+(?:\.\d+)?)\s*m/i', $text, $matches)) {
            return round((float) $matches[1] / 1000.0, 2);
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
