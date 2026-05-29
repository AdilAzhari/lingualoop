<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'LinguaLoop') }}</title>

    {{--
      Fonts. The prototype used the Google Fonts CDN; production self-hosts via
      bunny.net (a privacy-friendly, GDPR-safe drop-in for the same families).
      Newsreader (variable, optical sizing) + JetBrains Mono — do NOT swap the
      serif for a sans-serif, it is the brand.
    --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link
        href="https://fonts.bunny.net/css?family=newsreader:300,300i,400,400i,500,500i,600|jetbrains-mono:400,500,600&display=swap"
        rel="stylesheet"
    />

    {{-- Prevent dark-mode flash: apply saved theme before React hydrates --}}
    <script>(function(){var t=localStorage.getItem('ll-theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.setAttribute('data-theme','dark');}}());</script>

    @routes
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
    @inertiaHead
</head>
<body class="font-serif antialiased">
    @inertia
</body>
</html>
