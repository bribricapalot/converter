// ==========================================
// 1. API BASE URL CONFIGURATION
// ==========================================
// Erkennt automatisch, ob du lokal testest oder auf GitHub Pages / Render bist
const API_BASE_URL = (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.protocol === 'file:'
) 
? 'http://127.0.0.1:8000' 
: 'https://flowhub-backend.onrender.com'; // <-- ERSETZE DAS durch deine echte Render-URL!

// ==========================================
// 2. SOCIAL MEDIA DOWNLOADER LOGIC
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const downloadBtn = document.getElementById('download-btn');
    const urlInput = document.getElementById('media-url');
    const platformSelect = document.getElementById('platform-select');
    const formatSelect = document.getElementById('format-select');
    const resolutionSelect = document.getElementById('resolution-select');
    const statusMessage = document.getElementById('download-status');

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            const url = urlInput.value.trim();
            const platform = platformSelect ? platformSelect.value : 'auto';
            const format = formatSelect ? formatSelect.value : 'mp4';
            const resolution = resolutionSelect ? resolutionSelect.value : '1080';

            if (!url) {
                showStatus(statusMessage, 'Bitte gib eine gültige URL ein.', 'error');
                return;
            }

            showStatus(statusMessage, 'Download wird gestartet... Bitte warten.', 'info');
            downloadBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/api/download`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        url: url,
                        platform: platform,
                        format: format,
                        resolution: resolution
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Fehler beim Download.');
                }

                // Dateidownload im Browser auslösen
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                
                // Dateinamen aus Response-Header auslesen oder Standard festlegen
                const contentDisposition = response.headers.get('Content-Disposition');
                let fileName = `download.${format}`;
                if (contentDisposition && contentDisposition.includes('filename=')) {
                    fileName = contentDisposition.split('filename=')[1].replace(/"/g, '');
                }
                
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);

                showStatus(statusMessage, 'Download erfolgreich abgeschlossen!', 'success');
            } catch (error) {
                console.error('Download-Fehler:', error);
                showStatus(statusMessage, `Fehler: ${error.message}`, 'error');
            } finally {
                downloadBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // 3. FILE CONVERTER LOGIC
    // ==========================================
    const convertBtn = document.getElementById('convert-btn');
    const fileInput = document.getElementById('file-input');
    const sourceFormatSelect = document.getElementById('source-format');
    const targetFormatSelect = document.getElementById('target-format');
    const convertStatusMessage = document.getElementById('convert-status');

    if (convertBtn) {
        convertBtn.addEventListener('click', async () => {
            const file = fileInput ? fileInput.files[0] : null;
            const targetFormat = targetFormatSelect ? targetFormatSelect.value : 'docx';

            if (!file) {
                showStatus(convertStatusMessage, 'Bitte wähle zuerst eine Datei aus.', 'error');
                return;
            }

            showStatus(convertStatusMessage, 'Datei wird konvertiert... Das kann einen Moment dauern.', 'info');
            convertBtn.disabled = true;

            const formData = new FormData();
            formData.append('file', file);
            formData.append('target_format', targetFormat);

            try {
                const response = await fetch(`${API_BASE_URL}/api/convert`, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.detail || 'Konvertierung fehlgeschlagen.');
                }

                // Konvertierte Datei herunterladen
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = `converted_file.${targetFormat}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(downloadUrl);

                showStatus(convertStatusMessage, 'Konvertierung erfolgreich!', 'success');
            } catch (error) {
                console.error('Konvertierungs-Fehler:', error);
                showStatus(convertStatusMessage, `Fehler: ${error.message}`, 'error');
            } finally {
                convertBtn.disabled = false;
            }
        });
    }
});

// ==========================================
// 4. HELPER FUNCTIONS
// ==========================================
function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `status-message ${type}`;
    element.style.display = 'block';
}