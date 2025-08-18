// script.js

/**
 * Generates a side‑on view of a wheel divided into segments. Each segment
 * corresponds to an entry in the provided list. This implementation uses
 * the Canvas API to draw a simple cylinder shape: a rectangle representing
 * the face of the wheel and two ellipses on either side to suggest
 * thickness. Segments are drawn as coloured stripes along the face.
 */
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const generateBtn = document.getElementById('generateBtn');
    const spinBtn = document.getElementById('spinBtn');
    const resultEl = document.getElementById('result');
    const overlayResult = document.getElementById('overlayResult');
    const namesTextarea = document.getElementById('names');
    const muteBtn = document.getElementById('muteBtn');
    const soundSelect = document.getElementById('soundSelect');

    // Variables to keep track of current state
    let currentItems = [];
    let currentOffset = 0; // how far segments have been shifted (in pixels)
    let isSpinning = false;
    let selectedIndex = null;
    let originalItems = [];
    let lastTickIndex = -1; // Track the last segment that triggered a tick sound
    let isMuted = false;
    let currentSoundType = 'classic';
    let currentSpinSoundType = 'classic'; // The actual sound type being used for current spin

    // Audio context for generating tick sounds
    let audioContext = null;

    /**
     * Initialize audio context (must be called after user interaction)
     */
    function initAudioContext() {
        if (!audioContext) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) {
                console.warn('Web Audio API not supported:', e);
            }
        }
    }

    /**
     * Generate different types of tick sounds
     */
    function playTickSound() {
        if (!audioContext || isMuted) return;
        
        // Use the sound type selected for this spin session
        const soundType = currentSpinSoundType;
        
        try {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            const currentTime = audioContext.currentTime;
            
            switch (soundType) {
                case 'classic':
                    // Original Price is Right style
                    oscillator.frequency.setValueAtTime(800, currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(400, currentTime + 0.02);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.005);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.05);
                    break;
                    
                case 'beep':
                    // Electronic beep
                    oscillator.frequency.setValueAtTime(1000, currentTime);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.4, currentTime + 0.01);
                    gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.08);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.08);
                    break;
                    
                case 'click':
                    // Mechanical click
                    oscillator.frequency.setValueAtTime(600, currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(200, currentTime + 0.01);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.5, currentTime + 0.002);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.03);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.03);
                    break;
                    
                case 'ping':
                    // High ping
                    oscillator.frequency.setValueAtTime(1500, currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(1200, currentTime + 0.1);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.15);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.15);
                    break;
                    
                case 'pop':
                    // Pop sound
                    oscillator.frequency.setValueAtTime(300, currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(80, currentTime + 0.04);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.6, currentTime + 0.005);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.06);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.06);
                    break;
                    
                case 'blip':
                    // Retro blip
                    oscillator.frequency.setValueAtTime(400, currentTime);
                    oscillator.frequency.linearRampToValueAtTime(800, currentTime + 0.02);
                    oscillator.frequency.linearRampToValueAtTime(400, currentTime + 0.04);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.35, currentTime + 0.01);
                    gainNode.gain.linearRampToValueAtTime(0, currentTime + 0.05);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.05);
                    break;
            }
            
        } catch (e) {
            console.warn('Error playing tick sound:', e);
        }
    }

    /**
     * Toggle mute state
     */
    function toggleMute() {
        isMuted = !isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
        muteBtn.classList.toggle('muted', isMuted);
        muteBtn.title = isMuted ? 'Unmute sound effects' : 'Mute sound effects';
        
        // Save mute preference
        localStorage.setItem('wheelGenerator_muted', isMuted.toString());
    }

    /**
     * Load mute preference from storage
     */
    function loadMutePreference() {
        const savedMuted = localStorage.getItem('wheelGenerator_muted');
        if (savedMuted === 'true') {
            isMuted = true;
            muteBtn.textContent = '🔇';
            muteBtn.classList.add('muted');
            muteBtn.title = 'Unmute sound effects';
        }
    }

    /**
     * Handle sound selection change
     */
    function onSoundChange() {
        currentSoundType = soundSelect.value;
        localStorage.setItem('wheelGenerator_soundType', currentSoundType);
        
        // For preview, if random is selected, pick a random sound to demonstrate
        if (currentSoundType === 'random') {
            const sounds = ['classic', 'beep', 'click', 'ping', 'pop', 'blip'];
            currentSpinSoundType = sounds[Math.floor(Math.random() * sounds.length)];
        } else {
            currentSpinSoundType = currentSoundType;
        }
        
        // Play a preview of the selected sound
        if (!isMuted) {
            playTickSound();
        }
    }

    /**
     * Set the sound type for the current spin session
     */
    function setSpinSoundType() {
        if (currentSoundType === 'random') {
            const sounds = ['classic', 'beep', 'click', 'ping', 'pop', 'blip'];
            currentSpinSoundType = sounds[Math.floor(Math.random() * sounds.length)];
        } else {
            currentSpinSoundType = currentSoundType;
        }
    }

    /**
     * Load sound preference from storage
     */
    function loadSoundPreference() {
        const savedSound = localStorage.getItem('wheelGenerator_soundType');
        if (savedSound) {
            currentSoundType = savedSound;
            soundSelect.value = savedSound;
        }
        // Set initial spin sound type
        setSpinSoundType();
    }

    /**
     * Test sound function for preview
     */
    function testSound() {
        if (!audioContext) {
            initAudioContext();
        }
        if (!isMuted) {
            playTickSound();
        }
    }

    // Storage keys for localStorage
    const STORAGE_KEYS = {
        NAMES_LIST: 'wheelGenerator_namesList',
        CURRENT_ITEMS: 'wheelGenerator_currentItems',
        ORIGINAL_ITEMS: 'wheelGenerator_originalItems'
    };

    /**
     * Saves the current names list to localStorage
     */
    function saveNamesToStorage() {
        const namesValue = namesTextarea.value.trim();
        if (namesValue) {
            localStorage.setItem(STORAGE_KEYS.NAMES_LIST, namesValue);
        }
    }

    /**
     * Saves the current wheel state to localStorage
     */
    function saveWheelState() {
        if (currentItems.length > 0) {
            localStorage.setItem(STORAGE_KEYS.CURRENT_ITEMS, JSON.stringify(currentItems));
        }
        if (originalItems.length > 0) {
            localStorage.setItem(STORAGE_KEYS.ORIGINAL_ITEMS, JSON.stringify(originalItems));
        }
    }

    /**
     * Loads the names list from localStorage
     */
    function loadNamesFromStorage() {
        const savedNames = localStorage.getItem(STORAGE_KEYS.NAMES_LIST);
        if (savedNames) {
            namesTextarea.value = savedNames;
        }
    }

    /**
     * Loads the wheel state from localStorage
     */
    function loadWheelState() {
        const savedCurrentItems = localStorage.getItem(STORAGE_KEYS.CURRENT_ITEMS);
        const savedOriginalItems = localStorage.getItem(STORAGE_KEYS.ORIGINAL_ITEMS);
        
        if (savedCurrentItems) {
            try {
                currentItems = JSON.parse(savedCurrentItems);
            } catch (e) {
                console.warn('Failed to parse saved current items:', e);
                currentItems = [];
            }
        }
        
        if (savedOriginalItems) {
            try {
                originalItems = JSON.parse(savedOriginalItems);
            } catch (e) {
                console.warn('Failed to parse saved original items:', e);
                originalItems = [];
            }
        }
        
        // If we have current items, redraw the wheel
        if (currentItems.length > 0) {
            drawWheelWithOffset(currentItems, currentOffset);
        }
    }

    /**
     * Clears wheel state from localStorage
     */
    function clearWheelState() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_ITEMS);
        localStorage.removeItem(STORAGE_KEYS.ORIGINAL_ITEMS);
    }

    // Load saved data on page load
    loadNamesFromStorage();
    loadWheelState();
    loadMutePreference();
    loadSoundPreference();

    /**
     * Splits the user input into an array of trimmed non‑empty strings.
     * Accepts comma separated or newline separated values.
     * @returns {string[]} array of names/numbers
     */
    function parseInput() {
        const raw = document.getElementById('names').value;
        return raw
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
    }

    /**
     * Randomly shuffles an array in place using the Fisher–Yates algorithm.
     * @param {any[]} array
     */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    /**
     * Draws the wheel with the given items, applying an optional horizontal offset.
     * When a selected index is provided, that segment will be outlined to highlight it.
     *
     * @param {string[]} items
     * @param {number} offset shift applied to segment positions
     * @param {?number} highlight index of the item to highlight (or null)
     */
    function drawWheelWithOffset(items, offset, highlight = null) {
        // Clear entire canvas
        const cw = canvas.width;
        const ch = canvas.height;
        ctx.clearRect(0, 0, cw, ch);
        if (!items || items.length === 0) {
            return;
        }
        // For a vertical wheel, the height dominates and the width is narrow
        const wheelHeight = ch * 0.8;
        const wheelWidth = cw * 0.35;
        const x = (cw - wheelWidth) / 2;
        const y = (ch - wheelHeight) / 2;
        const segHeight = wheelHeight / items.length;
        const palette = [
            '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#1abc9c',
            '#3498db', '#9b59b6', '#34495e', '#16a085', '#d35400'
        ];
        // Draw each segment as a horizontal stripe across the narrow width
        for (let i = 0; i < items.length; i++) {
            // Compute wrapped starting y position based on offset
            const rawStart = y + i * segHeight - offset;
            let sy = ((rawStart - y) % wheelHeight + wheelHeight) % wheelHeight + y;
            // Fill segment rectangle
            ctx.fillStyle = palette[i % palette.length];
            ctx.fillRect(x, sy, wheelWidth, segHeight);
            // Divider line between segments (horizontal)
            ctx.strokeStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(x, sy);
            ctx.lineTo(x + wheelWidth, sy);
            ctx.stroke();
            // Highlight selected segment
            if (highlight !== null && i === highlight) {
                ctx.save();
                ctx.lineWidth = 4;
                ctx.strokeStyle = '#ffffff';
                ctx.strokeRect(x, sy, wheelWidth, segHeight);
                ctx.restore();
            }
            // Draw segment label horizontally centred within each stripe
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ffffff';
            const fontSize = Math.min(20, segHeight * 0.5);
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillText(items[i], x + wheelWidth / 2, sy + segHeight / 2);
            ctx.restore();
        }
        // Draw bottom divider line to close the last segment
        ctx.strokeStyle = '#222';
        ctx.beginPath();
        ctx.moveTo(x, y + wheelHeight);
        ctx.lineTo(x + wheelWidth, y + wheelHeight);
        ctx.stroke();
        // Simulate thickness with simple rectangles above and below the wheel instead of semi‑circles
        const thickness = wheelHeight * 0.1; // 10% of the wheel height as thickness
        ctx.fillStyle = '#888';
        // Top thickness rectangle
        ctx.fillRect(x, y - thickness, wheelWidth, thickness);
        // Bottom thickness rectangle
        ctx.fillRect(x, y + wheelHeight, wheelWidth, thickness);
        // Outline of the wheel rectangle
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, wheelWidth, wheelHeight);
        // Centre indicator: horizontal line across the middle with a contrasting border
        ctx.save();
        const centerY = ch / 2;
        // Draw a slightly thicker white line underneath to act as a border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x + wheelWidth, centerY);
        ctx.stroke();
        // Draw the red line on top
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x + wheelWidth, centerY);
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Calculate the index of the segment currently under the centre line.
     * @param {string[]} items
     * @param {number} offset
     * @returns {number} index of the segment at the centre
     */
    function getIndexAtCentre(items, offset) {
        // Compute which segment is currently centered along the horizontal centre line
        const ch = canvas.height;
        const wheelHeight = ch * 0.8;
        const segHeight = wheelHeight / items.length;
        const y = (ch - wheelHeight) / 2;
        const centerY = ch / 2;
        const posInWheel = centerY - y + offset;
        const index = Math.floor((posInWheel % wheelHeight) / segHeight);
        return (index + items.length) % items.length;
    }

    /**
     * Initiates a spin animation. Chooses a random item as the winning segment
     * and rotates the wheel so that the winning segment ends up centred. The
     * animation includes several full rotations before easing out to the final
     * position.
     */
    function spinWheel() {
        if (isSpinning || currentItems.length === 0) {
            return;
        }
        
        // Initialize audio context on first spin
        initAudioContext();
        
        // Set the sound type for this spin session
        setSpinSoundType();
        
        // Pick a random winning index
        selectedIndex = Math.floor(Math.random() * currentItems.length);
        // Compute geometry for vertical orientation
        const ch = canvas.height;
        const wheelHeight = ch * 0.8;
        const segHeight = wheelHeight / currentItems.length;
        const y = (ch - wheelHeight) / 2;
        const centerY = ch / 2;
        // Compute target offset that aligns selectedIndex under centre line
        const finalOffset = selectedIndex * segHeight + segHeight / 2 + y - centerY;
        // Add several full rotations
        const rotations = 3;
        const targetOffset = finalOffset + rotations * wheelHeight;
        const startOffset = currentOffset;
        const distance = targetOffset - startOffset;
        const duration = 4000;
        const startTime = performance.now();
        isSpinning = true;
        resultEl.textContent = '';
        function animate(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            currentOffset = startOffset + distance * easeOut;
            
            // Check if we've crossed into a new segment and play tick sound
            const currentIndex = getIndexAtCentre(currentItems, currentOffset);
            if (currentIndex !== lastTickIndex && isSpinning) {
                lastTickIndex = currentIndex;
                playTickSound();
            }
            
            drawWheelWithOffset(currentItems, currentOffset);
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Normalize currentOffset to stay within 0..wheelHeight
                currentOffset = ((finalOffset % wheelHeight) + wheelHeight) % wheelHeight;
                isSpinning = false;
                lastTickIndex = -1; // Reset tick tracking
                // Determine final selected index
                const idx = getIndexAtCentre(currentItems, currentOffset);
                selectedIndex = idx;
                const selectedValue = currentItems[selectedIndex];
                // Prepare celebratory content once
                const resultContent = `🎉 <strong>${selectedValue}</strong> 🎉`;
                // Hide the permanent result until the overlay has disappeared
                resultEl.style.display = 'none';
                // Show overlay with the selected value. Increase duration for longer visibility
                overlayResult.innerHTML = resultContent;
                overlayResult.style.animation = 'none';
                overlayResult.offsetWidth; // force reflow to restart animation
                overlayResult.style.display = 'block';
                // Trigger fade animation over 3 seconds
                overlayResult.style.animation = 'overlayFade 5s forwards';
                // After the overlay has faded (5 seconds), hide it and show the permanent result
                setTimeout(() => {
                    overlayResult.style.display = 'none';
                    resultEl.innerHTML = resultContent;
                    resultEl.style.display = 'inline-block';
                }, 5000);
                // Remove selected item
                currentItems.splice(selectedIndex, 1);
                // Reset offset for next spin
                currentOffset = 0;
                if (currentItems.length > 0) {
                    drawWheelWithOffset(currentItems, currentOffset);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    // Clear wheel state when no items remain
                    clearWheelState();
                }
                
                // Save the updated wheel state (with removed item)
                saveWheelState();
            }
        }
        requestAnimationFrame(animate);
    }

    // Event listener for generate button
    generateBtn.addEventListener('click', () => {
        // Initialize audio context on user interaction
        initAudioContext();
        
        const items = parseInput();
        if (items.length === 0) {
            alert('Please enter at least one name or number to generate the wheel.');
            return;
        }
        // Randomize the order of entries before displaying
        shuffleArray(items);
        currentItems = items;
        // Keep a copy of the original (shuffled) list so we can reset later
        originalItems = items.slice();
        currentOffset = 0;
        selectedIndex = null;
        isSpinning = false;
        lastTickIndex = -1; // Reset tick tracking
        resultEl.textContent = '';
        resultEl.style.display = 'none';
        drawWheelWithOffset(currentItems, currentOffset);
        
        // Save the current wheel state
        saveWheelState();
    });

    // Event listener for spin button
    spinBtn.addEventListener('click', spinWheel);

    // Event listener for reset button
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => {
        if (originalItems.length === 0) {
            return;
        }
        // Reset state to original
        currentItems = originalItems.slice();
        currentOffset = 0;
        selectedIndex = null;
        isSpinning = false;
        resultEl.textContent = '';
        resultEl.style.display = 'none';
        drawWheelWithOffset(currentItems, currentOffset);
        
        // Save the reset wheel state
        saveWheelState();
    });

    // Auto-save names as user types
    namesTextarea.addEventListener('input', saveNamesToStorage);
    
    // Also save when user pastes content
    namesTextarea.addEventListener('paste', () => {
        // Use setTimeout to ensure the pasted content is processed first
        setTimeout(saveNamesToStorage, 10);
    });

    // Mute button event listener
    muteBtn.addEventListener('click', toggleMute);

    // Sound selection event listener
    soundSelect.addEventListener('change', onSoundChange);
});