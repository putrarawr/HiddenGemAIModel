import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Cpu, HardDrive, Terminal, Copy, Check, Sparkles, 
    Code2, Brain, Eye, ExternalLink, ShieldCheck, Zap, Layers, 
    Filter, CheckCircle2, AlertTriangle, X, ArrowRight, Compass, 
    Database, SlidersHorizontal, ChevronRight, ChevronDown, Laptop, 
    Box, Server, Play, Info, ArrowUpRight, BookOpen, HelpCircle,
    Activity, ChevronLeft, Layers2, Sun, Moon
} from 'lucide-react';

const Github = (props) => (
    <svg className={props.className || "w-4 h-4"} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
    </svg>
);

function App() {
    // Navigation view state: 'landing' | 'catalog'
    const [currentView, setCurrentView] = useState(() => {
        return window.location.hash === '#catalog' ? 'catalog' : 'landing';
    });

    // Dark / Light Theme state
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('theme') || 'dark';
    });

    useEffect(() => {
        localStorage.setItem('theme', theme);
        document.documentElement.className = theme;
        if (theme === 'light') {
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const [models, setModels] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Catalog Filters
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [maxRam, setMaxRam] = useState('all');
    const [accessType, setAccessType] = useState('all');
    const [selectedSource, setSelectedSource] = useState('all');
    const [verifiedOnly, setVerifiedOnly] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    // Modal state
    const [selectedModel, setSelectedModel] = useState(null);
    const [copiedSnippet, setCopiedSnippet] = useState(null);
    const [activeTab, setActiveTab] = useState('ollama');

    // Toast state
    const [toastMessage, setToastMessage] = useState(null);

    // Sync URL hash with navigation
    const navigateTo = (view) => {
        setCurrentView(view);
        window.location.hash = view;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash === 'catalog' || hash === 'landing') {
                setCurrentView(hash);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        fetchCategories();
        fetchModels();
    }, [selectedCategory, maxRam, accessType, selectedSource, verifiedOnly]);

    // Reset pagination to page 1 whenever filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCategory, maxRam, accessType, selectedSource, verifiedOnly]);

    const showToast = (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 4000);
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/v1/categories');
            const json = await res.json();
            if (json.status === 'success') {
                setCategories(json.data);
            }
        } catch (err) {
            console.error('Failed fetching categories:', err);
        }
    };

    const fetchModels = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            if (maxRam !== 'all') params.append('max_ram', maxRam);
            if (accessType !== 'all') params.append('access_type', accessType);
            if (selectedSource !== 'all') params.append('source', selectedSource);
            if (verifiedOnly) params.append('verified_only', 'true');

            const res = await fetch(`/api/v1/models?${params.toString()}`);
            const json = await res.json();
            if (json.status === 'success') {
                setModels(json.data);
            }
        } catch (err) {
            console.error('Failed fetching models:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        fetchModels();
    };

    const copyToClipboard = (text, type) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedSnippet(type);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    const getModelDocUrl = (model) => {
        if (!model) return '#';
        if (model.source === 'openrouter') {
            return `https://openrouter.ai/models/${model.slug || model.name}`;
        }
        if (model.source === 'huggingface') {
            const path = model.slug || `${model.author}/${model.name}`;
            return `https://huggingface.co/${path}`;
        }
        if (model.source === 'ollama') {
            return `https://ollama.com/library/${model.slug || model.name}`;
        }
        if (model.source === 'groq') {
            return `https://console.groq.com/docs/models`;
        }
        return `https://huggingface.co/models?search=${encodeURIComponent(model.name)}`;
    };

    const getCategoryIcon = (iconStr) => {
        switch (iconStr) {
            case 'code': return <Code2 className="w-3.5 h-3.5" />;
            case 'brain': return <Brain className="w-3.5 h-3.5" />;
            case 'eye': return <Eye className="w-3.5 h-3.5" />;
            case 'cpu': return <Cpu className="w-3.5 h-3.5" />;
            default: return <Sparkles className="w-3.5 h-3.5" />;
        }
    };

    const verifiedGemsCount = models.filter(m => m.is_verified_gem).length;
    const verifiedGems = models.filter(m => m.is_verified_gem).slice(0, 3);

    return (
        <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-500 selection:text-white relative transition-colors duration-300">
            {/* Toast Notification */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-50 liquid-glass-nav text-slate-900 dark:text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/40"
                    >
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 animate-pulse" />
                        <span className="text-xs font-medium">{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dynamic Floating Liquid Glass Navbar */}
            <div className="sticky top-0 z-40 px-3 sm:px-6 pt-3 pb-1">
                <motion.header 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-5xl mx-auto liquid-glass-nav rounded-full px-4 sm:px-6 h-14 flex items-center justify-between shadow-2xl"
                >
                    {/* Brand Logo */}
                    <button 
                        onClick={() => navigateTo('landing')} 
                        className="flex items-center gap-2.5 group focus:outline-none"
                    >
                        <div className="w-7.5 h-7.5 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition">
                            <div className="w-full h-full bg-slate-100 dark:bg-[#09090b] rounded-full flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="text-left">
                            <span className="font-bold text-xs tracking-tight text-slate-900 dark:text-white block leading-none">
                                Hidden Gem AI
                            </span>
                            <span className="text-[9px] text-slate-600 dark:text-zinc-400 font-mono block leading-none mt-0.5">
                                Hub Model &le;14B
                            </span>
                        </div>
                    </button>

                    {/* Navigation Pills */}
                    <nav className="flex items-center gap-1 bg-slate-200/90 dark:bg-zinc-950/60 p-1 rounded-full border border-slate-300/80 dark:border-white/5">
                        <button
                            onClick={() => navigateTo('landing')}
                            className={`px-4 py-1 rounded-full text-xs font-medium transition relative ${
                                currentView === 'landing' 
                                    ? 'text-slate-900 dark:text-white font-semibold' 
                                    : 'text-slate-700 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {currentView === 'landing' && (
                                <motion.div 
                                    layoutId="navPill" 
                                    className="absolute inset-0 bg-white dark:bg-zinc-800/90 border border-slate-300 dark:border-white/10 rounded-full shadow-sm" 
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10">Overview</span>
                        </button>

                        <button
                            onClick={() => navigateTo('catalog')}
                            className={`px-4 py-1 rounded-full text-xs font-medium transition relative flex items-center gap-1.5 ${
                                currentView === 'catalog' 
                                    ? 'text-slate-900 dark:text-white font-semibold' 
                                    : 'text-slate-700 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                            }`}
                        >
                            {currentView === 'catalog' && (
                                <motion.div 
                                    layoutId="navPill" 
                                    className="absolute inset-0 bg-white dark:bg-zinc-800/90 border border-slate-300 dark:border-white/10 rounded-full shadow-sm" 
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                Katalog Model
                                <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[9px] font-mono font-semibold">
                                    {models.length}
                                </span>
                            </span>
                        </button>
                    </nav>

                    {/* Theme Toggle Button */}
                    <div className="flex items-center gap-2">
                        <motion.button 
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={toggleTheme}
                            className="p-2 rounded-full bg-slate-200/90 dark:bg-zinc-900/90 text-slate-800 dark:text-zinc-300 border border-slate-300/80 dark:border-zinc-700/60 shadow-sm flex items-center justify-center transition"
                            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                            ) : (
                                <Moon className="w-4 h-4 text-indigo-700 dark:text-indigo-400" />
                            )}
                        </motion.button>
                    </div>
                </motion.header>
            </div>

            {/* Main Content Views with Framer Motion */}
            <div className="flex-1">
                <AnimatePresence mode="wait">
                    {currentView === 'landing' ? (
                        <motion.div
                            key="landing"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <LandingView 
                                models={models}
                                verifiedGems={verifiedGems}
                                verifiedCount={verifiedGemsCount}
                                navigateTo={navigateTo}
                                setSelectedModel={setSelectedModel}
                                setActiveTab={setActiveTab}
                                getModelDocUrl={getModelDocUrl}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="catalog"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        >
                            <CatalogView 
                                models={models}
                                categories={categories}
                                loading={loading}
                                search={search}
                                setSearch={setSearch}
                                selectedCategory={selectedCategory}
                                setSelectedCategory={setSelectedCategory}
                                maxRam={maxRam}
                                setMaxRam={setMaxRam}
                                accessType={accessType}
                                setAccessType={setAccessType}
                                selectedSource={selectedSource}
                                setSelectedSource={setSelectedSource}
                                verifiedOnly={verifiedOnly}
                                setVerifiedOnly={setVerifiedOnly}
                                currentPage={currentPage}
                                setCurrentPage={setCurrentPage}
                                itemsPerPage={itemsPerPage}
                                handleSearchSubmit={handleSearchSubmit}
                                setSelectedModel={setSelectedModel}
                                setActiveTab={setActiveTab}
                                copyToClipboard={copyToClipboard}
                                copiedSnippet={copiedSnippet}
                                getCategoryIcon={getCategoryIcon}
                                getModelDocUrl={getModelDocUrl}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Model Inspector Modal */}
            <AnimatePresence>
                {selectedModel && (
                    <ModelInspectorModal 
                        model={selectedModel}
                        onClose={() => setSelectedModel(null)}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        copyToClipboard={copyToClipboard}
                        copiedSnippet={copiedSnippet}
                        getModelDocUrl={getModelDocUrl}
                    />
                )}
            </AnimatePresence>

            {/* Minimalist Liquid Glass Footer */}
            <footer className="border-t border-slate-300 dark:border-zinc-800/80 bg-slate-200/80 dark:bg-[#09090b] py-10 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-600 dark:text-zinc-400">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-semibold text-slate-900 dark:text-zinc-300">Hidden Gem AI Discovery Hub</span>
                        <span className="text-slate-400 dark:text-zinc-600">|</span>
                        <span className="text-slate-600 dark:text-zinc-500">Agregator Model AI Lightweight &le;14B</span>
                    </div>

                    <div className="flex items-center gap-6 text-slate-700 dark:text-zinc-400 font-medium">
                        <button onClick={() => navigateTo('landing')} className="hover:text-slate-900 dark:hover:text-white transition">Overview</button>
                        <button onClick={() => navigateTo('catalog')} className="hover:text-slate-900 dark:hover:text-white transition">Katalog Model</button>
                        <a 
                            href="https://github.com/putrarawr/HiddenGemAIModel" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1 text-slate-700 dark:text-zinc-400"
                        >
                            GitHub Repo <ArrowUpRight className="w-3 h-3 text-slate-500 dark:text-zinc-500" />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* ==========================================================================
   LANDING VIEW COMPONENT
   ========================================================================== */
function LandingView({ models, verifiedGems, verifiedCount, navigateTo, setSelectedModel, setActiveTab, getModelDocUrl }) {
    // Interactive Terminal Tab
    const [demoTab, setDemoTab] = useState('ollama');
    const [copiedDemo, setCopiedDemo] = useState(false);

    // FAQ Accordion State
    const [openFaq, setOpenFaq] = useState(null);

    const demoCommands = {
        ollama: 'ollama run qwen2.5:7b',
        python: `from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "Qwen/Qwen2.5-7B-Instruct"
model = AutoModelForCausalLM.from_pretrained(model_name, device_map="auto")
tokenizer = AutoTokenizer.from_pretrained(model_name)`,
        curl: `curl https://openrouter.ai/api/v1/chat/completions \\
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \\
  -d '{"model": "qwen/qwen-2.5-7b-instruct:free", "messages": [{"role": "user", "content": "Halo AI!"}]}'`
    };

    const copyDemoCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopiedDemo(true);
        setTimeout(() => setCopiedDemo(false), 2000);
    };

    const faqs = [
        {
            q: "Apakah model di katalog ini benar-benar bisa berjalan di laptop biasa?",
            a: "Ya. Seluruh model dipilah ketat berukuran di bawah atau sama dengan 14 Miliar Parameter (<=14B). Model dengan format GGUF kuantisasi 4-bit (Q4_K_M) dapat berjalan dengan lancar pada RAM 8GB hingga 16GB tanpa membutuhkan GPU server mahal."
        },
        {
            q: "Bagaimana cara menghitung RAM minimal yang dibutuhkan laptop saya?",
            a: "Setiap model di katalog mencantumkan spesifikasi RAM minimal (8GB, 12GB, atau 16GB). Rumus estimasi kami memperhitung ukuran bobot model setelah kuantisasi 4-bit plus alokasi context window (misal: 4K/8K tokens)."
        },
        {
            q: "Apa perbedaan antara Open-Weights, GGUF, dan Free Cloud API?",
            a: "Open-Weights adalah bobot mentah PyTorch dari Hugging Face. GGUF adalah format terkompresi yang siap dijalankan secara lokal via Ollama CLI. Free Cloud API adalah model yang disediakan gratis oleh penyedia cloud seperti OpenRouter tanpa menggunakan resource laptop Anda."
        },
        {
            q: "Dari mana asal data katalog ini dan seberapa sering diperbarui?",
            a: "Data diambil secara terotomatisasi dari OpenRouter API, Hugging Face Hub, dan Ollama Registry. Skrip scraper otomatis memperbarui indeks dan mengekstrak metrik menggunakan LLM Extractor."
        }
    ];

    return (
        <div className="space-y-24 pb-20 pt-6">
            {/* 1. Hero Section */}
            <section className="pt-12 pb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center relative">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.2 rounded-full bg-slate-300/90 dark:bg-zinc-900/90 border border-slate-400 dark:border-zinc-800 text-emerald-800 dark:text-emerald-400 text-xs font-mono mb-6 backdrop-blur-md shadow-sm font-semibold"
                >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 animate-pulse" />
                    Kurasi Model AI Lightweight (&le;14B Parameters)
                </motion.div>

                <motion.h1 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6 leading-tight max-w-4xl mx-auto"
                >
                    Temukan Model AI Underrated <br className="hidden sm:inline" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 via-indigo-700 to-purple-700 dark:from-emerald-400 dark:via-indigo-300 dark:to-purple-400 font-bold">
                        Siap Jalan di Laptop Anda
                    </span>
                </motion.h1>

                <motion.p 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-slate-700 dark:text-zinc-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed font-medium"
                >
                    Agregator model AI efisien (≤14B) dengan spesifikasi hardware laptop instan dan skrip eksekusi 1-klik.
                </motion.p>

                {/* Primary Hero Actions */}
                <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-wrap items-center justify-center gap-4"
                >
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigateTo('catalog')}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-xl shadow-indigo-600/25 border border-indigo-400/20"
                    >
                        Jelajahi Katalog Model
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <motion.a
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        href="https://github.com/putrarawr/HiddenGemAIModel" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-slate-900 text-white dark:bg-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-800 dark:text-zinc-300 border border-slate-800 dark:border-zinc-800 rounded-xl text-xs font-semibold transition flex items-center gap-2 shadow-sm"
                    >
                        <Github className="w-4 h-4 text-slate-300 dark:text-zinc-400" />
                        GitHub Repository
                    </motion.a>
                </motion.div>
            </section>

            {/* 2. Interactive Terminal Code Playground */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="liquid-glass-nav rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-white/10">
                    {/* Terminal Window Header */}
                    <div className="bg-slate-900 dark:bg-zinc-950/90 px-4 py-3 border-b border-slate-800 dark:border-zinc-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                            <span className="ml-2 text-[11px] font-mono text-slate-300 dark:text-zinc-400 flex items-center gap-1.5">
                                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Instant Execution Playground
                            </span>
                        </div>

                        {/* Language Selector Pills */}
                        <div className="flex items-center gap-1 bg-slate-950 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-800 dark:border-zinc-800">
                            <button
                                onClick={() => setDemoTab('ollama')}
                                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition ${
                                    demoTab === 'ollama' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 dark:text-zinc-400 hover:text-white'
                                }`}
                            >
                                Ollama CLI
                            </button>
                            <button
                                onClick={() => setDemoTab('python')}
                                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition ${
                                    demoTab === 'python' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 dark:text-zinc-400 hover:text-white'
                                }`}
                            >
                                Python SDK
                            </button>
                            <button
                                onClick={() => setDemoTab('curl')}
                                className={`px-2.5 py-0.5 rounded text-[11px] font-mono transition ${
                                    demoTab === 'curl' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 dark:text-zinc-400 hover:text-white'
                                }`}
                            >
                                cURL HTTP
                            </button>
                        </div>
                    </div>

                    {/* Terminal Body */}
                    <div className="bg-slate-950 p-5 font-mono text-xs text-slate-200 relative overflow-x-auto">
                        <button
                            onClick={() => copyDemoCode(demoCommands[demoTab])}
                            className="absolute right-4 top-4 px-2.5 py-1 bg-slate-900 dark:bg-zinc-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] flex items-center gap-1 border border-slate-800 dark:border-zinc-800 transition"
                        >
                            {copiedDemo ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5 text-indigo-400" /> Salin Code
                                </>
                            )}
                        </button>
                        <pre className="text-slate-300 pr-20 whitespace-pre-wrap leading-relaxed">
                            {demoCommands[demoTab]}
                        </pre>
                    </div>
                </div>
            </section>

            {/* 3. Live Metrics Data Strip */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-[#121215]/80 border border-slate-300 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm">
                        <div className="text-[11px] text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5 font-semibold">
                            <Layers2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Total Model
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{models.length} Model</div>
                    </div>

                    <div className="bg-white dark:bg-[#121215]/80 border border-slate-300 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm">
                        <div className="text-[11px] text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Verified Gem
                        </div>
                        <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">{verifiedCount} Model</div>
                    </div>

                    <div className="bg-white dark:bg-[#121215]/80 border border-slate-300 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm">
                        <div className="text-[11px] text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5 font-semibold">
                            <Laptop className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Target Laptop
                        </div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-400 font-mono">8GB - 16GB</div>
                    </div>

                    <div className="bg-white dark:bg-[#121215]/80 border border-slate-300 dark:border-zinc-800/80 p-4 rounded-xl shadow-sm">
                        <div className="text-[11px] text-slate-600 dark:text-zinc-400 mb-1 flex items-center gap-1.5 font-semibold">
                            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Scraper Status
                        </div>
                        <div className="text-base font-bold text-cyan-700 dark:text-cyan-400 font-mono flex items-center gap-1.5 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Active
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. How It Works (Step Workflow) */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <div className="text-xs font-mono text-indigo-700 dark:text-indigo-400 mb-1 font-semibold">Pipeline Alur Kerja</div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Bagaimana Hidden Gem AI Bekerja?</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                    <div className="bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800/80 p-5 rounded-2xl relative space-y-3 shadow-sm">
                        <span className="text-2xl font-bold font-mono text-slate-400 dark:text-zinc-700">01</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Automated Scraping</h3>
                        <p className="text-slate-700 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                            Skrip penambang otomatis mengindeks model gratis &amp; open-weights dari OpenRouter, Hugging Face, dan Ollama.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800/80 p-5 rounded-2xl relative space-y-3 shadow-sm">
                        <span className="text-2xl font-bold font-mono text-slate-400 dark:text-zinc-700">02</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">LLM Metadata Extraction</h3>
                        <p className="text-slate-700 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                            Gemini &amp; Groq AI mengekstrak poin keunggulan, kelemahan, serta kebutuhan hardware dari dokumen repositori.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800/80 p-5 rounded-2xl relative space-y-3 shadow-sm">
                        <span className="text-2xl font-bold font-mono text-slate-400 dark:text-zinc-700">03</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">Hardware Fit Scoring</h3>
                        <p className="text-slate-700 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                            Filter otomatis mengeliminasi model berat (&gt;14B) dan mengkategorikan estimasi RAM (8GB/12GB/16GB).
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800/80 p-5 rounded-2xl relative space-y-3 shadow-sm">
                        <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-500/80">04</span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">One-Click Setup</h3>
                        <p className="text-slate-700 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                            Salin perintah eksekusi Ollama CLI, Python SDK, atau cURL langsung ke terminal pengembang Anda.
                        </p>
                    </div>
                </div>
            </section>

            {/* 5. Hardware RAM Fit Comparison Matrix */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mb-1 font-semibold">Spesifikasi Laptop</div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Matriks Kesesuaian RAM Laptop</h2>
                    <p className="text-slate-700 dark:text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto mt-1 font-medium">
                        Pilih model AI yang sesuai dengan alokasi memori fisik laptop Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 8GB RAM Tier */}
                    <div className="liquid-glass-card p-6 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-semibold">Tier 8GB RAM</span>
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-xs font-mono font-semibold">Lightweight</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Model 1.5B - 4B</h3>
                        <p className="text-slate-700 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                            Sangat cocok untuk laptop standar tanpa GPU diskrit. Hemat memori dengan respon super cepat.
                        </p>
                        <div className="space-y-2 text-xs text-slate-700 dark:text-zinc-300 pt-2 border-t border-slate-200 dark:border-zinc-800/60">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-zinc-400">Kuantisasi Recommended:</span>
                                <span className="font-mono text-slate-900 dark:text-white font-semibold">Q4_K_M</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-zinc-400">Contoh Model:</span>
                                <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">Qwen 2.5 3B, DeepSeek R1 1.5B</span>
                            </div>
                        </div>
                    </div>

                    {/* 12GB RAM Tier */}
                    <div className="liquid-glass-card p-6 rounded-2xl space-y-4 border-indigo-500/30">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                            <span className="text-xs font-mono text-indigo-700 dark:text-indigo-400 uppercase tracking-wider font-semibold">Tier 12GB RAM</span>
                            <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-800 dark:text-indigo-400 text-xs font-mono font-semibold">Balanced</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Model 7B - 8B</h3>
                        <p className="text-slate-700 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                            Keseimbangan ideal antara kecerdasan bernalar, kemampuan coding, dan konsumsi resource.
                        </p>
                        <div className="space-y-2 text-xs text-slate-700 dark:text-zinc-300 pt-2 border-t border-slate-200 dark:border-zinc-800/60">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-zinc-400">Kuantisasi Recommended:</span>
                                <span className="font-mono text-slate-900 dark:text-white font-semibold">Q4_K_M / Q5_K_M</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-zinc-400">Contoh Model:</span>
                                <span className="font-mono text-indigo-700 dark:text-indigo-300 font-semibold">Llama 3.1 8B, Qwen 2.5 7B</span>
                            </div>
                        </div>
                    </div>

                    {/* 16GB RAM Tier */}
                    <div className="liquid-glass-card p-6 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pb-3">
                            <span className="text-xs font-mono text-purple-700 dark:text-purple-400 uppercase tracking-wider font-semibold">Tier 16GB RAM</span>
                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-800 dark:text-purple-400 text-xs font-mono font-semibold">High Precision</span>
                        </div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">Model 14B</h3>
                        <p className="text-slate-700 dark:text-zinc-400 text-xs leading-relaxed font-medium">
                            Kinerja penalaran tingkat tinggi mendekati model komersial cloud besar untuk tugas kompleks.
                        </p>
                        <div className="space-y-2 text-xs text-slate-700 dark:text-zinc-300 pt-2 border-t border-slate-200 dark:border-zinc-800/60">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-zinc-400">Kuantisasi Recommended:</span>
                                <span className="font-mono text-slate-900 dark:text-white font-semibold">Q4_K_M / Q8_0</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-600 dark:text-zinc-400">Contoh Model:</span>
                                <span className="font-mono text-purple-700 dark:text-purple-300 font-semibold">Qwen 2.5 14B, DeepSeek R1 14B</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Curated Gem Highlights */}
            {verifiedGems.length > 0 && (
                <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5 font-semibold">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> Kurasi Terverifikasi
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Verified Gems Highlight</h2>
                        </div>
                        <button
                            onClick={() => navigateTo('catalog')}
                            className="text-xs text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 font-semibold transition"
                        >
                            Lihat Semua ({models.length})
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {verifiedGems.map((model) => (
                            <motion.div 
                                key={model.id} 
                                whileHover={{ y: -4, scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="liquid-glass-card rounded-2xl p-5 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <div className="text-[11px] text-slate-600 dark:text-zinc-400 font-mono mb-0.5 font-semibold">{model.author}</div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-1">{model.name}</h3>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono shrink-0 font-bold">
                                            {model.parameter_size}B
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 mb-4 text-xs text-slate-700 dark:text-zinc-400">
                                        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800/60">
                                            <span>Min RAM Laptop:</span>
                                            <span className="font-mono text-slate-900 dark:text-zinc-200 font-bold">{model.hardware_specs?.min_ram_gb ?? 8} GB</span>
                                        </div>
                                        <div className="flex items-center justify-between py-1 border-b border-slate-200 dark:border-zinc-800/60">
                                            <span>Sumber:</span>
                                            <span className="font-mono text-slate-900 dark:text-zinc-200 capitalize font-bold">{model.source}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <button
                                        onClick={() => { setSelectedModel(model); setActiveTab('ollama'); }}
                                        className="w-full py-2 bg-slate-900 text-white dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-800 dark:border-zinc-700/60 shadow-sm"
                                    >
                                        <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Inspek &amp; Setup
                                    </button>

                                    <a
                                        href={getModelDocUrl(model)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1 border border-slate-300 dark:border-zinc-800 shadow-sm"
                                    >
                                        <BookOpen className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Dokumentasi AI <ArrowUpRight className="w-3 h-3" />
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* 7. FAQ Section (Accordion) */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <div className="text-xs font-mono text-indigo-700 dark:text-indigo-400 mb-1 font-semibold">Pertanyaan Umum</div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <div 
                                key={index}
                                className="bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800/80 rounded-2xl overflow-hidden transition shadow-sm"
                            >
                                <button
                                    onClick={() => setOpenFaq(isOpen ? null : index)}
                                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
                                >
                                    <span className="font-semibold text-sm text-slate-900 dark:text-zinc-200 flex items-center gap-2">
                                        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                        {faq.q}
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-600 dark:text-zinc-400 transition-transform ${isOpen ? 'rotate-180 text-slate-900 dark:text-white' : ''}`} />
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="px-5 pb-4 text-xs text-slate-700 dark:text-zinc-400 leading-relaxed border-t border-slate-200 dark:border-zinc-800/60 pt-3 font-medium"
                                        >
                                            {faq.a}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 8. Call to Action Banner */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="liquid-glass-card rounded-3xl p-8 sm:p-10 text-center relative overflow-hidden">
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                        Siap Menguji Model AI Lokal di Laptop Anda?
                    </h2>
                    <p className="text-slate-700 dark:text-zinc-400 text-xs sm:text-sm max-w-lg mx-auto mb-6 leading-relaxed font-medium">
                        Jelajahi seluruh katalog model AI ringan berukuran &le;14B dan dapatkan skrip eksekusi instan dalam hitungan detik.
                    </p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigateTo('catalog')}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-xl shadow-indigo-600/30 border border-indigo-400/30 inline-flex items-center gap-2"
                    >
                        Buka Katalog Model Sekarang
                        <ArrowRight className="w-4 h-4" />
                    </motion.button>
                </div>
            </section>
        </div>
    );
}

/* ==========================================================================
   CATALOG VIEW COMPONENT WITH DUAL THEME PAGINATION & SKELETON LOADING
   ========================================================================== */
function CatalogView({ 
    models, categories, loading, search, setSearch, selectedCategory, 
    setSelectedCategory, maxRam, setMaxRam, accessType, setAccessType, 
    selectedSource, setSelectedSource, verifiedOnly, setVerifiedOnly, 
    currentPage, setCurrentPage, itemsPerPage, handleSearchSubmit, 
    setSelectedModel, setActiveTab, copyToClipboard, copiedSnippet, 
    getCategoryIcon, getModelDocUrl 
}) {
    // Pagination math
    const totalModels = models.length;
    const totalPages = Math.ceil(totalModels / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedModels = models.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Catalog Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-300 dark:border-zinc-800/80">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Katalog Model AI</h1>
                    <p className="text-xs text-slate-700 dark:text-zinc-400 mt-1 font-medium">
                        Cari dan filter model AI lightweight (&le;14B) sesuai kapasitas laptop Anda.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-3 py-1.5 rounded-full liquid-glass-pill text-slate-800 dark:text-zinc-300 font-semibold">
                        Total: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{totalModels}</strong> model terindeks
                    </span>
                </div>
            </div>

            {/* Search & Controls */}
            <div className="space-y-4">
                <form onSubmit={handleSearchSubmit} className="relative max-w-2xl">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-zinc-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Cari model (misal: Qwen 2.5, DeepSeek R1, Llama 3.2, Gemma)..."
                        className="w-full bg-white dark:bg-[#121215]/90 border border-slate-300 dark:border-zinc-800 rounded-xl pl-11 pr-24 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition shadow-sm font-medium"
                    />
                    <button
                        type="submit"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-md shadow-indigo-600/20"
                    >
                        Cari
                    </button>
                </form>

                {/* Category Pills Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                            selectedCategory === 'all'
                                ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white border border-slate-800 dark:border-zinc-700 shadow-sm font-semibold'
                                : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#121215] dark:text-zinc-400 dark:hover:text-zinc-200 dark:border-zinc-800/60'
                        }`}
                    >
                        <Filter className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Semuanya
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.slug)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                                selectedCategory === cat.slug
                                    ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white border border-slate-800 dark:border-zinc-700 shadow-sm font-semibold'
                                    : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-300 dark:bg-[#121215] dark:text-zinc-400 dark:hover:text-zinc-200 dark:border-zinc-800/60'
                            }`}
                        >
                            {getCategoryIcon(cat.icon)}
                            {cat.name}
                            <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 dark:bg-zinc-900 dark:text-zinc-400 font-mono font-bold">
                                {cat.models_count ?? 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Advanced Filter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3 liquid-glass-card rounded-xl text-xs">
                    <div>
                        <label className="text-slate-800 dark:text-zinc-400 font-bold mb-1 block">Laptop RAM Fit:</label>
                        <select
                            value={maxRam}
                            onChange={(e) => setMaxRam(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                            <option value="all">Semua Ukuran RAM</option>
                            <option value="8">Maks 8GB RAM (Ringan)</option>
                            <option value="12">Maks 12GB RAM</option>
                            <option value="16">Maks 16GB RAM</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-slate-800 dark:text-zinc-400 font-bold mb-1 block">Tipe Akses Model:</label>
                        <select
                            value={accessType}
                            onChange={(e) => setAccessType(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                            <option value="all">Semua Tipe Akses</option>
                            <option value="open_weights">Open-Weights (Local)</option>
                            <option value="gguf">GGUF (Ollama Ready)</option>
                            <option value="free_cloud_api">Free Cloud API</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-slate-800 dark:text-zinc-400 font-bold mb-1 block">Sumber Registry:</label>
                        <select
                            value={selectedSource}
                            onChange={(e) => setSelectedSource(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                            <option value="all">Semua Sumber</option>
                            <option value="openrouter">OpenRouter API</option>
                            <option value="huggingface">Hugging Face Hub</option>
                            <option value="ollama">Ollama Library</option>
                            <option value="groq">Groq Cloud API</option>
                        </select>
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={() => setVerifiedOnly(!verifiedOnly)}
                            className={`w-full py-1.5 px-3 rounded-lg border flex items-center justify-center gap-1.5 transition font-bold ${
                                verifiedOnly
                                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-400'
                                    : 'bg-slate-100 dark:bg-zinc-900 border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                            {verifiedOnly ? 'Showing Verified Gems' : 'Filter Verified Gems'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Model Grid or Skeleton Loader */}
            {loading ? (
                /* Skeleton Loader Cards Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <div key={idx} className="bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800/60 rounded-2xl p-5 space-y-4 animate-pulse">
                            <div className="flex justify-between items-start">
                                <div className="space-y-2 w-3/4">
                                    <div className="h-3 bg-slate-200 dark:bg-zinc-800 rounded w-1/3"></div>
                                    <div className="h-5 bg-slate-200 dark:bg-zinc-800 rounded w-2/3"></div>
                                </div>
                                <div className="h-6 w-12 bg-slate-200 dark:bg-zinc-800 rounded-md"></div>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-4 w-16 bg-slate-200 dark:bg-zinc-800/80 rounded"></div>
                                <div className="h-4 w-20 bg-slate-200 dark:bg-zinc-800/80 rounded"></div>
                            </div>
                            <div className="space-y-2 pt-2">
                                <div className="h-3 bg-slate-200 dark:bg-zinc-800/60 rounded w-full"></div>
                                <div className="h-3 bg-slate-200 dark:bg-zinc-800/60 rounded w-4/5"></div>
                            </div>
                            <div className="h-9 bg-slate-200 dark:bg-zinc-800/80 rounded-xl pt-2"></div>
                        </div>
                    ))}
                </div>
            ) : totalModels === 0 ? (
                <div className="text-center py-16 liquid-glass-card rounded-2xl max-w-md mx-auto p-6">
                    <AlertTriangle className="w-8 h-8 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Model Tidak Ditemukan</h3>
                    <p className="text-slate-700 dark:text-zinc-400 text-xs mb-4 font-medium">
                        Coba sesuaikan kata kunci pencarian atau reset filter.
                    </p>
                    <button
                        onClick={() => { setSearch(''); setSelectedCategory('all'); setMaxRam('all'); setSelectedSource('all'); setVerifiedOnly(false); }}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition"
                    >
                        Reset Filter
                    </button>
                </div>
            ) : (
                <>
                    <motion.div 
                        key={currentPage}
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { staggerChildren: 0.05 } }
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                    >
                        {paginatedModels.map((model) => {
                            const specs = model.hardware_specs || {};
                            const commands = model.run_commands || {};
                            const prosCons = model.pros_cons || {};
                            const pros = prosCons.pros || [];

                            return (
                                <motion.div
                                    key={model.id}
                                    variants={{
                                        hidden: { opacity: 0, y: 15 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    whileHover={{ y: -4, scale: 1.01 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="liquid-glass-card rounded-2xl p-5 flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <div>
                                                <div className="text-[11px] text-slate-600 dark:text-zinc-400 font-mono mb-0.5 font-bold">{model.author}</div>
                                                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-1">
                                                    {model.name}
                                                </h3>
                                            </div>

                                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-zinc-800 text-slate-900 dark:text-zinc-300 text-xs font-mono font-bold shrink-0">
                                                {model.parameter_size}B
                                            </span>
                                        </div>

                                        {/* Badges Row */}
                                        <div className="flex flex-wrap gap-1.5 mb-4">
                                            {model.is_verified_gem && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                                                    <ShieldCheck className="w-3 h-3" /> Verified Gem
                                                </span>
                                            )}

                                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 text-[10px] font-mono font-semibold">
                                                Min {specs.min_ram_gb ?? 8}GB RAM
                                            </span>

                                            <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-800 dark:text-purple-300 text-[10px] font-mono font-semibold">
                                                {model.source}
                                            </span>
                                        </div>

                                        {/* Pros Snippets */}
                                        <div className="space-y-1.5 mb-5 text-xs text-slate-700 dark:text-zinc-400 font-medium">
                                            {pros.slice(0, 2).map((p, idx) => (
                                                <div key={idx} className="flex items-start gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                                                    <span className="line-clamp-1 text-slate-900 dark:text-zinc-300 font-semibold">{p}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Actions Row */}
                                    <div className="pt-4 border-t border-slate-300 dark:border-zinc-800/80 flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => { setSelectedModel(model); setActiveTab('ollama'); }}
                                                className="flex-1 py-2 px-3 bg-slate-900 text-white dark:bg-zinc-800/90 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-800 dark:border-zinc-700/60 shadow-sm"
                                            >
                                                <Terminal className="w-3.5 h-3.5 text-indigo-400" /> Inspek &amp; Setup
                                            </button>

                                            {commands.ollama && (
                                                <button
                                                    onClick={() => copyToClipboard(commands.ollama, `card-${model.id}`)}
                                                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-300 border border-slate-300 dark:border-zinc-800 rounded-xl text-xs font-mono transition flex items-center gap-1 shadow-sm font-bold"
                                                    title="Salin Perintah Ollama"
                                                >
                                                    {copiedSnippet === `card-${model.id}` ? (
                                                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                                    ) : (
                                                        <Copy className="w-3.5 h-3.5 text-slate-600 dark:text-zinc-400" />
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Direct Documentation Link Button */}
                                        <a
                                            href={getModelDocUrl(model)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1 border border-slate-300 dark:border-zinc-800 shadow-sm"
                                        >
                                            <BookOpen className="w-3 h-3 text-emerald-700 dark:text-emerald-400" /> Dokumentasi AI <ArrowUpRight className="w-3 h-3" />
                                        </a>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Pagination Controls Bar */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-300 dark:border-zinc-800/80 text-xs">
                            <span className="text-slate-700 dark:text-zinc-400 font-mono font-medium">
                                Menampilkan <strong className="text-slate-900 dark:text-zinc-200 font-bold">{startIndex + 1}</strong> - <strong className="text-slate-900 dark:text-zinc-200 font-bold">{Math.min(startIndex + itemsPerPage, totalModels)}</strong> dari <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{totalModels}</strong> model
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm font-semibold"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-mono font-bold transition ${
                                            currentPage === pageNum
                                                ? 'bg-indigo-600 text-white border border-indigo-500 shadow-md shadow-indigo-600/20'
                                                : 'bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-300 dark:border-zinc-800 text-slate-800 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm font-semibold"
                                >
                                    Next <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ==========================================================================
   MODEL INSPECTOR MODAL WITH DUAL THEME READABILITY
   ========================================================================== */
function ModelInspectorModal({ model, onClose, activeTab, setActiveTab, copyToClipboard, copiedSnippet, getModelDocUrl }) {
    const specs = model.hardware_specs || {};
    const commands = model.run_commands || {};
    const prosCons = model.pros_cons || {};
    const docUrl = getModelDocUrl(model);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Animated Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                className="liquid-glass-nav rounded-3xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative shadow-2xl z-10 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-5 top-5 p-1.5 bg-slate-200 dark:bg-zinc-900 hover:bg-slate-300 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-full transition shadow-sm"
                >
                    <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="mb-5 pr-8">
                    <div className="text-xs font-mono text-slate-600 dark:text-zinc-400 mb-0.5 font-bold">{model.author}</div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        {model.name}
                        {model.is_verified_gem && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 text-[10px] rounded font-bold border border-emerald-500/20">
                                Verified Gem
                            </span>
                        )}
                    </h2>
                    
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-300 rounded-md font-mono font-bold">
                            {model.parameter_size}B Parameters
                        </span>
                        <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-zinc-900 border border-slate-300 dark:border-zinc-800 text-slate-900 dark:text-zinc-300 rounded-md font-mono font-bold">
                            Context: {model.context_window}
                        </span>
                        <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-800 dark:text-purple-300 rounded-md font-mono font-bold">
                            {model.access_type}
                        </span>
                    </div>
                </div>

                {/* Hardware Spec Box */}
                <div className="bg-slate-100 dark:bg-zinc-900/90 border border-slate-300 dark:border-zinc-800/80 rounded-xl p-4 mb-6 grid grid-cols-3 gap-3 text-center">
                    <div>
                        <div className="text-[11px] text-slate-600 dark:text-zinc-400 mb-1 font-bold">Min RAM Laptop</div>
                        <div className="text-sm font-bold font-mono text-emerald-700 dark:text-emerald-400">
                            {specs.min_ram_gb ?? 8} GB
                        </div>
                    </div>
                    <div>
                        <div className="text-[11px] text-slate-600 dark:text-zinc-400 mb-1 font-bold">Kuantisasi Ideal</div>
                        <div className="text-sm font-bold font-mono text-indigo-700 dark:text-indigo-400">
                            {specs.ideal_quantization ?? 'Q4_K_M'}
                        </div>
                    </div>
                    <div>
                        <div className="text-[11px] text-slate-600 dark:text-zinc-400 mb-1 font-bold">Target VRAM</div>
                        <div className="text-sm font-bold font-mono text-purple-700 dark:text-purple-400">
                            {specs.vram_gb ?? 4} GB
                        </div>
                    </div>
                </div>

                {/* One-Click Code Setup Tabs */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 border-b border-slate-300 dark:border-zinc-800 pb-2 mb-3">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-300 mr-2 flex items-center gap-1.5">
                            <Terminal className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Copy Config:
                        </span>
                        <button
                            onClick={() => setActiveTab('ollama')}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition ${
                                activeTab === 'ollama' ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            Ollama CLI
                        </button>
                        <button
                            onClick={() => setActiveTab('python')}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition ${
                                activeTab === 'python' ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            Python SDK
                        </button>
                        <button
                            onClick={() => setActiveTab('curl')}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono transition ${
                                activeTab === 'curl' ? 'bg-slate-900 text-white dark:bg-zinc-800 dark:text-white font-bold' : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                            }`}
                        >
                            cURL HTTP
                        </button>
                    </div>

                    <div className="relative bg-slate-950 border border-slate-800 dark:border-zinc-800/80 rounded-xl p-4 font-mono text-xs text-slate-200 overflow-x-auto">
                        <button
                            onClick={() => copyToClipboard(commands[activeTab] || '', 'modal')}
                            className="absolute right-3 top-3 px-2 py-1 bg-slate-900 dark:bg-zinc-900 hover:bg-slate-800 text-slate-300 rounded-md text-[11px] flex items-center gap-1 border border-slate-800 dark:border-zinc-800 transition"
                        >
                            {copiedSnippet === 'modal' ? (
                                <>
                                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" /> Salin Skrip
                                </>
                            )}
                        </button>
                        <pre className="pr-20 whitespace-pre-wrap leading-relaxed">
                            {commands[activeTab] || '# Perintah belum tersedia'}
                        </pre>
                    </div>
                </div>

                {/* Pros & Cons List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Keunggulan Utama
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-800 dark:text-zinc-300 font-medium">
                            {(prosCons.pros || []).map((p, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">•</span> {p}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Limitasi Teknis
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-800 dark:text-zinc-300 font-medium">
                            {(prosCons.cons || []).map((c, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                    <span className="text-amber-700 dark:text-amber-400 font-bold">•</span> {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer Action Bar with Direct Documentation Link */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-300 dark:border-zinc-800/80">
                    <a
                        href={docUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-900 dark:text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm"
                    >
                        <BookOpen className="w-4 h-4 text-emerald-700 dark:text-emerald-400" /> Buka Dokumentasi Resmi AI
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-200 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                        Tutup Modal
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

const container = document.getElementById('app');
if (container) {
    const root = createRoot(container);
    root.render(<App />);
}
