const BACKEND_URL = "http://127.0.0.1:8000";

const formatMappings = {
  'DOCX': ['PDF', 'TXT'],
  'PDF': ['DOCX', 'PNG', 'TXT'],
  'JPG': ['PDF', 'PNG'],
  'PNG': ['PDF', 'JPG'],
  'MP3': ['WAV', 'MP4'],
  'MP4': ['MP3', 'MOV', 'AVI'],
  'WAV': ['MP3', 'FLAC'],
  'MOV': ['MP4', 'MP3']
};

let uploadedFile = null;

// Tab Switcher
function switchTab(tabName) {
  const socialSec = document.getElementById('section-social');
  const converterSec = document.getElementById('section-converter');
  const socialTabBtn = document.getElementById('tab-social');
  const converterTabBtn = document.getElementById('tab-converter');

  if (tabName === 'social') {
    socialSec.classList.remove('hidden');
    converterSec.classList.add('hidden');
    socialTabBtn.classList.add('active-tab');
    converterTabBtn.classList.remove('active-tab');
  } else {
    converterSec.classList.remove('hidden');
    socialSec.classList.add('hidden');
    converterTabBtn.classList.add('active-tab');
    socialTabBtn.classList.remove('active-tab');
  }
}

// Populate Converter Dropdowns
function initConverterDropdowns() {
  const fromSelect = document.getElementById('convert-from');
  fromSelect.innerHTML = '';

  Object.keys(formatMappings).forEach(format => {
    const opt = document.createElement('option');
    opt.value = format;
    opt.textContent = format;
    fromSelect.appendChild(opt);
  });

  updateToDropdown();
}

function updateToDropdown() {
  const fromValue = document.getElementById('convert-from').value;
  const toSelect = document.getElementById('convert-to');
  toSelect.innerHTML = '';

  const targets = formatMappings[fromValue] || [];
  targets.forEach(target => {
    const opt = document.createElement('option');
    opt.value = target;
    opt.textContent = target;
    toSelect.appendChild(opt);
  });
}

function toggleResolutions(platform) {
  const formatSelect = document.getElementById(`${platform}-format`);
  const resContainer = document.getElementById(`${platform}-res-container`);
  if (formatSelect && resContainer) {
    if (formatSelect.value === 'mp3') {
      resContainer.classList.add('opacity-50', 'pointer-events-none');
    } else {
      resContainer.classList.remove('opacity-50', 'pointer-events-none');
    }
  }
}

// Drag & Drop Setup
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');

if (dropzone) {
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dropzone-active'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dropzone-active'));
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dropzone-active');
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files[0]);
  });
}

function handleFileSelect(event) {
  if (event.target.files.length > 0) handleFiles(event.target.files[0]);
}

function handleFiles(file) {
  uploadedFile = file;
  document.getElementById('selected-file-name').textContent = file.name;
  document.getElementById('selected-file-display').classList.remove('hidden');

  const ext = file.name.split('.').pop().toUpperCase();
  const fromSelect = document.getElementById('convert-from');
  if (formatMappings[ext]) {
    fromSelect.value = ext;
    updateToDropdown();
  }
}

// Backend Integration
async function processSocialDownload(platform, urlInputId, formatSelectId, resolutionSelectId) {
  const url = document.getElementById(urlInputId).value.trim();
  if (!url) {
    alert("Bitte gib eine gültige URL ein!");
    return;
  }

  const format = formatSelectId ? document.getElementById(formatSelectId).value : 'mp3';
  const resolution = resolutionSelectId ? document.getElementById(resolutionSelectId).value : '1080';

  openModal(`${platform} Download`, `Verbindung zum Backend herstellen...`);

  try {
    const response = await fetch(`${BACKEND_URL}/api/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, platform, format, resolution })
    });

    if (!response.ok) throw new Error("Fehler beim Herunterladen!");

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${platform.toLowerCase()}_download.${format}`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    closeModal();
  } catch (err) {
    alert("Fehler: " + err.message);
    closeModal();
  }
}

async function processConversion() {
  if (!uploadedFile) {
    alert("Bitte wähle zuerst eine Datei aus!");
    return;
  }

  const fromFormat = document.getElementById('convert-from').value;
  const toFormat = document.getElementById('convert-to').value;

  openModal("Datei-Konvertierung", `Konvertiere ${fromFormat} zu ${toFormat}...`);

  const formData = new FormData();
  formData.append('file', uploadedFile);
  formData.append('from_format', fromFormat);
  formData.append('to_format', toFormat);

  try {
    const response = await fetch(`${BACKEND_URL}/api/convert`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error("Fehler bei Konvertierung!");

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `converted_${uploadedFile.name.split('.')[0]}.${toFormat.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    closeModal();
  } catch (err) {
    alert("Fehler: " + err.message);
    closeModal();
  }
}

function openModal(title, subtitle) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-subtitle').textContent = subtitle;
  document.getElementById('modal-progress-bar').style.width = "50%";
  document.getElementById('process-modal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('process-modal').classList.add('hidden');
}

window.onload = initConverterDropdowns;