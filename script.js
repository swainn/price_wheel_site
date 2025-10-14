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
    const resetBtn = document.getElementById('resetBtn');
    const overlayResult = document.getElementById('overlayResult');
    const tagInput = document.getElementById('tag-input');
    const tagsDisplay = document.getElementById('tags-display');
    const tagInputContainer = document.getElementById('tag-input-container');
    const muteBtn = document.getElementById('muteBtn');
    const soundSelect = document.getElementById('soundSelect');
    const themeBtn = document.getElementById('themeBtn');
    
    // Group management elements
    const groupSelect = document.getElementById('groupSelect');
    const groupNameInput = document.getElementById('groupNameInput');
    const saveGroupBtn = document.getElementById('saveGroupBtn');
    const loadGroupBtn = document.getElementById('loadGroupBtn');
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');
    const groupToggle = document.getElementById('group-toggle');
    const groupHeader = document.getElementById('group-header');
    const groupControls = document.getElementById('group-controls');

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
    let cycleIndex = 0; // Track current position in sound cycle
    let namesTags = []; // Array to store the tag names
    let currentTheme = 'dark'; // Default theme
    let isGroupManagementCollapsed = true; // Start collapsed by default

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
                    
                case 'thud':
                    // Deep thud
                    oscillator.frequency.setValueAtTime(120, currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(60, currentTime + 0.08);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.7, currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.12);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.12);
                    break;
                    
                case 'bass':
                    // Bass drop
                    oscillator.frequency.setValueAtTime(80, currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(40, currentTime + 0.15);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.8, currentTime + 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.2);
                    break;
                    
                case 'drum':
                    // Low drum
                    oscillator.frequency.setValueAtTime(100, currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(50, currentTime + 0.05);
                    gainNode.gain.setValueAtTime(0, currentTime);
                    gainNode.gain.linearRampToValueAtTime(0.6, currentTime + 0.005);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.08);
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + 0.08);
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
            const sounds = ['classic', 'beep', 'click', 'pop', 'blip', 'thud', 'bass', 'drum'];
            currentSpinSoundType = sounds[Math.floor(Math.random() * sounds.length)];
        } else if (currentSoundType === 'cycle') {
            const sounds = ['classic', 'beep', 'click', 'pop', 'blip', 'thud', 'bass', 'drum'];
            currentSpinSoundType = sounds[cycleIndex % sounds.length];
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
            const sounds = ['classic', 'beep', 'click', 'pop', 'blip', 'thud', 'bass', 'drum'];
            currentSpinSoundType = sounds[Math.floor(Math.random() * sounds.length)];
        } else if (currentSoundType === 'cycle') {
            const sounds = ['classic', 'beep', 'click', 'pop', 'blip', 'thud', 'bass', 'drum'];
            currentSpinSoundType = sounds[cycleIndex % sounds.length];
            cycleIndex++; // Advance to next sound for next time
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

    /**
     * Theme management functions
     */
    function setTheme(theme) {
        currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        updateThemeButton();
        localStorage.setItem('wheelGenerator_theme', theme);
        
        // Redraw the wheel with new theme colors if items exist
        if (currentItems.length > 0) {
            drawWheelWithOffset(currentItems, currentOffset, selectedIndex);
        }
    }

    function updateThemeButton() {
        const icons = {
            'dark': '🌙',
            'light': '☀️',
            'auto': '🔄'
        };
        const titles = {
            'dark': 'Switch to light mode',
            'light': 'Switch to auto mode',
            'auto': 'Switch to dark mode'
        };
        themeBtn.textContent = icons[currentTheme];
        themeBtn.title = titles[currentTheme];
    }

    function toggleTheme() {
        const themes = ['dark', 'light', 'auto'];
        const currentIndex = themes.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        setTheme(themes[nextIndex]);
    }

    function loadThemePreference() {
        const savedTheme = localStorage.getItem('wheelGenerator_theme');
        if (savedTheme && ['dark', 'light', 'auto'].includes(savedTheme)) {
            setTheme(savedTheme);
        } else {
            // Default to dark theme
            setTheme('dark');
        }
    }

    // ================================
    // GROUP MANAGEMENT TOGGLE FUNCTIONS
    // ================================

    /**
     * Toggles the group management section visibility
     */
    function toggleGroupManagement() {
        isGroupManagementCollapsed = !isGroupManagementCollapsed;
        
        if (isGroupManagementCollapsed) {
            groupControls.classList.add('collapsed');
            groupHeader.classList.add('collapsed');
            groupToggle.classList.remove('expanded');
            groupToggle.textContent = '▼';
            groupToggle.title = 'Expand group management';
        } else {
            groupControls.classList.remove('collapsed');
            groupHeader.classList.remove('collapsed');
            groupToggle.classList.add('expanded');
            groupToggle.textContent = '▲';
            groupToggle.title = 'Collapse group management';
        }
        
        // Save the state to localStorage
        localStorage.setItem('wheelGenerator_groupManagementCollapsed', isGroupManagementCollapsed.toString());
    }

    /**
     * Loads the group management collapsed state from localStorage
     */
    function loadGroupManagementState() {
        const savedState = localStorage.getItem('wheelGenerator_groupManagementCollapsed');
        if (savedState !== null) {
            isGroupManagementCollapsed = savedState === 'true';
        }
        
        // Apply the saved state
        if (isGroupManagementCollapsed) {
            groupControls.classList.add('collapsed');
            groupHeader.classList.add('collapsed');
            groupToggle.classList.remove('expanded');
            groupToggle.textContent = '▼';
            groupToggle.title = 'Expand group management';
        } else {
            groupControls.classList.remove('collapsed');
            groupHeader.classList.remove('collapsed');
            groupToggle.classList.add('expanded');
            groupToggle.textContent = '▲';
            groupToggle.title = 'Collapse group management';
        }
    }

    // Storage keys for localStorage
    const STORAGE_KEYS = {
        TAGS_LIST: 'wheelGenerator_tagsList',
        CURRENT_ITEMS: 'wheelGenerator_currentItems',
        ORIGINAL_ITEMS: 'wheelGenerator_originalItems',
        SAVED_GROUPS: 'wheelGenerator_savedGroups'
    };

    /**
     * Saves the current tags list to localStorage
     */
    function saveTagsToStorage() {
        if (namesTags.length > 0) {
            localStorage.setItem(STORAGE_KEYS.TAGS_LIST, JSON.stringify(namesTags));
        } else {
            localStorage.removeItem(STORAGE_KEYS.TAGS_LIST);
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
     * Loads the tags list from localStorage
     */
    function loadTagsFromStorage() {
        const savedTags = localStorage.getItem(STORAGE_KEYS.TAGS_LIST);
        if (savedTags) {
            try {
                namesTags = JSON.parse(savedTags);
                renderTags();
            } catch (e) {
                console.warn('Failed to parse saved tags:', e);
                namesTags = [];
            }
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

    // ================================
    // GROUP MANAGEMENT FUNCTIONS
    // ================================

    /**
     * Saves a group of names to localStorage
     * @param {string} groupName - The name of the group
     * @param {Array} names - Array of names to save
     */
    function saveGroup(groupName, names) {
        if (!groupName || names.length === 0) return false;
        
        const savedGroups = getSavedGroups();
        savedGroups[groupName] = {
            names: [...names],
            dateCreated: new Date().toISOString(),
            dateModified: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.SAVED_GROUPS, JSON.stringify(savedGroups));
        return true;
    }

    /**
     * Loads a group of names from localStorage
     * @param {string} groupName - The name of the group to load
     * @returns {Array|null} - Array of names or null if not found
     */
    function loadGroup(groupName) {
        const savedGroups = getSavedGroups();
        return savedGroups[groupName] ? savedGroups[groupName].names : null;
    }

    /**
     * Deletes a group from localStorage
     * @param {string} groupName - The name of the group to delete
     */
    function deleteGroup(groupName) {
        const savedGroups = getSavedGroups();
        delete savedGroups[groupName];
        localStorage.setItem(STORAGE_KEYS.SAVED_GROUPS, JSON.stringify(savedGroups));
    }

    /**
     * Gets all saved groups from localStorage
     * @returns {Object} - Object containing all saved groups
     */
    function getSavedGroups() {
        try {
            const saved = localStorage.getItem(STORAGE_KEYS.SAVED_GROUPS);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.warn('Error loading saved groups:', e);
            return {};
        }
    }

    /**
     * Updates the group select dropdown with saved groups
     */
    function updateGroupSelect() {
        const groupSelect = document.getElementById('groupSelect');
        const savedGroups = getSavedGroups();
        
        // Clear existing options except the first one
        groupSelect.innerHTML = '<option value="">Choose a saved group...</option>';
        
        // Add saved groups as options
        Object.keys(savedGroups).sort().forEach(groupName => {
            const option = document.createElement('option');
            option.value = groupName;
            option.textContent = `${groupName} (${savedGroups[groupName].names.length} names)`;
            groupSelect.appendChild(option);
        });
        
        // Update button states
        updateGroupButtonStates();
    }

    /**
     * Updates the state of group management buttons
     */
    function updateGroupButtonStates() {
        const groupSelect = document.getElementById('groupSelect');
        const loadBtn = document.getElementById('loadGroupBtn');
        const deleteBtn = document.getElementById('deleteGroupBtn');
        
        const hasSelection = groupSelect.value !== '';
        loadBtn.disabled = !hasSelection;
        deleteBtn.disabled = !hasSelection;
    }

    // Load saved data on page load
    loadTagsFromStorage();
    loadWheelState();
    loadMutePreference();
    loadSoundPreference();
    loadThemePreference();
    loadGroupManagementState();

    /**
     * Add a new tag to the display
     * @param {string} tagText - The text for the tag
     */
    function addTag(tagText) {
        const trimmedText = tagText.trim();
        if (trimmedText === '' || namesTags.includes(trimmedText)) {
            return; // Don't add empty or duplicate tags
        }
        
        namesTags.push(trimmedText);
        renderTags();
        saveTagsToStorage();
    }

    /**
     * Remove a tag by index
     * @param {number} index - Index of tag to remove
     */
    function removeTag(index) {
        if (index >= 0 && index < namesTags.length) {
            namesTags.splice(index, 1);
            renderTags();
            saveTagsToStorage();
        }
    }

    /**
     * Render all tags in the display area
     */
    function renderTags() {
        tagsDisplay.innerHTML = '';
        namesTags.forEach((tagText, index) => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag';
            tagElement.innerHTML = `
                <span class="tag-text" title="${tagText}">${tagText}</span>
                <button class="tag-remove" onclick="removeTagAtIndex(${index})" title="Remove ${tagText}">×</button>
            `;
            tagsDisplay.appendChild(tagElement);
        });
        
        // Update placeholder text based on whether tags exist
        if (namesTags.length > 0) {
            tagInput.placeholder = 'Add another name...';
        } else {
            tagInput.placeholder = 'Enter names for the wheel...';
        }
    }

    /**
     * Global function to remove tag (called from onclick)
     * @param {number} index
     */
    window.removeTagAtIndex = function(index) {
        removeTag(index);
    };

    /**
     * Parse input text and add multiple tags (for paste functionality)
     * @param {string} text - Text to parse
     */
    function parseAndAddTags(text) {
        const items = text
            .split(/[\n,]+/)
            .map(s => s.trim())
            .filter(s => s.length > 0);
        
        items.forEach(item => addTag(item));
    }

    /**
     * Get current tags as an array (replaces parseInput)
     * @returns {string[]} array of names/numbers
     */
    function getCurrentTags() {
        return [...namesTags]; // Return a copy
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
     * Gets the current wheel color palette based on the active theme
     * @returns {Array} Array of color strings
     */
    function getWheelColorPalette() {
        const rootStyles = getComputedStyle(document.documentElement);
        return [
            rootStyles.getPropertyValue('--wheel-color-1').trim(),
            rootStyles.getPropertyValue('--wheel-color-2').trim(),
            rootStyles.getPropertyValue('--wheel-color-3').trim(),
            rootStyles.getPropertyValue('--wheel-color-4').trim(),
            rootStyles.getPropertyValue('--wheel-color-5').trim(),
            rootStyles.getPropertyValue('--wheel-color-6').trim(),
            rootStyles.getPropertyValue('--wheel-color-7').trim(),
            rootStyles.getPropertyValue('--wheel-color-8').trim(),
            rootStyles.getPropertyValue('--wheel-color-9').trim(),
            rootStyles.getPropertyValue('--wheel-color-10').trim()
        ];
    }

    /**
     * Gets the current wheel divider color based on the active theme
     * @returns {string} Divider color string
     */
    function getWheelDividerColor() {
        const rootStyles = getComputedStyle(document.documentElement);
        return rootStyles.getPropertyValue('--wheel-divider').trim();
    }

    /**
     * Gets the current wheel text color based on the active theme
     * @returns {string} Text color string
     */
    function getWheelTextColor() {
        const rootStyles = getComputedStyle(document.documentElement);
        return rootStyles.getPropertyValue('--wheel-text').trim();
    }

    /**
     * Gets the current wheel thickness color based on the active theme
     * @returns {string} Thickness color string
     */
    function getWheelThicknessColor() {
        const rootStyles = getComputedStyle(document.documentElement);
        return rootStyles.getPropertyValue('--wheel-thickness').trim();
    }

    /**
     * Gets the current wheel outline color based on the active theme
     * @returns {string} Outline color string
     */
    function getWheelOutlineColor() {
        const rootStyles = getComputedStyle(document.documentElement);
        return rootStyles.getPropertyValue('--wheel-outline').trim();
    }

    /**
     * Gets the current wheel center line color based on the active theme
     * @returns {string} Center line color string
     */
    function getWheelCenterLineColor() {
        const rootStyles = getComputedStyle(document.documentElement);
        return rootStyles.getPropertyValue('--wheel-center-line').trim();
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
        const palette = getWheelColorPalette();
        const dividerColor = getWheelDividerColor();
        const textColor = getWheelTextColor();
        const thicknessColor = getWheelThicknessColor();
        const outlineColor = getWheelOutlineColor();
        const centerLineColor = getWheelCenterLineColor();
        
        // Draw each segment as a horizontal stripe across the narrow width
        for (let i = 0; i < items.length; i++) {
            // Compute wrapped starting y position based on offset
            const rawStart = y + i * segHeight + offset;
            let sy = ((rawStart - y) % wheelHeight + wheelHeight) % wheelHeight + y;
            // Fill segment rectangle
            ctx.fillStyle = palette[i % palette.length];
            ctx.fillRect(x, sy, wheelWidth, segHeight);
            // Divider line between segments (horizontal)
            ctx.strokeStyle = dividerColor;
            ctx.lineWidth = 2;
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
            ctx.fillStyle = textColor;
            const fontSize = Math.min(20, segHeight * 0.5);
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillText(items[i], x + wheelWidth / 2, sy + segHeight / 2);
            ctx.restore();
        }
        // Draw bottom divider line to close the last segment
        ctx.strokeStyle = dividerColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + wheelHeight);
        ctx.lineTo(x + wheelWidth, y + wheelHeight);
        ctx.stroke();
        // Simulate thickness with simple rectangles above and below the wheel instead of semi‑circles
        const thickness = wheelHeight * 0.1; // 10% of the wheel height as thickness
        ctx.fillStyle = thicknessColor;
        // Top thickness rectangle
        ctx.fillRect(x, y - thickness, wheelWidth, thickness);
        // Bottom thickness rectangle
        ctx.fillRect(x, y + wheelHeight, wheelWidth, thickness);
        // Outline of the wheel rectangle
        ctx.strokeStyle = outlineColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, wheelWidth, wheelHeight);
        // Centre indicator: horizontal line across the middle with a contrasting border
        ctx.save();
        const centerY = ch / 2;
        // Draw a slightly thicker white line underneath to act as a border
        ctx.strokeStyle = centerLineColor;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(x, centerY);
        ctx.lineTo(x + wheelWidth, centerY);
        ctx.stroke();
        // Draw the accent line on top
        ctx.strokeStyle = palette[0]; // Use the first wheel color as accent
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
        
        // Calculate position relative to wheel start, accounting for offset
        const relativePos = centerY - y - offset;
        // Normalize to positive range and wrap around
        const normalizedPos = ((relativePos % wheelHeight) + wheelHeight) % wheelHeight;
        // Find which segment this position falls into
        const index = Math.floor(normalizedPos / segHeight);
        return index % items.length;
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
        
        // Hide any existing overlay result
        overlayResult.style.display = 'none';
        
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
        // Center of selectedIndex segment should be at: y + selectedIndex * segHeight + segHeight / 2 + offset = centerY
        // Therefore: offset = centerY - y - selectedIndex * segHeight - segHeight / 2
        const finalOffset = centerY - y - selectedIndex * segHeight - segHeight / 2;
        // Add several full rotations
        const rotations = 3;
        const targetOffset = finalOffset + rotations * wheelHeight;
        const startOffset = currentOffset;
        const distance = targetOffset - startOffset;
        const duration = 4000;
        const startTime = performance.now();
        isSpinning = true;
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
                // Show overlay with the selected value and keep it visible
                overlayResult.innerHTML = resultContent;
                overlayResult.style.animation = 'none';
                overlayResult.offsetWidth; // force reflow to restart animation
                overlayResult.style.display = 'block';
                // Trigger appear animation
                overlayResult.style.animation = 'overlayAppear 0.5s forwards';
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
        
        const items = getCurrentTags();
        if (items.length === 0) {
            alert('Please add at least one name or number to generate the wheel.');
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
        drawWheelWithOffset(currentItems, currentOffset);
        
        // Save the current wheel state
        saveWheelState();
    });

    // Event listener for spin button
    spinBtn.addEventListener('click', spinWheel);

    // Event listener for reset button
    resetBtn.addEventListener('click', () => {
        if (originalItems.length === 0) {
            return;
        }
        
        // Hide any existing overlay result
        overlayResult.style.display = 'none';
        
        // Reset state to original
        currentItems = originalItems.slice();
        currentOffset = 0;
        selectedIndex = null;
        isSpinning = false;
        drawWheelWithOffset(currentItems, currentOffset);
        
        // Save the reset wheel state
        saveWheelState();
    });

    // Tag input event listeners
    tagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = tagInput.value.trim();
            if (value) {
                addTag(value);
                tagInput.value = '';
            }
        }
    });

    // Handle paste events to add multiple tags
    tagInput.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        parseAndAddTags(pastedText);
        tagInput.value = '';
    });

    // Click on container focuses the input
    tagInputContainer.addEventListener('click', () => {
        tagInput.focus();
    });

    // Mute button event listener
    muteBtn.addEventListener('click', toggleMute);

    // Sound selection event listener
    soundSelect.addEventListener('change', onSoundChange);

    // Theme toggle event listener
    themeBtn.addEventListener('click', toggleTheme);

    // Group management event listeners
    saveGroupBtn.addEventListener('click', () => {
        const groupName = groupNameInput.value.trim();
        if (!groupName) {
            alert('Please enter a group name');
            return;
        }
        
        if (namesTags.length === 0) {
            alert('Please add some names before saving a group');
            return;
        }
        
        const success = saveGroup(groupName, namesTags);
        if (success) {
            groupNameInput.value = '';
            updateGroupSelect();
            alert(`Group "${groupName}" saved successfully!`);
        }
    });

    loadGroupBtn.addEventListener('click', () => {
        const selectedGroup = groupSelect.value;
        if (!selectedGroup) {
            alert('Please select a group to load');
            return;
        }
        
        const groupNames = loadGroup(selectedGroup);
        if (groupNames) {
            // Clear current tags and add the loaded ones
            namesTags = [...groupNames];
            renderTags();
            saveTagsToStorage();
            
            // Clear and regenerate the wheel
            currentItems = [];
            originalItems = [];
            clearWheelState();
            generateWheel();
            
            alert(`Group "${selectedGroup}" loaded successfully!`);
        } else {
            alert('Error loading group');
        }
    });

    deleteGroupBtn.addEventListener('click', () => {
        const selectedGroup = groupSelect.value;
        if (!selectedGroup) {
            alert('Please select a group to delete');
            return;
        }
        
        if (confirm(`Are you sure you want to delete the group "${selectedGroup}"?`)) {
            deleteGroup(selectedGroup);
            updateGroupSelect();
            alert(`Group "${selectedGroup}" deleted successfully!`);
        }
    });

    groupSelect.addEventListener('change', updateGroupButtonStates);

    // Group management toggle event listeners
    groupToggle.addEventListener('click', toggleGroupManagement);
    groupHeader.addEventListener('click', toggleGroupManagement);

    // Initialize group management
    updateGroupSelect();

    // Clear Names button event listener
    const clearNamesBtn = document.getElementById('clearNamesBtn');
    clearNamesBtn.addEventListener('click', () => {
        namesTags = [];
        renderTags();
        saveTagsToStorage();
    });
    
    // Easter Egg: Side Scroll Runner Game
    const runnerGameContainer = document.getElementById('runnerGameContainer');
    const runnerGameCanvas = document.getElementById('runnerGameCanvas');
    const closeRunnerGame = document.getElementById('closeRunnerGame');
    let runnerGameActive = false;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === '.') {
            runnerGameContainer.style.display = 'flex';
            runnerGameActive = true;
            startRunnerGame();
        }
    });
    closeRunnerGame.addEventListener('click', () => {
        runnerGameContainer.style.display = 'none';
        runnerGameActive = false;
    });

    function startRunnerGame() {
        const ctx = runnerGameCanvas.getContext('2d');
        let player = { x: 60, y: 220, vy: 0, w: 32, h: 48, jumping: false };
        let ground = 268;
        let gravity = 1.2;
        let obstacles = [];
        let frame = 0;
        let score = 0;
        let gameOver = false;
        let nextObstacleFrame = 60;
        function spawnObstacle() {
            // Obstacles spawn above the ground so jumping is required
            const obsHeight = 32 + Math.random()*24;
            obstacles.push({ x: 800, y: ground - obsHeight, w: 24 + Math.random()*24, h: obsHeight });
            // Vary the next obstacle spawn frame for challenge
            nextObstacleFrame = frame + 40 + Math.floor(Math.random()*60);
        }

        function resetGame() {
            player.y = ground - player.h;
            player.vy = 0;
            player.jumping = false;
            obstacles = [];
            frame = 0;
            score = 0;
            gameOver = false;
            nextObstacleFrame = 60;
        }

        function draw() {
            ctx.clearRect(0, 0, 800, 300);
            // Draw ground
            ctx.fillStyle = '#333';
            ctx.fillRect(0, ground, 800, 32);
            // Draw player
            ctx.fillStyle = '#ff7518';
            ctx.fillRect(player.x, player.y, player.w, player.h);
            // Draw obstacles
            ctx.fillStyle = '#fff';
            for (let obs of obstacles) {
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
            }
            // Draw score
            ctx.font = 'bold 24px Poppins, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText('Score: ' + score, 24, 40);
            if (gameOver) {
                ctx.font = 'bold 36px Poppins, sans-serif';
                ctx.fillStyle = '#ff7518';
                ctx.fillText('Game Over!', 300, 150);
                ctx.font = 'bold 20px Poppins, sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText('Press Space to Restart', 300, 180);
            }
        }

        function update() {
            if (!runnerGameActive) return;
            if (gameOver) return;
            frame++;
            score = Math.floor(frame/5);
            // Player physics
            player.vy += gravity;
            player.y += player.vy;
            if (player.y > ground - player.h) {
                player.y = ground - player.h;
                player.vy = 0;
                player.jumping = false;
            }
            // Obstacles
            for (let obs of obstacles) {
                obs.x -= 6;
            }
            // Remove off-screen obstacles
            obstacles = obstacles.filter(obs => obs.x + obs.w > 0);
            // Spawn new obstacles with variable spacing
            if (frame === nextObstacleFrame) spawnObstacle();
            // Collision detection
            for (let obs of obstacles) {
                if (
                    player.x < obs.x + obs.w &&
                    player.x + player.w > obs.x &&
                    player.y < obs.y + obs.h &&
                    player.y + player.h > obs.y
                ) {
                    gameOver = true;
                }
            }
        }

        function loop() {
            draw();
            update();
            if (runnerGameActive) requestAnimationFrame(loop);
        }
        resetGame();
        loop();

        // Jump control
        runnerGameCanvas.tabIndex = 0;
        runnerGameCanvas.focus();
        document.addEventListener('keydown', runnerKeyHandler);
        function runnerKeyHandler(e) {
            if (!runnerGameActive) return;
            if (gameOver && e.code === 'Space') {
                resetGame();
            } else if (!gameOver && (e.code === 'Space' || e.code === 'ArrowUp')) {
                if (!player.jumping) {
                    player.vy = -18;
                    player.jumping = true;
                }
            }
        }
        closeRunnerGame.addEventListener('click', () => {
            document.removeEventListener('keydown', runnerKeyHandler);
        }, { once: true });
    }
});