// --- 1. SELEKSI ELEMEN DOM ---
const track = document.getElementById('track');
const tiles = document.querySelectorAll('.ps-tile');
const gameTitle = document.getElementById('game-title');
const gameDesc = document.getElementById('game-desc');
const loader = document.getElementById('loader');
const loadText = document.getElementById('loadText');
const startBtn = document.getElementById('startBtn');
const dustContainer = document.getElementById('dustContainer');
const clock = document.getElementById('clock');
const arrowLeftBtn = document.getElementById('arrowLeftBtn');
const arrowRightBtn = document.getElementById('arrowRightBtn');
const scrollbarThumb = document.getElementById('scrollbarThumb'); // FIX: Seleksi thumb scrollbar

// Seleksi elemen audio
const sndStartup = document.getElementById('snd-startup');
const sndScroll = document.getElementById('snd-scroll');
const sndSelect = document.getElementById('snd-select');

// --- 2. STATE MANAGEMENT ---
let index = 0;
let isSystemReady = false;
let isLoadingFinished = false;
let touchStartX = 0;
let touchEndX = 0;

// --- 3. INISIALISASI ---

// Inisialisasi Konten Gambar Sampul & Ikon Fallback
tiles.forEach(tile => {
    const imgUrl = tile.getAttribute('data-img');
    const iconClass = tile.getAttribute('data-icon');
    
    tile.innerHTML = `
        <div class="tile-art">
            <img src="${imgUrl}" class="cover-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <i class="fallback-icon" style="display:none;"></i>
        </div>`;
        
    const iconElement = tile.querySelector('.fallback-icon');
    if (iconClass === 'fa-heart') {
        iconElement.classList.add('fa-solid', 'fa-heart');
    } else {
        iconElement.classList.add('fa-brands', iconClass);
    }
});

// Inisialisasi Partikel Debu
for (let i = 0; i < 15; i++) {
    const dust = document.createElement('div');
    dust.className = 'dust';
    dust.style.width = dust.style.height = `${Math.floor(Math.random() * 5) + 3}px`;
    dust.style.left = `${Math.random() * 100}%`;
    dust.style.top = `${Math.random() * 50 + 50}%`;
    dust.style.animationDuration = `${Math.random() * 10 + 12}s`;
    dust.style.animationDelay = `${Math.random() * 6}s`;
    dustContainer.appendChild(dust);
}

// Inisialisasi Jam Digital
setInterval(() => {
    const now = new Date();
    const timeString = now.toTimeString().substring(0, 5);
    clock.textContent = `${timeString} WIB`;
}, 1000);

// --- 4. FUNGSI UTAMA ---

function playSound(audio) {
    if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
}

// Fungsi ini dipanggil setelah 2.2 detik
setTimeout(() => {
    document.getElementById('loadBar').style.display = 'none';
    loadText.textContent = "PRESS ANY KEY OR CLICK TO START";
    loadText.classList.add('blink-text');
    isLoadingFinished = true;
}, 2200);

function startSystem(event) {
    if (!isLoadingFinished || isSystemReady) return;
    // FIX: Hentikan event agar tidak "merambat" dan memicu listener lain (seperti executeLink) secara tidak sengaja.
    if (event) event.stopPropagation();
    loader.classList.add('fade-out');
    isSystemReady = true;
    playSound(sndStartup);
    setTimeout(() => loader.remove(), 800);
}

function updatePS4UI(targetIndex) {
    tiles.forEach((tile, i) => {
        const active = i === targetIndex;
        tile.classList.toggle('active', active);
        if (active) {
            gameTitle.textContent = tile.getAttribute('data-title').toUpperCase();
            gameDesc.textContent = tile.getAttribute('data-desc');
        }
    });

    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const currentStep = isTouchDevice ? 125 : 165; // 100px (lebar tile) + 25px (gap)
    
    const trackOffset = -(targetIndex * currentStep);
    track.style.transform = `translate3d(${trackOffset}px, 0, 0)`;
    
    if (isSystemReady) playSound(sndScroll);

    // FIX: Logika untuk memperbarui scrollbar kustom
    if (isTouchDevice && scrollbarThumb) {
        const trackWidth = track.scrollWidth;
        const windowWidth = track.parentElement.clientWidth;
        
        // Lebar thumb proporsional dengan konten yang terlihat
        const thumbWidth = (windowWidth / trackWidth) * 100;
        scrollbarThumb.style.width = `${thumbWidth}%`;

        // Posisi thumb sesuai dengan posisi carousel
        const thumbOffset = (Math.abs(trackOffset) / trackWidth) * 100;
        scrollbarThumb.style.transform = `translateX(${thumbOffset}%)`;
    }
}

function executeLink() {
    playSound(sndSelect);
    setTimeout(() => window.open(tiles[index].href, '_blank'), 250);
}

function handleSwipe() {
    const swipeThreshold = 40;
    if (!isSystemReady) return;

    const swipeDistance = touchStartX - touchEndX;

    if (swipeDistance > swipeThreshold && index < tiles.length - 1) {
        index++;
        updatePS4UI(index);
    } else if (swipeDistance < -swipeThreshold && index > 0) {
        index--;
        updatePS4UI(index);
    }
}

// --- 5. EVENT LISTENERS ---

// --- PERBAIKAN: Memasang listener langsung pada loader ---
// Ini memastikan interaksi pengguna ditangkap bahkan saat loader menutupi layar.
loader.addEventListener('click', startSystem);
loader.addEventListener('touchstart', startSystem, { passive: true });
document.addEventListener('keydown', (e) => { // Keydown tetap di document karena event keyboard tidak terpengaruh oleh lapisan elemen
    if (isLoadingFinished && !isSystemReady) startSystem(e);
});

// Navigasi Keyboard
document.addEventListener('keydown', (e) => {
    if (!isSystemReady) return;
    if (e.key === 'ArrowRight' && index < tiles.length - 1) { e.preventDefault(); index++; updatePS4UI(index); }
    else if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); index--; updatePS4UI(index); }
    else if (e.key === 'Enter') { e.preventDefault(); executeLink(); }
});

// Navigasi Sentuhan (Swipe)
document.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
document.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

// Tombol "Start"
// FIX: Gunakan 'touchstart' untuk responsivitas mobile yang lebih baik
startBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation(); // Mencegah event 'click' di document terpicu lagi
    if (isSystemReady) executeLink();
});
