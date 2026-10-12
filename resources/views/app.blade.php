<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" dir="{{ app()->getLocale() === 'ar' ? 'rtl' : 'ltr' }}" @class(['dark' => ($appearance ?? 'light') === 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <script>
            (function () {
                try {
                    var appearance = localStorage.getItem('appearance') === 'dark' ? 'dark' : 'light';
                    var dark = appearance === 'dark';
                    document.documentElement.classList.toggle('dark', dark);
                    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
                    document.documentElement.dataset.theme = appearance;
                } catch (e) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                    document.documentElement.dataset.theme = 'light';
                }
            })();
        </script>

        <style>
            html {
                background-color: #ffffff;
            }
            html.dark {
                background-color: #111111;
            }
        </style>

        <title inertia>{{ config('app.name', 'Zahra') }}</title>

        <link rel="icon" type="image/png" href="{{ asset('logo-zahra-gold.png') }}">
        <link rel="apple-touch-icon" href="{{ asset('logo-zahra-gold.png') }}">

        <link rel="preconnect" href="https://fonts.bunny.net">
        @if(app()->getLocale() === 'ar')
        <link href="https://fonts.bunny.net/css?family=cairo:400,600,700|cormorant-garamond:500,600,700|dm-sans:400,500,600,700" rel="stylesheet" />
        @else
        <link href="https://fonts.bunny.net/css?family=cormorant-garamond:500,600,700|dm-sans:400,500,600,700" rel="stylesheet" />
        @endif

        @routes
        @viteReactRefresh
        @vite('resources/js/app.tsx')
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-background text-foreground @if(app()->getLocale() === 'ar') font-arabic @endif">
        @inertia
    </body>
</html>
