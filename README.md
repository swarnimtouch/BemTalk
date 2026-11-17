# BemTalk Poster Studio

A stateless Laravel 12 page for creating the two supplied BemTalk webinar poster formats. The user enters the speaker name, speciality, topic, date, time, and webinar link once. Both posters are rendered in the browser and can be downloaded as:

- one ZIP containing two high-resolution PNG files;
- one single-page PDF containing only the portrait poster.
- one “Download both” action that creates the ZIP and PDF together.

The portrait preview opens the entered webinar URL, and the portrait page in the generated PDF includes the same clickable hyperlink.

Long content is fitted automatically: speaker names use up to two lines, topics up to three lines, and speciality/hospital details up to four lines. The page includes custom dependency-free calendar and time pickers instead of the browser's unstyled native popup.

Admins can optionally select a JPG, PNG, or WebP speaker photo, reposition it by dragging, and zoom it in a circular crop popup. The cropped image is applied to both poster formats in browser memory only.

No submitted value or generated image is sent to the server, database, session, or filesystem. MySQL settings are included for the requested project stack, but this feature intentionally has no tables or database queries.

## Requirements

- PHP 8.3
- Laravel 12
- MySQL 8 (available to the wider application, unused by this stateless feature)
- Bootstrap 5 (loaded from CDN, with a local layout fallback)
- Composer

No extra Composer or npm package is required.

## Run the existing project

```powershell
cd C:\xampp\htdocs\BemTalk
Copy-Item .env.example .env
php artisan key:generate
php artisan serve
```

Open `http://127.0.0.1:8000`.

The project already contains `vendor/` and the lockfile. For a clean checkout where dependencies are not present, run Laravel's standard install command once:

```powershell
composer install
```

There is no need to run `npm install`, `npm run build`, or `php artisan migrate` for the poster studio.

## Run tests

```powershell
php artisan test
```

## Main files

- `resources/views/welcome.blade.php` — page structure and form
- `public/css/poster-studio.css` — responsive UI and offline Bootstrap fallback
- `public/js/poster-studio.js` — canvas rendering plus dependency-free ZIP/PDF generation
- `public/images/` — the two user-provided source templates
- `tests/Feature/PosterStudioTest.php` — route and statelessness checks
