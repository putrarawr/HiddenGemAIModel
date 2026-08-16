<?php

namespace App\Services\Extractor;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LlmExtractorService
{
    protected ?string $geminiApiKey;
    protected ?string $groqApiKey;

    public function __construct()
    {
        $this->geminiApiKey = config('services.gemini.key', env('GEMINI_API_KEY'));
        $this->groqApiKey = config('services.groq.key', env('GROQ_API_KEY'));
    }

    /**
     * Process model metadata using Gemini or Groq API (with retry policy & schema fallback).
     *
     * @param array $modelData
     * @return array
     */
    public function extractAttributes(array $modelData): array
    {
        $name = $modelData['name'] ?? 'Model';
        $author = $modelData['author'] ?? 'Author';
        $paramSize = $modelData['parameter_size'] ?? 7.0;
        $description = $modelData['description'] ?? '';

        // If Gemini API Key is provided, call Gemini API with retry policy
        if (!empty($this->geminiApiKey)) {
            $extracted = $this->callGeminiApi($name, $author, $paramSize, $description);
            if ($extracted !== null) {
                return $extracted;
            }
        }

        // Fallback to Groq API if available
        if (!empty($this->groqApiKey)) {
            $extracted = $this->callGroqApi($name, $author, $paramSize, $description);
            if ($extracted !== null) {
                return $extracted;
            }
        }

        // Fallback to intelligent deterministic parser / mock generator
        return $this->generateFallbackExtraction($name, $author, $paramSize, $description);
    }

    /**
     * Call Gemini API with exponential backoff retry.
     */
    protected function callGeminiApi(string $name, string $author, float $paramSize, string $description): ?array
    {
        $prompt = $this->buildPrompt($name, $author, $paramSize, $description);
        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$this->geminiApiKey}";

        $maxRetries = 3;
        $delayMs = 1000;

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $response = Http::timeout(15)->post($url, [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => $prompt]
                            ]
                        ]
                    ],
                    'generationConfig' => [
                        'responseMimeType' => 'application/json',
                    ]
                ]);

                if ($response->successful()) {
                    $jsonText = $response->json('candidates.0.content.parts.0.text', '');
                    $parsed = json_decode($jsonText, true);

                    if ($this->validateExtractionSchema($parsed)) {
                        $parsed['review_status'] = 'published';
                        return $parsed;
                    }
                }

                if ($response->status() === 429) {
                    Log::warning("Gemini API rate limited (Attempt {$attempt}/{$maxRetries}). Retrying in {$delayMs}ms...");
                    usleep($delayMs * 1000);
                    $delayMs *= 2; // Exponential backoff
                    continue;
                }

                break;
            } catch (\Throwable $e) {
                Log::error("Gemini API exception: {$e->getMessage()}");
            }
        }

        return null;
    }

    /**
     * Call Groq API with structured JSON output.
     */
    protected function callGroqApi(string $name, string $author, float $paramSize, string $description): ?array
    {
        $prompt = $this->buildPrompt($name, $author, $paramSize, $description);
        $url = "https://api.groq.com/openai/v1/chat/completions";

        try {
            $response = Http::withToken($this->groqApiKey)->timeout(15)->post($url, [
                'model' => 'llama-3.1-8b-instant',
                'messages' => [
                    ['role' => 'user', 'content' => $prompt]
                ],
                'response_format' => ['type' => 'json_object']
            ]);

            if ($response->successful()) {
                $content = $response->json('choices.0.message.content', '');
                $parsed = json_decode($content, true);

                if ($this->validateExtractionSchema($parsed)) {
                    $parsed['review_status'] = 'published';
                    return $parsed;
                }
            }
        } catch (\Throwable $e) {
            Log::error("Groq API exception: {$e->getMessage()}");
        }

        return null;
    }

    /**
     * Build system prompt for structured JSON extraction.
     */
    protected function buildPrompt(string $name, string $author, float $paramSize, string $description): string
    {
        return <<<PROMPT
You are an AI model evaluation assistant. Analyze the model details:
- Name: {$name}
- Author: {$author}
- Parameter Size: {$paramSize}B
- Description: {$description}

Return a valid JSON object matching EXACTLY this structure:
{
  "category_slug": "coding" | "research" | "vision" | "low-spec" | "general",
  "pros": ["advantage 1", "advantage 2", "advantage 3"],
  "cons": ["technical limitation 1"],
  "hardware_specs": {
    "min_ram_gb": 8,
    "ideal_quantization": "Q4_K_M",
    "vram_gb": 4
  },
  "run_commands": {
    "ollama": "ollama run {$name}",
    "python": "from transformers import AutoModelForCausalLM\\nmodel = AutoModelForCausalLM.from_pretrained('{$author}/{$name}')",
    "curl": "curl http://localhost:11434/api/generate -d '{\"model\": \"{$name}\", \"prompt\": \"Hello\"}'"
  },
  "is_verified_gem": true
}
PROMPT;
    }

    /**
     * Validate extracted JSON schema.
     */
    protected function validateExtractionSchema(?array $data): bool
    {
        if (!$data || !is_array($data)) {
            return false;
        }

        return isset($data['pros'], $data['cons'], $data['hardware_specs'], $data['run_commands'])
            && is_array($data['pros'])
            && is_array($data['hardware_specs']);
    }

    /**
     * Fallback parser if API keys are missing or output validation fails.
     */
    protected function generateFallbackExtraction(string $name, string $author, float $paramSize, string $description): array
    {
        $slugLower = strtolower("{$name} {$description}");
        $category = 'low-spec';

        if (str_contains($slugLower, 'code') || str_contains($slugLower, 'coder') || str_contains($slugLower, 'dev')) {
            $category = 'coding';
        } elseif (str_contains($slugLower, 'math') || str_contains($slugLower, 'reason') || str_contains($slugLower, 'think')) {
            $category = 'research';
        } elseif (str_contains($slugLower, 'vision') || str_contains($slugLower, 'vl') || str_contains($slugLower, 'image')) {
            $category = 'vision';
        }

        $minRam = $paramSize <= 4.0 ? 8 : ($paramSize <= 8.0 ? 12 : 16);
        $vram = $paramSize <= 4.0 ? 4 : ($paramSize <= 8.0 ? 6 : 8);

        return [
            'category_slug' => $category,
            'pros' => [
                "Efisien untuk model {$paramSize}B pada hardware kelas konsumen",
                "Performa seimbang untuk task {$category}",
                "Mendukung kuantisasi GGUF Q4_K_M"
            ],
            'cons' => [
                "Context window terbatas bila dijalankan tanpa GPU VRAM besar"
            ],
            'hardware_specs' => [
                'min_ram_gb' => $minRam,
                'ideal_quantization' => 'Q4_K_M',
                'vram_gb' => $vram,
            ],
            'run_commands' => [
                'ollama' => "ollama run " . Str::slug("{$author}-{$name}"),
                'python' => "from transformers import AutoModelForCausalLM\nmodel = AutoModelForCausalLM.from_pretrained('{$author}/{$name}')",
                'curl' => "curl http://localhost:11434/api/generate -d '{\"model\": \"" . Str::slug("{$author}-{$name}") . "\", \"prompt\": \"Halo\"}'",
            ],
            'is_verified_gem' => $paramSize <= 8.0,
            'review_status' => 'needs_review',
        ];
    }
}
