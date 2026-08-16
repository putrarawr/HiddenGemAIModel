<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="Hidden Gem AI Discovery Hub - Kurasi otomatis model AI gratis & open-weights (≤14B) untuk laptop spesifikasi terjangkau.">
    <title>Hidden Gem AI Discovery Hub</title>
    
    <script>
        (function() {
            const saved = localStorage.getItem('theme') || 'dark';
            document.documentElement.className = saved;
            if (document.body) {
                document.body.className = saved === 'light' ? 'light-theme' : 'dark-theme';
            }
        })();
    </script>

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
    
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body class="font-sans antialiased selection:bg-indigo-500 selection:text-white min-h-screen">
    <div id="app"></div>
</body>
</html>
