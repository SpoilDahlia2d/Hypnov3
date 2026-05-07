const SUBLIMINALS = [
    "OBEY", "SUBMIT", "DRAIN", "WORSHIP", 
    "MIND EMPTY", "SYSTEM OVERRIDE", "GOOD PAYPIG", 
    "YOUR WALLET IS HERS", "NO THOUGHTS", "SURRENDER"
];

// Nomi dei file reali in assets
const IMAGES = [
    'assets/IMG_6513.JPG', 'assets/IMG_6526.JPG', 'assets/IMG_6565.JPG', 
    'assets/IMG_6570.JPG', 'assets/IMG_6580.JPG', 'assets/IMG_6583.JPG',
    'assets/IMG_6587.jpg', 'assets/xai-tmp-imgen-77676a7f-b137-454d-a725-772337d7807e 2.PNG'
];

const VIDEOS = [
    'assets/3818591504142230290.mp4', 'assets/3818604189503491693.mp4',
    'assets/_imagine-public_share-videos_a18f1456-d50b-4454-a5dc-399661a440f5_hd.MP4',
    'assets/_users_1bfbbe21-63b8-42b9-810d-b26e0bf9eac7_generated_d953e23d-be46-4898-b9cf-2f169c098fc9_generated_video_hd.MP4'
];

const SECRET_CODE = "DAHLIA20"; // Modifica qui la password

let tranceLevel = 0; 
let isInteracting = false;
let animationFrameId;
let isLevel2 = false;
let mediaTimeout;

// Audio
let audioContext;
let oscillatorDrone;
let gainNodeDrone;
let heartbeatTimeoutId;

// DOM Elements
const introScreen = document.getElementById('intro-screen');
const hypnoContainer = document.getElementById('hypno-container');
const finaleScreen = document.getElementById('finale-screen');
const mediaOverlay = document.getElementById('media-overlay');
const mediaImg = document.getElementById('media-img');
const mediaVideo = document.getElementById('media-video');

const startBtn = document.getElementById('start-btn');
const canvas = document.getElementById('hypno-canvas');
const ctx = canvas.getContext('2d');
const subliminalDiv = document.getElementById('subliminal-text');
const progressBarFill = document.getElementById('progress-bar-fill');
const tranceStatusText = document.getElementById('trance-status');
const bgAudio = document.getElementById('bg-audio');
const menuBtns = document.querySelectorAll('.menu-btn');

const unlockBtn = document.getElementById('unlock-btn');
const secretInput = document.getElementById('secret-code-input');
const errorMsg = document.getElementById('error-msg');

function init() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    startBtn.addEventListener('click', startExperience);
    
    // Interaction Events
    hypnoContainer.addEventListener('mousedown', startInteraction);
    window.addEventListener('mouseup', stopInteraction);
    
    hypnoContainer.addEventListener('touchstart', (e) => {
        if(e.target.tagName !== 'BUTTON') {
            e.preventDefault();
            startInteraction();
        }
    }, {passive: false});
    window.addEventListener('touchend', stopInteraction);

    // Menu Interactions
    menuBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            executeMenuCommand(btn.getAttribute('data-action'), btn);
        });
    });
    
    unlockBtn.addEventListener('click', checkUnlockCode);

    initHexRain();
}

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function startExperience() {
    introScreen.classList.remove('active');
    hypnoContainer.classList.add('active');
    
    bgAudio.volume = 0.5;
    bgAudio.play().catch(e => console.log("MP3 play failed.", e));
    
    initDroneAndHeartbeat(); 
    
    startHypnoAnimation();
    startSubliminalEngine();
}

function triggerFinale() {
    cancelAnimationFrame(animationFrameId);
    hypnoContainer.classList.remove('active');
    mediaOverlay.classList.remove('active');
    if(!mediaVideo.paused) mediaVideo.pause();
    finaleScreen.classList.add('active');
}

// --- Audio (Drone + Heartbeat) ---
function initDroneAndHeartbeat() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return; 
    
    audioContext = new AudioContext();
    
    oscillatorDrone = audioContext.createOscillator();
    gainNodeDrone = audioContext.createGain();
    oscillatorDrone.type = 'sine';
    oscillatorDrone.frequency.value = 60; 
    gainNodeDrone.gain.value = 0.1;
    oscillatorDrone.connect(gainNodeDrone);
    gainNodeDrone.connect(audioContext.destination);
    oscillatorDrone.start();

    triggerHeartbeat();
}

function triggerHeartbeat() {
    if (!audioContext) return;

    let volume = 0.1 + (tranceLevel / 100 * 0.9);
    if (isLevel2) volume = 1.0; 

    playBeat(volume);
    setTimeout(() => playBeat(volume * 0.8), 250);

    let delay = 1200 - (tranceLevel * 8); 
    if (isLevel2) delay = 400 + Math.random() * 200; 
    
    const nextDelay = Math.max(delay, 300); 
    heartbeatTimeoutId = setTimeout(triggerHeartbeat, nextDelay);
}

function playBeat(vol) {
    if (!audioContext) return;
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.type = isLevel2 ? 'square' : 'sine'; 
    osc.frequency.setValueAtTime(isLevel2 ? 60 : 45, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    gain.gain.setValueAtTime(vol, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(audioContext.destination);
    
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.3);
}

function updateDroneAudio(tranceAmount) {
    if (!audioContext || !oscillatorDrone) return;
    const norm = tranceAmount / 100;
    
    let newVolume = 0.1 + (norm * 0.4); 
    let newFreq = 60 + (norm * 40); 
    
    if (isLevel2) {
        newVolume = 0.7 + (Math.random() * 0.3);
        newFreq = 80 + (Math.random() * 60);
    }
    
    gainNodeDrone.gain.setTargetAtTime(newVolume, audioContext.currentTime, 0.1);
    oscillatorDrone.frequency.setTargetAtTime(newFreq, audioContext.currentTime, 0.1);
}

function stopSynthAudio() {
    if (oscillatorDrone) {
        gainNodeDrone.gain.setTargetAtTime(0, audioContext.currentTime, 0.5);
        setTimeout(() => oscillatorDrone.stop(), 500);
    }
    clearTimeout(heartbeatTimeoutId);
}

// --- Menu Command Execution ---
function executeMenuCommand(action, btnElement) {
    const originalText = btnElement.innerText;
    btnElement.innerText = "[ EXECUTING... ]";
    btnElement.style.backgroundColor = "var(--accent-purple)";
    btnElement.style.color = "#fff";
    
    tranceLevel += 1; 
    if (tranceLevel > 100 && !isLevel2) tranceLevel = 100;
    
    if (action === 'show_image') showMedia('image');
    else if (action === 'show_video') showMedia('video');
    else triggerGlitch();
    
    setTimeout(() => {
        btnElement.innerText = "[ SUCCESS ]";
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.backgroundColor = "transparent";
            btnElement.style.color = "var(--text-color)";
        }, 1000);
    }, 150);
}

function triggerGlitch() {
    document.body.style.filter = "invert(1) hue-rotate(180deg)";
    setTimeout(() => { document.body.style.filter = "none"; }, 150);
}

// --- Media Display ---
function showMedia(type) {
    clearTimeout(mediaTimeout); // Resetta il timer
    mediaImg.style.display = 'none';
    mediaVideo.style.display = 'none';
    mediaVideo.pause();

    if (type === 'image') {
        const src = IMAGES[Math.floor(Math.random() * IMAGES.length)];
        mediaImg.src = src;
        mediaImg.style.display = 'block';
    } else if (type === 'video') {
        const src = VIDEOS[Math.floor(Math.random() * VIDEOS.length)];
        mediaVideo.src = src;
        mediaVideo.style.display = 'block';
        mediaVideo.play().catch(e=>console.log(e));
    }

    mediaOverlay.classList.add('active');
    triggerGlitch();
    
    // Auto nasconde l'immagine/video dopo 4 secondi (flash ipnotico lungo)
    mediaTimeout = setTimeout(() => {
        hideMedia();
    }, 4000);
}

function hideMedia() {
    mediaOverlay.classList.remove('active');
    setTimeout(() => {
        mediaVideo.pause();
    }, 1000); // Pausa dopo il fade CSS
}

// --- Canvas Graphics (Double Spiral & Pulse) ---
let rotationAngle = 0;
let baseSpeed = 0.01;
let currentSpeed = baseSpeed;
let pulsePhase = 0;

function drawCyberSpiral(cx, cy, radiusMax, rotation, intensity) {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.1 + (0.2 * (1-intensity))})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const numArmsOuter = 3 + Math.floor(intensity * 4); 
    const numArmsInner = 3;
    const steps = 150;
    
    pulsePhase += 0.1 + (intensity * 0.2);
    const pulse = Math.sin(pulsePhase) * (intensity * 10);
    
    ctx.lineCap = 'square';
    
    drawSpiralLayer(cx, cy, radiusMax, rotation, numArmsOuter, steps, intensity, pulse, 1);
    
    if (intensity > 0.3 || isLevel2) {
        drawSpiralLayer(cx, cy, radiusMax * 0.5, -rotation * 1.5, numArmsInner, steps, intensity, -pulse, -1);
    }

    ctx.beginPath();
    ctx.arc(cx, cy, 20 + (intensity * 30) + (isLevel2 ? pulse*2 : 0), 0, Math.PI * 2);
    ctx.fillStyle = isLevel2 ? `rgba(255, 0, 0, ${0.7 + Math.random()*0.3})` : `rgba(189, 0, 255, ${0.5 + intensity*0.5})`;
    ctx.fill();
}

function drawSpiralLayer(cx, cy, radiusMax, rot, arms, steps, intensity, pulse, dir) {
    for (let i = 0; i < arms; i++) {
        ctx.beginPath();
        let angleOffset = (Math.PI * 2 / arms) * i;
        
        for (let j = 0; j < steps; j++) {
            let t = j / steps;
            let currentRadius = t * radiusMax;
            let currentAngle = t * Math.PI * 6 * t * dir + rot + angleOffset;
            
            let x = cx + Math.cos(currentAngle) * currentRadius;
            let y = cy + Math.sin(currentAngle) * currentRadius;
            
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        let r = isLevel2 ? 255 : Math.floor(0 + (189 * intensity));
        let g = isLevel2 ? Math.floor(Math.random()*50) : Math.floor(243 - (243 * intensity));
        let b = isLevel2 ? 0 : 255;
        
        ctx.lineWidth = 1 + (intensity * 4) + Math.abs(pulse * 0.5);
        ctx.shadowBlur = 15 + Math.abs(pulse);
        ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;
        
        if (Math.random() > 0.9 || (isLevel2 && Math.random() > 0.5)) {
            ctx.setLineDash([5, 15]);
        } else {
            ctx.setLineDash([]);
        }
        ctx.stroke();
    }
}

function startHypnoAnimation() {
    function animate() {
        if (isInteracting) {
            tranceLevel += isLevel2 ? 0.05 : 0.012; 
            currentSpeed += 0.0005;
            if (currentSpeed > (isLevel2 ? 0.2 : 0.1)) currentSpeed = isLevel2 ? 0.2 : 0.1;
        } else {
            tranceLevel -= isLevel2 ? 0.0 : 0.005; 
            currentSpeed -= 0.0005;
            if (currentSpeed < baseSpeed) currentSpeed = baseSpeed;
        }
        
        if (tranceLevel < 0) tranceLevel = 0;
        
        if (tranceLevel >= 100 && !isLevel2) {
            tranceLevel = 100;
            triggerFinale();
            return;
        }
        
        if (tranceLevel >= 200 && isLevel2) {
            tranceLevel = 200;
        }
        
        const intensity = isLevel2 ? 1.0 : tranceLevel / 100;
        
        if(!isLevel2) {
            progressBarFill.style.width = `${tranceLevel}%`;
            if (tranceLevel > 80) {
                tranceStatusText.innerText = "> CRITICAL FAILURE IMMINENT...";
                progressBarFill.style.backgroundColor = "var(--accent-red)";
                bgAudio.playbackRate = 1.3;
            } else if (tranceLevel > 40) {
                tranceStatusText.innerText = "> FIREWALL BREACHED. DOWNLOADING COMMANDS...";
                progressBarFill.style.backgroundColor = "var(--accent-purple)";
                bgAudio.playbackRate = 1.1;
            } else {
                tranceStatusText.innerText = "> SYSTEM CORRUPTION LEVEL...";
                progressBarFill.style.backgroundColor = "var(--text-color)";
                bgAudio.playbackRate = 1.0;
            }
        } else {
            progressBarFill.style.width = `100%`;
            progressBarFill.style.backgroundColor = "red";
            tranceStatusText.innerText = "> NO ESCAPE // SURRENDER COMPLETE";
            if(Math.random() > 0.95) triggerGlitch();
        }
        
        updateDroneAudio(isLevel2 ? 100 : tranceLevel);
        
        rotationAngle += currentSpeed;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const maxRadius = Math.max(canvas.width, canvas.height);
        
        drawCyberSpiral(cx, cy, maxRadius, rotationAngle, intensity);
        
        animationFrameId = requestAnimationFrame(animate);
    }
    animate();
}

function startSubliminalEngine() {
    setInterval(() => {
        const chance = (isInteracting || isLevel2) ? 0.6 : 0.1;
        if (Math.random() < chance) flashSubliminalText();
    }, isLevel2 ? 300 : 800);
}

function flashSubliminalText() {
    const text = SUBLIMINALS[Math.floor(Math.random() * SUBLIMINALS.length)];
    subliminalDiv.innerText = text;
    subliminalDiv.setAttribute('data-text', text); 
    
    const opacity = isLevel2 ? 0.8 : 0.3 + (tranceLevel / 150); 
    subliminalDiv.style.opacity = opacity;
    subliminalDiv.style.color = isLevel2 ? "red" : "white";
    
    subliminalDiv.style.transform = `translate(-50%, -50%) scale(${1 + Math.random()*(isLevel2?1.0:0.5)}) skewX(${Math.random()*40 - 20}deg)`;
    
    const flashDuration = isLevel2 ? 20 + Math.random()*40 : 40 + Math.random() * 80;
    
    setTimeout(() => {
        subliminalDiv.style.opacity = 0;
        subliminalDiv.style.transform = `translate(-50%, -50%) scale(1) skewX(0deg)`;
    }, flashDuration);
}

function initHexRain() {
    const hexContainer = document.getElementById('hex-rain');
    let rainHTML = '';
    for(let i=0; i<50; i++) {
        let left = Math.random() * 100;
        let animDuration = 5 + Math.random() * 10;
        let delay = Math.random() * 5;
        rainHTML += `<div style="position:absolute; left:${left}%; top:-10%; animation: fall ${animDuration}s linear ${delay}s infinite; opacity: ${0.2 + Math.random()*0.5};">`;
        for(let j=0; j<20; j++) {
            rainHTML += Math.floor(Math.random()*16).toString(16).toUpperCase() + "<br>";
        }
        rainHTML += `</div>`;
    }
    hexContainer.innerHTML = rainHTML;
    
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes fall {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100vh); }
        }
    `;
    document.head.appendChild(style);
}

function startInteraction() { isInteracting = true; }
function stopInteraction() { isInteracting = false; }

function checkUnlockCode() {
    const val = secretInput.value.trim().toUpperCase();
    if (val === SECRET_CODE) {
        finaleScreen.classList.remove('active');
        document.body.classList.add('level-2');
        isLevel2 = true;
        
        hypnoContainer.classList.add('active');
        bgAudio.playbackRate = 1.5;
        initDroneAndHeartbeat();
        startHypnoAnimation();
        
        document.getElementById('tech-menu').style.display = 'none'; 
    } else {
        errorMsg.style.opacity = 1;
        triggerGlitch();
        setTimeout(() => { errorMsg.style.opacity = 0; }, 2000);
    }
}

document.addEventListener('DOMContentLoaded', init);
