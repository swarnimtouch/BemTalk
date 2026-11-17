<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>BemTalk Poster Studio</title>
    <meta name="description" content="Create and download BemTalk webinar posters without storing personal data.">
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-sRIl4kxILFvY47J16cr9ZwB07vP4J8+LH7qKQnuqkuIAvNWLzeN8tE5YBujZqJLB" crossorigin="anonymous">
    <link rel="stylesheet" href="{{ asset('css/poster-studio.css') }}">
</head>
<body>
    <header class="studio-header">
        <nav class="container-xl d-flex align-items-center justify-content-between py-3" aria-label="Main navigation">
            <a class="brand-mark text-decoration-none" href="{{ url('/') }}" aria-label="BemTalk Poster Studio home">
                <span class="brand-icon" aria-hidden="true">B</span>
                <span><strong>BemTalk</strong><small>Poster Studio</small></span>
            </a>
            <span class="privacy-pill"><span class="privacy-dot"></span> Private by design</span>
        </nav>
    </header>

    <main class="container-xl py-4 py-lg-5">
        <section class="hero-copy mb-4 mb-lg-5">
            <span class="eyebrow">WEBINAR CREATIVE TOOL</span>
            <p>Enter the speaker and event details once. Preview both formats, then download both PNG posters in a ZIP or the portrait poster as a PDF.</p>
        </section>

        <div class="row g-4 align-items-start">
            <div class="col-lg-4">
                <section class="editor-card sticky-lg-top" aria-labelledby="details-heading">
                    <div class="editor-heading">
                        <span class="step-number">1</span>
                        <div><h2 id="details-heading">Event details</h2><p>Changes appear in both posters.</p></div>
                    </div>

                    <form id="posterForm" novalidate autocomplete="off">
                        <div class="mb-3">
                            <label class="form-label" for="speakerName">Speaker name</label>
                            <input class="form-control" id="speakerName" name="speakerName" maxlength="60" value="Dr. Arya Subhadra" required>
                            <div class="invalid-feedback">Enter the speaker's name.</div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label" for="speakerPhoto">Speaker photo</label>
                            <label class="photo-upload-control" for="speakerPhoto">
                                <span class="photo-upload-preview" id="photoUploadPreview" aria-hidden="true">+</span>
                                <span><strong id="photoUploadTitle">Choose a photo</strong><small>JPG, PNG or WebP · crop before applying</small></span>
                                <span class="photo-upload-action">Browse</span>
                            </label>
                            <input class="visually-hidden-file" type="file" id="speakerPhoto" name="speakerPhoto" accept="image/jpeg,image/png,image/webp">
                            <button class="remove-photo" id="removePhoto" type="button" hidden>Use original photo</button>
                        </div>

                        <div class="mb-3">
                            <label class="form-label" for="speciality">Speciality and hospital</label>
                            <textarea class="form-control" id="speciality" name="speciality" maxlength="220" rows="3" required>Consultant Interventional Cardiologist,
St. Gregorious Medical Mission Hospital, Parumala</textarea>
                            <div class="form-text d-flex justify-content-between"><span>Supports long hospital names and auto-fits up to 4 lines.</span><span id="specialityCount">86/220</span></div>
                            <div class="invalid-feedback">Enter the speciality or hospital.</div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label" for="topic">Webinar topic</label>
                            <textarea class="form-control" id="topic" name="topic" maxlength="180" rows="2" required>Two Pathways, One Goal: Comprehensive LDL-C Reduction</textarea>
                            <div class="form-text d-flex justify-content-between"><span>Long topics auto-fit up to 3 lines.</span><span id="topicCount">53/180</span></div>
                            <div class="invalid-feedback">Enter the webinar topic.</div>
                        </div>

                        <div class="row g-3 mb-3">
                            <div class="col-sm-7 col-lg-12 col-xl-7 picker-field">
                                <label class="form-label" for="datePickerButton">Date</label>
                                <div class="picker-shell">
                                    <input type="hidden" id="eventDate" name="eventDate" value="2026-11-17">
                                    <button class="picker-control" id="datePickerButton" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="datePickerPopover">
                                        <span class="picker-symbol" aria-hidden="true">▦</span>
                                        <span id="datePickerValue">Tue, 17 Nov 2026</span>
                                        <span class="picker-chevron" aria-hidden="true">⌄</span>
                                    </button>
                                    <div class="picker-popover calendar-popover" id="datePickerPopover" role="dialog" aria-label="Choose event date" hidden>
                                        <div class="calendar-header">
                                            <button type="button" id="calendarPrevious" aria-label="Previous month">‹</button>
                                            <strong id="calendarMonth"></strong>
                                            <button type="button" id="calendarNext" aria-label="Next month">›</button>
                                        </div>
                                        <div class="calendar-weekdays" aria-hidden="true"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div>
                                        <div class="calendar-grid" id="calendarGrid"></div>
                                        <button class="picker-today" id="calendarToday" type="button">Choose today</button>
                                    </div>
                                </div>
                                <div class="invalid-feedback">Choose a date.</div>
                            </div>
                            <div class="col-sm-5 col-lg-12 col-xl-5 picker-field">
                                <label class="form-label" for="timePickerButton">Time</label>
                                <div class="picker-shell">
                                    <input type="hidden" id="eventTime" name="eventTime" value="20:00">
                                    <button class="picker-control" id="timePickerButton" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="timePickerPopover">
                                        <span class="picker-symbol" aria-hidden="true">◷</span>
                                        <span id="timePickerValue">8:00 PM</span>
                                        <span class="picker-chevron" aria-hidden="true">⌄</span>
                                    </button>
                                    <div class="picker-popover time-popover" id="timePickerPopover" role="dialog" aria-label="Choose event time" hidden>
                                        <strong>Choose time</strong>
                                        <div class="time-columns">
                                            <div><small>HOUR</small><div class="time-options" id="timeHours"></div></div>
                                            <div><small>MINUTE</small><div class="time-options" id="timeMinutes"></div></div>
                                            <div><small>PERIOD</small><div class="period-options" id="timePeriod"></div></div>
                                        </div>
                                        <button class="picker-done" id="timePickerDone" type="button">Done</button>
                                    </div>
                                </div>
                                <div class="invalid-feedback">Choose a time.</div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label class="form-label" for="webinarLink">Webinar link</label>
                            <div class="input-group has-validation">
                                <span class="input-group-text" aria-hidden="true">↗</span>
                                <input class="form-control" type="url" id="webinarLink" name="webinarLink" maxlength="90" value="https://streamgo.in/BemTalk/" placeholder="https://example.com/webinar" required>
                                <div class="invalid-feedback">Enter a complete link starting with http:// or https://.</div>
                            </div>
                        </div>

                        <button class="btn btn-generate w-100" type="submit"><span>Generate posters</span><span aria-hidden="true">→</span></button>
                    </form>

                    <div class="privacy-note" role="note">
                        <span aria-hidden="true">✓</span>
                        <p><strong>Nothing is uploaded or saved.</strong><br>Your details and generated files stay in this browser tab.</p>
                    </div>
                </section>
            </div>

            <div class="col-lg-8">
                <section class="preview-card" aria-labelledby="preview-heading">
                    <div class="preview-toolbar">
                        <div class="editor-heading mb-0">
                            <span class="step-number">2</span>
                            <div><h2 id="preview-heading">Preview &amp; download</h2><p>High-resolution PNG artwork</p></div>
                        </div>
                        <div class="view-switcher" role="group" aria-label="Select preview">
                            <button class="active" type="button" data-preview="landscape">Landscape</button>
                            <button type="button" data-preview="portrait">Portrait</button>
                        </div>
                    </div>

                    <div id="statusMessage" class="status-message" role="status" aria-live="polite">
                        <span class="status-icon">✓</span><span>Preview ready. Edit any field to update it instantly.</span>
                    </div>

                    <div class="poster-stage" id="posterStage" aria-busy="true">
                        <div class="loading-panel"><span class="spinner-border spinner-border-sm" aria-hidden="true"></span>Preparing poster preview…</div>
                        <canvas id="landscapeCanvas" width="1448" height="1086" aria-label="Landscape BemTalk poster preview"></canvas>
                        <canvas id="portraitCanvas" width="1086" height="1448" aria-label="Portrait BemTalk poster preview" hidden></canvas>
                        <a id="posterLinkOverlay" class="poster-link-overlay" href="https://streamgo.in/BemTalk/" target="_blank" rel="noopener noreferrer" aria-label="Open webinar link from the poster" title="Open webinar link" hidden></a>
                    </div>

                    <a id="webinarPreviewLink" class="event-link" href="https://streamgo.in/BemTalk/" target="_blank" rel="noopener noreferrer">
                        <span><small>WEBINAR LINK</small><strong>https://streamgo.in/BemTalk/</strong></span><span aria-hidden="true">↗</span>
                    </a>

                    <div class="download-panel">
                        <div>
                            <span class="download-kicker">DOWNLOAD BOTH FORMATS</span>
                            <h3>Your posters are ready</h3>
                            <p>Download both files together, or choose ZIP or PDF separately.</p>
                        </div>
                        <div class="download-actions">
                            <button class="btn btn-all" id="downloadAll" type="button" disabled>
                                <span class="download-icon" aria-hidden="true">⇊</span><span><strong>Download both</strong><small>ZIP + PDF</small></span>
                            </button>
                            <button class="btn btn-zip" id="downloadZip" type="button" disabled>
                                <span class="download-icon" aria-hidden="true">↓</span><span><strong>Download ZIP</strong><small>2 high-res PNGs</small></span>
                            </button>
                            <button class="btn btn-pdf" id="downloadPdf" type="button" disabled>
                                <span class="download-icon" aria-hidden="true">▤</span><span><strong>Download PDF</strong><small>Portrait only</small></span>
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </main>

    <div class="crop-modal" id="cropModal" role="dialog" aria-modal="true" aria-labelledby="cropModalTitle" hidden>
        <button class="crop-backdrop" type="button" data-crop-cancel aria-label="Close photo cropper"></button>
        <section class="crop-dialog">
            <div class="crop-header">
                <div><span class="eyebrow">SPEAKER PHOTO</span><h2 id="cropModalTitle">Crop and position photo</h2></div>
                <button class="crop-close" type="button" data-crop-cancel aria-label="Close">×</button>
            </div>
            <div class="crop-canvas-wrap">
                <canvas id="cropCanvas" width="500" height="500" aria-label="Photo crop preview"></canvas>
                <span class="crop-drag-hint">Drag to reposition · Scroll to zoom</span>
            </div>
            <label class="zoom-control" for="cropZoom"><span>Zoom</span><input id="cropZoom" type="range" min="1" max="3" value="1" step="0.01"><output id="cropZoomValue">100%</output></label>
            <p class="crop-privacy">The photo is processed in this browser only. It is not uploaded or saved.</p>
            <div class="crop-actions">
                <button class="btn crop-cancel" type="button" data-crop-cancel>Cancel</button>
                <button class="btn crop-apply" id="applyCrop" type="button">Apply photo</button>
            </div>
        </section>
    </div>

    <footer class="container-xl studio-footer"><span>BemTalk Poster Studio</span><span>Generated locally in your browser · No data storage</span></footer>

    <script>
        window.posterStudio = {
            templates: {
                landscape: @json(asset('images/bemtalk-landscape-template.png')),
                portrait: @json(asset('images/bemtalk-portrait-template.png'))
            }
        };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" integrity="sha384-FKyoEForCGlyvwx9Hj09JcYn3nv7wiPVlz7YYwJrWVcXK/BmnVDxM+D2scQbITxI" crossorigin="anonymous"></script>
    <script src="{{ asset('js/poster-studio.js') }}"></script>
</body>
</html>
