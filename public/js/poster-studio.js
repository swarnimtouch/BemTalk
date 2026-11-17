(() => {
    'use strict';

    const form = document.getElementById('posterForm');
    const stage = document.getElementById('posterStage');
    const landscapeCanvas = document.getElementById('landscapeCanvas');
    const portraitCanvas = document.getElementById('portraitCanvas');
    const zipButton = document.getElementById('downloadZip');
    const pdfButton = document.getElementById('downloadPdf');
    const allButton = document.getElementById('downloadAll');
    const statusMessage = document.getElementById('statusMessage');
    const previewLink = document.getElementById('webinarPreviewLink');
    const posterLinkOverlay = document.getElementById('posterLinkOverlay');
    const datePickerButton = document.getElementById('datePickerButton');
    const datePickerPopover = document.getElementById('datePickerPopover');
    const datePickerValue = document.getElementById('datePickerValue');
    const calendarMonth = document.getElementById('calendarMonth');
    const calendarGrid = document.getElementById('calendarGrid');
    const timePickerButton = document.getElementById('timePickerButton');
    const timePickerPopover = document.getElementById('timePickerPopover');
    const timePickerValue = document.getElementById('timePickerValue');
    const specialityCount = document.getElementById('specialityCount');
    const topicCount = document.getElementById('topicCount');
    const speakerPhotoInput = document.getElementById('speakerPhoto');
    const photoUploadPreview = document.getElementById('photoUploadPreview');
    const photoUploadTitle = document.getElementById('photoUploadTitle');
    const removePhotoButton = document.getElementById('removePhoto');
    const cropModal = document.getElementById('cropModal');
    const cropCanvas = document.getElementById('cropCanvas');
    const cropZoom = document.getElementById('cropZoom');
    const cropZoomValue = document.getElementById('cropZoomValue');
    const applyCropButton = document.getElementById('applyCrop');
    const templateImages = {};
    let renderTimer;
    let templatesReady = false;
    let croppedPhotoCanvas = null;
    let portraitLinkBackgroundCanvas = null;
    let pendingPhotoName = '';
    const cropState = { image: null, zoom: 1, offsetX: 0, offsetY: 0, dragging: false, lastX: 0, lastY: 0 };
    const CROP_SIZE = 500;
    const CROP_RADIUS = 220;

    const fields = {
        speakerName: document.getElementById('speakerName'),
        speciality: document.getElementById('speciality'),
        topic: document.getElementById('topic'),
        eventDate: document.getElementById('eventDate'),
        eventTime: document.getElementById('eventTime'),
        webinarLink: document.getElementById('webinarLink')
    };
    const initialDate = new Date(`${fields.eventDate.value}T12:00:00`);
    let calendarView = new Date(initialDate.getFullYear(), initialDate.getMonth(), 1);
    const [initialHours, initialMinutes] = fields.eventTime.value.split(':').map(Number);
    const timeState = {
        hour: initialHours % 12 || 12,
        minute: initialMinutes,
        period: initialHours >= 12 ? 'PM' : 'AM'
    };

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error(`Unable to load poster template: ${src}`));
            image.src = src;
        });
    }

    function cropMetrics() {
        const image = cropState.image;
        const diameter = CROP_RADIUS * 2;
        const baseScale = Math.max((diameter + 4) / image.naturalWidth, (diameter + 4) / image.naturalHeight);
        const scale = baseScale * cropState.zoom;
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;
        return {
            width,
            height,
            x: CROP_SIZE / 2 - width / 2 + cropState.offsetX,
            y: CROP_SIZE / 2 - height / 2 + cropState.offsetY
        };
    }

    function clampCropOffsets() {
        if (!cropState.image) return;
        const diameter = CROP_RADIUS * 2;
        const metrics = cropMetrics();
        const maxX = Math.max(0, (metrics.width - diameter) / 2);
        const maxY = Math.max(0, (metrics.height - diameter) / 2);
        cropState.offsetX = Math.max(-maxX, Math.min(maxX, cropState.offsetX));
        cropState.offsetY = Math.max(-maxY, Math.min(maxY, cropState.offsetY));
    }

    function renderCropPreview() {
        if (!cropState.image) return;
        clampCropOffsets();
        const ctx = cropCanvas.getContext('2d');
        const metrics = cropMetrics();
        ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
        ctx.fillStyle = '#16262e';
        ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);
        ctx.drawImage(cropState.image, metrics.x, metrics.y, metrics.width, metrics.height);
        ctx.save();
        ctx.fillStyle = 'rgba(5, 18, 25, .62)';
        ctx.beginPath();
        ctx.rect(0, 0, CROP_SIZE, CROP_SIZE);
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2, true);
        ctx.fill('evenodd');
        ctx.restore();
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CROP_SIZE / 2, CROP_SIZE / 2 - 13);
        ctx.lineTo(CROP_SIZE / 2, CROP_SIZE / 2 + 13);
        ctx.moveTo(CROP_SIZE / 2 - 13, CROP_SIZE / 2);
        ctx.lineTo(CROP_SIZE / 2 + 13, CROP_SIZE / 2);
        ctx.strokeStyle = 'rgba(255,255,255,.55)';
        ctx.lineWidth = 1;
        ctx.stroke();
        cropZoomValue.textContent = `${Math.round(cropState.zoom * 100)}%`;
    }

    function openCropModal(image, fileName) {
        cropState.image = image;
        cropState.zoom = 1;
        cropState.offsetX = 0;
        cropState.offsetY = 0;
        pendingPhotoName = fileName;
        cropZoom.value = '1';
        cropModal.hidden = false;
        document.body.classList.add('crop-open');
        renderCropPreview();
        applyCropButton.focus();
    }

    function closeCropModal(resetInput = true) {
        cropModal.hidden = true;
        document.body.classList.remove('crop-open');
        cropState.dragging = false;
        cropCanvas.classList.remove('is-dragging');
        if (resetInput) speakerPhotoInput.value = '';
    }

    function createCroppedPhoto() {
        const output = document.createElement('canvas');
        output.width = 700;
        output.height = 700;
        const ctx = output.getContext('2d');
        ctx.fillStyle = '#e8edef';
        ctx.fillRect(0, 0, output.width, output.height);
        const metrics = cropMetrics();
        const cropLeft = CROP_SIZE / 2 - CROP_RADIUS;
        const cropTop = CROP_SIZE / 2 - CROP_RADIUS;
        const scale = output.width / (CROP_RADIUS * 2);
        ctx.drawImage(
            cropState.image,
            (metrics.x - cropLeft) * scale,
            (metrics.y - cropTop) * scale,
            metrics.width * scale,
            metrics.height * scale
        );
        return output;
    }

    function drawSpeakerPhoto(ctx, format) {
        if (!croppedPhotoCanvas) return;
        const area = format === 'landscape'
            ? { x: 437, y: 536, radius: 137 }
            : { x: 543, y: 707, radius: 142 };
        ctx.save();
        ctx.beginPath();
        ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = '#e8edef';
        ctx.fillRect(area.x - area.radius, area.y - area.radius, area.radius * 2, area.radius * 2);
        ctx.drawImage(croppedPhotoCanvas, area.x - area.radius - 2, area.y - area.radius - 2, area.radius * 2 + 4, area.radius * 2 + 4);
        ctx.restore();
    }

    function values() {
        return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value.trim()]));
    }

    function updateCharacterCounts() {
        specialityCount.textContent = `${fields.speciality.value.length}/220`;
        topicCount.textContent = `${fields.topic.value.length}/180`;
    }

    function ordinal(day) {
        const mod100 = day % 100;
        if (mod100 >= 11 && mod100 <= 13) return `${day}th`;
        return `${day}${({ 1: 'st', 2: 'nd', 3: 'rd' })[day % 10] || 'th'}`;
    }

    function formattedDate(dateString) {
        if (!dateString) return { weekday: '', date: '' };
        const date = new Date(`${dateString}T12:00:00`);
        if (Number.isNaN(date.getTime())) return { weekday: '', date: '' };
        const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
        const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
        return { weekday, date: `${ordinal(date.getDate())} ${month} ${date.getFullYear()}` };
    }

    function formattedTime(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return '';
        const suffix = hours >= 12 ? 'PM' : 'AM';
        const hour = hours % 12 || 12;
        return `${hour}:${String(minutes).padStart(2, '0')} ${suffix}`;
    }

    function isoDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function pickerDateLabel(dateString) {
        const date = new Date(`${dateString}T12:00:00`);
        return new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(date);
    }

    function closePickers(except = null) {
        [[datePickerButton,datePickerPopover],[timePickerButton,timePickerPopover]].forEach(([button,popover]) => {
            if (popover !== except) {
                popover.hidden = true;
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function renderCalendar() {
        const selected = new Date(`${fields.eventDate.value}T12:00:00`);
        const today = new Date();
        calendarMonth.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(calendarView);
        calendarGrid.replaceChildren();
        const firstVisible = new Date(calendarView.getFullYear(), calendarView.getMonth(), 1 - calendarView.getDay());
        for (let index = 0; index < 42; index += 1) {
            const date = new Date(firstVisible.getFullYear(), firstVisible.getMonth(), firstVisible.getDate() + index);
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = date.getDate();
            button.setAttribute('aria-label', new Intl.DateTimeFormat('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date));
            button.classList.toggle('is-muted', date.getMonth() !== calendarView.getMonth());
            button.classList.toggle('is-today', isoDate(date) === isoDate(today));
            button.classList.toggle('is-selected', isoDate(date) === isoDate(selected));
            button.addEventListener('click', () => {
                fields.eventDate.value = isoDate(date);
                datePickerValue.textContent = pickerDateLabel(fields.eventDate.value);
                calendarView = new Date(date.getFullYear(), date.getMonth(), 1);
                fields.eventDate.dispatchEvent(new Event('input', { bubbles: true }));
                renderCalendar();
                closePickers();
                datePickerButton.focus();
            });
            calendarGrid.appendChild(button);
        }
    }

    function updateTimeValue() {
        let hours = timeState.hour % 12;
        if (timeState.period === 'PM') hours += 12;
        fields.eventTime.value = `${String(hours).padStart(2, '0')}:${String(timeState.minute).padStart(2, '0')}`;
        timePickerValue.textContent = formattedTime(fields.eventTime.value);
        fields.eventTime.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function buildTimeOptions() {
        const hours = document.getElementById('timeHours');
        const minutes = document.getElementById('timeMinutes');
        const periods = document.getElementById('timePeriod');
        hours.replaceChildren();
        minutes.replaceChildren();
        periods.replaceChildren();
        for (let hour = 1; hour <= 12; hour += 1) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = hour;
            button.classList.toggle('is-selected', hour === timeState.hour);
            button.addEventListener('click', () => { timeState.hour = hour; buildTimeOptions(); updateTimeValue(); });
            hours.appendChild(button);
        }
        for (let minute = 0; minute < 60; minute += 5) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = String(minute).padStart(2, '0');
            button.classList.toggle('is-selected', minute === timeState.minute);
            button.addEventListener('click', () => { timeState.minute = minute; buildTimeOptions(); updateTimeValue(); });
            minutes.appendChild(button);
        }
        ['AM','PM'].forEach(period => {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = period;
            button.classList.toggle('is-selected', period === timeState.period);
            button.addEventListener('click', () => { timeState.period = period; buildTimeOptions(); updateTimeValue(); });
            periods.appendChild(button);
        });
    }

    function fontString(size, weight = 700, family = 'Arial, sans-serif') {
        return `${weight} ${size}px ${family}`;
    }

    function fitFont(ctx, text, maxWidth, startSize, minSize, weight = 700, family = 'Arial, sans-serif') {
        let size = startSize;
        while (size > minSize) {
            ctx.font = fontString(size, weight, family);
            if (ctx.measureText(text).width <= maxWidth) break;
            size -= 1;
        }
        return size;
    }

    function drawFitted(ctx, text, x, y, maxWidth, startSize, minSize, options = {}) {
        const weight = options.weight || 700;
        const family = options.family || 'Arial, sans-serif';
        const size = fitFont(ctx, text, maxWidth, startSize, minSize, weight, family);
        ctx.save();
        ctx.fillStyle = options.color || '#111827';
        ctx.textAlign = options.align || 'left';
        ctx.textBaseline = 'top';
        ctx.font = fontString(size, weight, family);
        ctx.fillText(text, x, y);
        ctx.restore();
        return size;
    }

    function wrapText(ctx, text, maxWidth, maxLines = 2) {
        const explicitLines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
        const lines = [];
        explicitLines.forEach(part => {
            const words = part.split(/\s+/);
            let current = '';
            words.forEach(word => {
                const test = current ? `${current} ${word}` : word;
                if (current && ctx.measureText(test).width > maxWidth) {
                    lines.push(current);
                    current = word;
                } else {
                    current = test;
                }
            });
            if (current) lines.push(current);
        });
        if (lines.length <= maxLines) return lines;
        const kept = lines.slice(0, maxLines - 1);
        kept.push(lines.slice(maxLines - 1).join(' '));
        return kept;
    }

    function drawWrapped(ctx, text, x, y, maxWidth, startSize, minSize, options = {}) {
        let size = startSize;
        let lines = [];
        const weight = options.weight || 500;
        const family = options.family || 'Arial, sans-serif';
        while (size >= minSize) {
            ctx.font = fontString(size, weight, family);
            lines = wrapText(ctx, text, maxWidth, options.maxLines || 2);
            const blockHeight = lines.length * size * (options.lineHeight || 1.12);
            if (lines.every(line => ctx.measureText(line).width <= maxWidth) && (!options.maxHeight || blockHeight <= options.maxHeight)) break;
            size -= 1;
        }
        ctx.save();
        ctx.fillStyle = options.color || '#161616';
        ctx.textAlign = options.align || 'left';
        ctx.textBaseline = 'top';
        ctx.font = fontString(size, weight, family);
        const lineHeight = size * (options.lineHeight || 1.12);
        const blockHeight = lines.length * lineHeight;
        const startY = options.boxHeight ? y + Math.max(0, (options.boxHeight - blockHeight) / 2) : y;
        lines.forEach((line, index) => ctx.fillText(line, x, startY + index * lineHeight));
        ctx.restore();
    }

    function cleanArea(ctx, x, y, width, height, color = '#ffffff') {
        ctx.save();
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }

    function roundedRectangle(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function portraitLinkBackground() {
        if (portraitLinkBackgroundCanvas) return portraitLinkBackgroundCanvas;
        const width = 730;
        const height = 118;
        const source = document.createElement('canvas');
        source.width = portraitCanvas.width;
        source.height = portraitCanvas.height;
        const sourceContext = source.getContext('2d');
        sourceContext.drawImage(templateImages.portrait, 0, 0);
        const top = sourceContext.getImageData(180, 1164, width, 1).data;
        const bottom = sourceContext.getImageData(180, 1282, width, 1).data;
        const output = document.createElement('canvas');
        output.width = width;
        output.height = height;
        const outputContext = output.getContext('2d');
        const pixels = outputContext.createImageData(width, height);
        for (let y = 0; y < height; y += 1) {
            const mix = y / (height - 1);
            for (let x = 0; x < width; x += 1) {
                const sourceIndex = x * 4;
                const targetIndex = (y * width + x) * 4;
                pixels.data[targetIndex] = Math.round(top[sourceIndex] * (1 - mix) + bottom[sourceIndex] * mix);
                pixels.data[targetIndex + 1] = Math.round(top[sourceIndex + 1] * (1 - mix) + bottom[sourceIndex + 1] * mix);
                pixels.data[targetIndex + 2] = Math.round(top[sourceIndex + 2] * (1 - mix) + bottom[sourceIndex + 2] * mix);
                pixels.data[targetIndex + 3] = 255;
            }
        }
        outputContext.putImageData(pixels, 0, 0);
        portraitLinkBackgroundCanvas = output;
        return output;
    }

    function drawPortraitWebinarLink(ctx, link) {
        // Replace the original boxed section with the clean treatment from the reference PDF.
        ctx.drawImage(portraitLinkBackground(), 180, 1168);

        ctx.save();
        ctx.strokeStyle = '#ed1c24';
        ctx.lineWidth = 2;
        roundedRectangle(ctx, 222, 1196, 640, 64, 16);
        ctx.stroke();

        ctx.fillStyle = '#df111a';
        roundedRectangle(ctx, 462, 1178, 162, 32, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.font = fontString(25, 800, 'Arial Narrow, Arial, sans-serif');
        ctx.fillText('Webinar Link:', 543, 1180);
        ctx.restore();

        drawFitted(ctx, link, 532, 1214, 525, 28, 16, { align: 'center', color: '#10131a', weight: 800, family: 'Arial Narrow, Arial, sans-serif' });
        ctx.drawImage(templateImages.portrait, 800, 1204, 82, 62, 800, 1204, 82, 62);
    }

    function drawLandscape(data) {
        const ctx = landscapeCanvas.getContext('2d');
        ctx.clearRect(0, 0, landscapeCanvas.width, landscapeCanvas.height);
        ctx.drawImage(templateImages.landscape, 0, 0, landscapeCanvas.width, landscapeCanvas.height);
        drawSpeakerPhoto(ctx, 'landscape');

        cleanArea(ctx, 124, 273, 1205, 54);
        cleanArea(ctx, 606, 451, 680, 52);
        cleanArea(ctx, 606, 507, 690, 112);
        cleanArea(ctx, 480, 747, 247, 82);
        cleanArea(ctx, 878, 747, 190, 82);

        drawWrapped(ctx, `Topic: ${data.topic}`, 724, 273, 1188, 42, 12, { align: 'center', boxHeight: 54, color: '#df0c16', maxLines: 3, maxHeight: 54, weight: 800, lineHeight: 1, family: 'Arial Narrow, Arial, sans-serif' });
        drawWrapped(ctx, data.speakerName, 608, 453, 660, 45, 14, { color: '#df0c16', maxLines: 2, maxHeight: 52, weight: 800, lineHeight: 1 });
        drawWrapped(ctx, data.speciality, 610, 510, 650, 30, 12, { maxLines: 4, maxHeight: 105, weight: 500, lineHeight: 1.02 });

        const date = formattedDate(data.eventDate);
        drawFitted(ctx, `Date: ${date.weekday},`, 482, 751, 240, 28, 16, { color: '#050505', weight: 800 });
        drawFitted(ctx, date.date, 482, 787, 238, 28, 19, { color: '#050505', weight: 800 });
        drawFitted(ctx, 'Time:', 880, 751, 170, 28, 20, { color: '#050505', weight: 800 });
        drawFitted(ctx, formattedTime(data.eventTime), 880, 787, 180, 28, 19, { color: '#050505', weight: 800 });
    }

    function drawPortrait(data) {
        const ctx = portraitCanvas.getContext('2d');
        ctx.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);
        ctx.drawImage(templateImages.portrait, 0, 0, portraitCanvas.width, portraitCanvas.height);
        drawSpeakerPhoto(ctx, 'portrait');

        cleanArea(ctx, 91, 443, 914, 48);
        cleanArea(ctx, 278, 871, 530, 55);
        cleanArea(ctx, 240, 932, 620, 67);
        cleanArea(ctx, 314, 1065, 218, 78);
        cleanArea(ctx, 681, 1065, 170, 78);

        drawWrapped(ctx, `Topic: ${data.topic}`, 543, 443, 898, 35, 11, { align: 'center', boxHeight: 48, color: '#df0c16', maxLines: 3, maxHeight: 48, weight: 800, lineHeight: 1, family: 'Arial Narrow, Arial, sans-serif' });
        drawWrapped(ctx, data.speakerName, 543, 872, 520, 44, 14, { align: 'center', color: '#df0c16', maxLines: 2, maxHeight: 44, weight: 800, lineHeight: 1 });
        drawWrapped(ctx, data.speciality, 543, 920, 600, 20, 10, { align: 'center', maxLines: 4, maxHeight: 62, weight: 500, lineHeight: 1 });

        const date = formattedDate(data.eventDate);
        drawFitted(ctx, `Date: ${date.weekday},`, 319, 1069, 211, 25, 14, { color: '#050505', weight: 800 });
        drawFitted(ctx, date.date, 319, 1105, 210, 27, 18, { color: '#050505', weight: 800 });
        drawFitted(ctx, 'Time:', 685, 1069, 160, 27, 20, { color: '#050505', weight: 800 });
        drawFitted(ctx, formattedTime(data.eventTime), 685, 1105, 160, 27, 18, { color: '#050505', weight: 800 });
        drawPortraitWebinarLink(ctx, data.webinarLink);
    }

    function setStatus(message, isError = false) {
        statusMessage.classList.toggle('is-error', isError);
        statusMessage.querySelector('.status-icon').textContent = isError ? '!' : '✓';
        statusMessage.querySelector('span:last-child').textContent = message;
    }

    function positionPosterLinkOverlay() {
        if (portraitCanvas.hidden || posterLinkOverlay.hidden) return;
        const canvasBox = portraitCanvas.getBoundingClientRect();
        const stageBox = stage.getBoundingClientRect();
        const scaleX = canvasBox.width / portraitCanvas.width;
        const scaleY = canvasBox.height / portraitCanvas.height;
        posterLinkOverlay.style.left = `${canvasBox.left - stageBox.left + 210 * scaleX}px`;
        posterLinkOverlay.style.top = `${canvasBox.top - stageBox.top + 1180 * scaleY}px`;
        posterLinkOverlay.style.width = `${680 * scaleX}px`;
        posterLinkOverlay.style.height = `${95 * scaleY}px`;
    }

    function render(showMessage = false) {
        if (!templatesReady) return;
        const data = values();
        drawLandscape(data);
        drawPortrait(data);
        const clickableLink = safeHttpLink(data.webinarLink);
        previewLink.href = clickableLink || '#';
        previewLink.querySelector('strong').textContent = data.webinarLink || 'No webinar link entered';
        posterLinkOverlay.href = clickableLink || '#';
        posterLinkOverlay.hidden = portraitCanvas.hidden || !clickableLink;
        stage.classList.add('ready');
        stage.setAttribute('aria-busy', 'false');
        zipButton.disabled = false;
        pdfButton.disabled = false;
        allButton.disabled = false;
        window.requestAnimationFrame(positionPosterLinkOverlay);
        if (showMessage) setStatus('Both posters were generated successfully.');
    }

    function scheduleRender() {
        window.clearTimeout(renderTimer);
        renderTimer = window.setTimeout(() => render(false), 120);
    }

    function canvasBlob(canvas, type = 'image/png', quality) {
        return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the requested file.')), type, quality));
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    }

    function crc32(bytes) {
        let crc = 0xffffffff;
        for (const byte of bytes) {
            crc ^= byte;
            for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    function u16(value) { return new Uint8Array([value & 255, (value >>> 8) & 255]); }
    function u32(value) { return new Uint8Array([value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255]); }
    function concatBytes(parts) {
        const size = parts.reduce((sum, part) => sum + part.length, 0);
        const output = new Uint8Array(size);
        let offset = 0;
        for (const part of parts) { output.set(part, offset); offset += part.length; }
        return output;
    }

    async function buildZip(files) {
        const encoder = new TextEncoder();
        const localParts = [];
        const centralParts = [];
        let offset = 0;
        for (const file of files) {
            const name = encoder.encode(file.name);
            const data = new Uint8Array(await file.blob.arrayBuffer());
            const checksum = crc32(data);
            const local = concatBytes([u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(checksum),u32(data.length),u32(data.length),u16(name.length),u16(0),name,data]);
            const central = concatBytes([u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(checksum),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]);
            localParts.push(local);
            centralParts.push(central);
            offset += local.length;
        }
        const centralDirectory = concatBytes(centralParts);
        const end = concatBytes([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralDirectory.length),u32(offset),u16(0)]);
        return new Blob([...localParts, centralDirectory, end], { type: 'application/zip' });
    }

    function ascii(text) { return new TextEncoder().encode(text); }

    function safeHttpLink(value) {
        try {
            const url = new URL(value);
            return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
        } catch { return ''; }
    }

    function pdfString(value) {
        return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
    }

    async function buildPdf(canvas, webinarLink) {
        const pageWidth = 631.42;
        const pageHeight = 841.89;
        const objects = new Map();
        const jpeg = await canvasBlob(canvas, 'image/jpeg', 0.94);
        const image = new Uint8Array(await jpeg.arrayBuffer());
        const content = ascii(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im1 Do\nQ\n`);
        const annotation = webinarLink ? ' /Annots [6 0 R]' : '';

        objects.set(1, ascii('<< /Type /Catalog /Pages 2 0 R >>'));
        objects.set(2, ascii('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'));
        objects.set(3, ascii(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R${annotation} >>`));
        objects.set(4, concatBytes([ascii(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`),image,ascii('\nendstream')]));
        objects.set(5, concatBytes([ascii(`<< /Length ${content.length} >>\nstream\n`),content,ascii('endstream')]));
        objects.set(6, webinarLink
            ? ascii(`<< /Type /Annot /Subtype /Link /Rect [122 100 518 156] /Border [0 0 0] /A << /S /URI /URI (${pdfString(webinarLink)}) >> >>`)
            : ascii('<< >>'));

        const header = concatBytes([ascii('%PDF-1.4\n%'),new Uint8Array([0xe2,0xe3,0xcf,0xd3]),ascii('\n')]);
        const body = [header];
        const offsets = [0];
        let offset = header.length;
        for (let id = 1; id <= 6; id += 1) {
            offsets[id] = offset;
            const object = concatBytes([ascii(`${id} 0 obj\n`),objects.get(id),ascii('\nendobj\n')]);
            body.push(object);
            offset += object.length;
        }
        const xrefOffset = offset;
        const xrefLines = ['xref','0 7','0000000000 65535 f '];
        for (let id = 1; id <= 6; id += 1) xrefLines.push(`${String(offsets[id]).padStart(10,'0')} 00000 n `);
        body.push(ascii(`${xrefLines.join('\n')}\ntrailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
        return new Blob(body, { type: 'application/pdf' });
    }

    async function createZipFile() {
        const landscape = await canvasBlob(landscapeCanvas);
        const portrait = await canvasBlob(portraitCanvas);
        return buildZip([{ name: 'bemtalk-landscape.png', blob: landscape },{ name: 'bemtalk-portrait.png', blob: portrait }]);
    }

    async function createPdfFile() {
        return buildPdf(portraitCanvas, safeHttpLink(fields.webinarLink.value.trim()));
    }

    function validateLinkClick(event) {
        if (safeHttpLink(fields.webinarLink.value.trim())) return;
        event.preventDefault();
        setStatus('Enter a complete http:// or https:// webinar link first.', true);
        fields.webinarLink.focus();
    }

    datePickerButton.addEventListener('click', () => {
        const willOpen = datePickerPopover.hidden;
        closePickers(willOpen ? datePickerPopover : null);
        datePickerPopover.hidden = !willOpen;
        datePickerButton.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) renderCalendar();
    });
    document.getElementById('calendarPrevious').addEventListener('click', () => {
        calendarView = new Date(calendarView.getFullYear(), calendarView.getMonth() - 1, 1);
        renderCalendar();
    });
    document.getElementById('calendarNext').addEventListener('click', () => {
        calendarView = new Date(calendarView.getFullYear(), calendarView.getMonth() + 1, 1);
        renderCalendar();
    });
    document.getElementById('calendarToday').addEventListener('click', () => {
        const today = new Date();
        fields.eventDate.value = isoDate(today);
        datePickerValue.textContent = pickerDateLabel(fields.eventDate.value);
        calendarView = new Date(today.getFullYear(), today.getMonth(), 1);
        fields.eventDate.dispatchEvent(new Event('input', { bubbles: true }));
        closePickers();
    });
    timePickerButton.addEventListener('click', () => {
        const willOpen = timePickerPopover.hidden;
        closePickers(willOpen ? timePickerPopover : null);
        timePickerPopover.hidden = !willOpen;
        timePickerButton.setAttribute('aria-expanded', String(willOpen));
        if (willOpen) buildTimeOptions();
    });
    document.getElementById('timePickerDone').addEventListener('click', () => {
        closePickers();
        timePickerButton.focus();
    });
    document.addEventListener('click', event => {
        if (!event.target.closest('.picker-shell')) closePickers();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closePickers();
            if (!cropModal.hidden) closeCropModal();
        }
    });
    previewLink.addEventListener('click', validateLinkClick);
    posterLinkOverlay.addEventListener('click', validateLinkClick);
    datePickerValue.textContent = pickerDateLabel(fields.eventDate.value);
    timePickerValue.textContent = formattedTime(fields.eventTime.value);
    renderCalendar();
    buildTimeOptions();

    speakerPhotoInput.addEventListener('change', () => {
        const file = speakerPhotoInput.files?.[0];
        if (!file) return;
        if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
            setStatus('Choose a JPG, PNG or WebP photo.', true);
            speakerPhotoInput.value = '';
            return;
        }
        if (file.size > 15 * 1024 * 1024) {
            setStatus('The speaker photo must be smaller than 15 MB.', true);
            speakerPhotoInput.value = '';
            return;
        }
        const image = new Image();
        const objectUrl = URL.createObjectURL(file);
        image.onload = () => {
            URL.revokeObjectURL(objectUrl);
            openCropModal(image, file.name);
        };
        image.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            setStatus('That photo could not be opened. Please choose another image.', true);
            speakerPhotoInput.value = '';
        };
        image.src = objectUrl;
    });

    cropZoom.addEventListener('input', () => {
        cropState.zoom = Number(cropZoom.value);
        renderCropPreview();
    });
    cropCanvas.addEventListener('wheel', event => {
        event.preventDefault();
        const direction = event.deltaY < 0 ? 1 : -1;
        cropState.zoom = Math.max(1, Math.min(3, cropState.zoom + direction * 0.08));
        cropZoom.value = String(cropState.zoom);
        renderCropPreview();
    }, { passive: false });
    cropCanvas.addEventListener('pointerdown', event => {
        cropState.dragging = true;
        const rect = cropCanvas.getBoundingClientRect();
        cropState.lastX = (event.clientX - rect.left) * (CROP_SIZE / rect.width);
        cropState.lastY = (event.clientY - rect.top) * (CROP_SIZE / rect.height);
        cropCanvas.setPointerCapture(event.pointerId);
        cropCanvas.classList.add('is-dragging');
    });
    cropCanvas.addEventListener('pointermove', event => {
        if (!cropState.dragging) return;
        const rect = cropCanvas.getBoundingClientRect();
        const x = (event.clientX - rect.left) * (CROP_SIZE / rect.width);
        const y = (event.clientY - rect.top) * (CROP_SIZE / rect.height);
        cropState.offsetX += x - cropState.lastX;
        cropState.offsetY += y - cropState.lastY;
        cropState.lastX = x;
        cropState.lastY = y;
        renderCropPreview();
    });
    const stopCropDrag = event => {
        cropState.dragging = false;
        cropCanvas.classList.remove('is-dragging');
        if (event.pointerId !== undefined && cropCanvas.hasPointerCapture(event.pointerId)) cropCanvas.releasePointerCapture(event.pointerId);
    };
    cropCanvas.addEventListener('pointerup', stopCropDrag);
    cropCanvas.addEventListener('pointercancel', stopCropDrag);
    document.querySelectorAll('[data-crop-cancel]').forEach(button => button.addEventListener('click', () => closeCropModal()));
    applyCropButton.addEventListener('click', () => {
        croppedPhotoCanvas = createCroppedPhoto();
        photoUploadPreview.textContent = '';
        photoUploadPreview.style.backgroundImage = `url(${croppedPhotoCanvas.toDataURL('image/jpeg', .82)})`;
        photoUploadTitle.textContent = pendingPhotoName || 'Speaker photo selected';
        removePhotoButton.hidden = false;
        closeCropModal(true);
        render(false);
        setStatus('The cropped speaker photo was applied to both posters.');
    });
    removePhotoButton.addEventListener('click', () => {
        croppedPhotoCanvas = null;
        speakerPhotoInput.value = '';
        photoUploadPreview.style.backgroundImage = '';
        photoUploadPreview.textContent = '+';
        photoUploadTitle.textContent = 'Choose a photo';
        removePhotoButton.hidden = true;
        render(false);
        setStatus('The original speaker photo was restored.');
    });

    form.addEventListener('submit', event => {
        event.preventDefault();
        form.classList.add('was-validated');
        if (!form.checkValidity()) {
            setStatus('Please complete the highlighted fields before generating.', true);
            form.querySelector(':invalid')?.focus();
            return;
        }
        render(true);
        document.getElementById('preview-heading').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    form.addEventListener('input', () => {
        updateCharacterCounts();
        scheduleRender();
    });
    updateCharacterCounts();

    document.querySelectorAll('[data-preview]').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('[data-preview]').forEach(item => item.classList.toggle('active', item === button));
            const showLandscape = button.dataset.preview === 'landscape';
            landscapeCanvas.hidden = !showLandscape;
            portraitCanvas.hidden = showLandscape;
            posterLinkOverlay.hidden = showLandscape || !safeHttpLink(fields.webinarLink.value.trim());
            window.requestAnimationFrame(positionPosterLinkOverlay);
        });
    });

    if (new URLSearchParams(window.location.search).get('preview') === 'portrait') {
        document.querySelector('[data-preview="portrait"]').click();
    }

    window.addEventListener('resize', () => window.requestAnimationFrame(positionPosterLinkOverlay));

    zipButton.addEventListener('click', async () => {
        try {
            zipButton.disabled = true;
            setStatus('Preparing the ZIP file…');
            const zip = await createZipFile();
            downloadBlob(zip, 'bemtalk-posters.zip');
            setStatus('ZIP downloaded with both high-resolution PNG posters.');
        } catch (error) {
            setStatus(error.message || 'The ZIP could not be created.', true);
        } finally { zipButton.disabled = false; }
    });

    pdfButton.addEventListener('click', async () => {
        try {
            pdfButton.disabled = true;
            setStatus('Preparing the portrait PDF…');
            const pdf = await createPdfFile();
            downloadBlob(pdf, 'bemtalk-portrait.pdf');
            setStatus('Portrait PDF downloaded successfully.');
        } catch (error) {
            setStatus(error.message || 'The PDF could not be created.', true);
        } finally { pdfButton.disabled = false; }
    });

    allButton.addEventListener('click', async () => {
        try {
            allButton.disabled = true;
            zipButton.disabled = true;
            pdfButton.disabled = true;
            setStatus('Preparing both PNGs in ZIP and the portrait PDF…');
            const [zip,pdf] = await Promise.all([createZipFile(),createPdfFile()]);
            downloadBlob(zip, 'bemtalk-posters.zip');
            window.setTimeout(() => downloadBlob(pdf, 'bemtalk-portrait.pdf'), 250);
            setStatus('Both files are ready. Your browser may ask to allow multiple downloads.');
        } catch (error) {
            setStatus(error.message || 'The files could not be created.', true);
        } finally {
            allButton.disabled = false;
            zipButton.disabled = false;
            pdfButton.disabled = false;
        }
    });

    Promise.all([loadImage(window.posterStudio.templates.landscape),loadImage(window.posterStudio.templates.portrait)])
        .then(([landscape,portrait]) => {
            templateImages.landscape = landscape;
            templateImages.portrait = portrait;
            templatesReady = true;
            render(false);
        })
        .catch(error => {
            stage.classList.add('ready');
            stage.setAttribute('aria-busy','false');
            setStatus(error.message,true);
        });
})();
