const track = document.getElementById('track');
const tiles = document.querySelectorAll('.ps-tile');
const gameTitle = document.getElementById('game-title');
const gameDesc = document.getElementById('game-desc');
const loader = document.getElementById('loader');
const loadText = document.getElementById('loadText');
const startBtn = document.getElementById('startBtn');
const dustContainer = document.getElementById('dustContainer');
const carouselWindow = document.getElementById('carouselWindow'); // FIX: Seleksi window carousel
const clock = document.getElementById('clock');
const scrollbarThumb = document.getElementById('scrollbarThumb'); // FIX: Seleksi thumb scrollbar

// AUDIO SETUP
const sndStartup = document.getElementById('snd-startup');
const sndScroll = document.getElementById('snd-scroll');
const sndSelect = document.getElementById('snd-select');

// STATE MANAGEMENT
let index = 0;
let isSystemReady = false;
let isLoadingFinished = false;
let touchStartX = 0;
let touchEndX = 0;
let isDragging = false; // FIX: State untuk mouse drag
let dragStartX = 0;
let isThumbDragging = false; // FIX: State untuk scrollbar thumb drag
let thumbDragStartX = 0;
let hasDragged = false; // FIX: State untuk membedakan klik dan drag di PC

// INISIALISASI

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

// FUNGSI UTAMA
function playSound(audio) {
     if (!audio) return;
    // Trik untuk mobile: coba putar. Jika gagal, coba lagi setelah jeda singkat.
    // Ini memberi browser waktu untuk memproses interaksi pengguna.
    audio.currentTime = 0;
    const promise = audio.play();
    if (promise !== undefined) {
        promise.catch(error => {
            // Gagal? Coba lagi. Ini sering berhasil setelah interaksi pertama.
            setTimeout(() => audio.play().catch(() => {}), 50);
        });
    }
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
    
    let currentStep;
    if (isTouchDevice) {
        const isLandscape = window.matchMedia("(orientation: landscape)").matches && window.innerHeight <= 500;
        const tileWidth = isLandscape ? 90 : 100; // 90px di lanskap, 100px di potret
        currentStep = tileWidth + 25; // tile width + gap
    } else {
        currentStep = 140 + 25; // 165px untuk desktop
    }

    const trackOffset = -(targetIndex * currentStep);
    track.style.transform = `translate3d(${trackOffset}px, 0, 0)`;
    
    if (isSystemReady) playSound(sndScroll);

    const scrollbarContainer = scrollbarThumb.parentElement;
    const maxScrollbarOffset = scrollbarContainer.clientWidth - scrollbarThumb.clientWidth;
    const thumbOffset = (targetIndex / (tiles.length - 1)) * maxScrollbarOffset;

    const isAnyDragging = isThumbDragging || isDragging;
    scrollbarThumb.style.transition = isAnyDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
    scrollbarThumb.style.transform = `translate3d(${thumbOffset}px, -50%, 0)`;
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

function handleDrag(endX) {
    const dragThreshold = 50; // Jarak minimum drag agar dianggap swipe
    if (!isSystemReady) return;

    const dragDistance = dragStartX - endX;

    if (dragDistance > dragThreshold && index < tiles.length - 1) {
        index++;
        updatePS4UI(index);
    } else if (dragDistance < -dragThreshold && index > 0) {
        index--;
        updatePS4UI(index);
    }
}
// EVENT LISTENERS
loader.addEventListener('click', startSystem);
loader.addEventListener('touchstart', (e) => {
    startSystem(e);
}, { passive: true });
document.addEventListener('keydown', (e) => { 
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
carouselWindow.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
carouselWindow.addEventListener('touchend', (e) => { touchEndX = e.changedTouches[0].screenX; handleSwipe(); }, { passive: true });

// Tombol "Start"
startBtn.addEventListener('touchstart', (e) => {
    e.stopPropagation(); // Mencegah event 'click' di document terpicu lagi
    if (isSystemReady) executeLink();
});

// Navigasi Drag-to-Swipe untuk PC
carouselWindow.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault(); 
    isDragging = true;
    hasDragged = false;
    dragStartX = e.pageX;
    carouselWindow.style.cursor = 'grabbing';
});

carouselWindow.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    if (Math.abs(e.pageX - dragStartX) > 5) {
        hasDragged = true;
    }
});

window.addEventListener('mouseup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    carouselWindow.style.cursor = 'grab';
    if (hasDragged) {
        handleDrag(e.pageX);
    }
});

track.addEventListener('click', (e) => {
    if (hasDragged) {
        e.preventDefault();
    }
});
 
// Scrollbar thumb (PC & Mobile)
function onThumbDragStart(e) {
    isThumbDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    thumbDragStartX = clientX - scrollbarThumb.getBoundingClientRect().left;
    scrollbarThumb.style.transition = 'none';
    scrollbarThumb.style.cursor = 'grabbing';
}

function onThumbDragMove(e) {
    if (!isThumbDragging) return;
    e.preventDefault(); 
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const scrollbarContainer = scrollbarThumb.parentElement;
    const containerRect = scrollbarContainer.getBoundingClientRect();
    
    let newX = clientX - containerRect.left - thumbDragStartX;
    
    const maxOffset = containerRect.width - scrollbarThumb.clientWidth;
    newX = Math.max(0, Math.min(newX, maxOffset));
    
    const newIndex = Math.round((newX / maxOffset) * (tiles.length - 1));
    if (newIndex !== index) {
        index = newIndex;
        updatePS4UI(index);
    }
}

function onThumbDragEnd() {
    if (!isThumbDragging) return;
    isThumbDragging = false;
    scrollbarThumb.style.cursor = 'grab';
    updatePS4UI(index); 
}

// Listener untuk Mobile
scrollbarThumb.addEventListener('touchstart', onThumbDragStart, { passive: false });
document.addEventListener('touchmove', onThumbDragMove, { passive: false });
document.addEventListener('touchend', onThumbDragEnd);

// Listener untuk PC
scrollbarThumb.addEventListener('mousedown', onThumbDragStart);
window.addEventListener('mousemove', onThumbDragMove);
window.addEventListener('mouseup', onThumbDragEnd);
