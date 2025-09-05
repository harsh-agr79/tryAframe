// VR Interactive Object Room - Enhanced JavaScript Logic

// Global variables
let objectCounter = 0;
let removeMode = false;
let maxObjects = 20;
let spawnedObjects = [];
let sceneReady = false;
let isSpawning = false; // Prevent rapid spawning

// Object configurations
const OBJECT_CONFIGS = {
    'box': { color: '#4CC3D9', shape: 'box' },
    'sphere': { color: '#EF2D5E', shape: 'sphere' },
    'cylinder': { color: '#FFC65D', shape: 'cylinder' },
    'cone': { color: '#7BC8A4', shape: 'cone' },
    'torus': { color: '#93648D', shape: 'torus' }
};

// Initialize everything when DOM and scene are ready
window.addEventListener('load', function() {
    console.log('Window loaded, initializing...');
    
    // Add UI elements first
    addInstructions();
    addObjectCounter();
    addRemoveModeIndicator();
    
    // Wait for scene to be ready
    const scene = document.querySelector('a-scene');
    if (scene) {
        if (scene.hasLoaded) {
            initializeApp();
        } else {
            scene.addEventListener('loaded', initializeApp);
        }
    } else {
        // Fallback - try again after a delay
        setTimeout(initializeApp, 2000);
    }
});

function initializeApp() {
    console.log('Initializing VR app...');
    sceneReady = true;
    
    registerComponents();
    setupEventListeners();
    setupMenuButtons();
    setupVRControllers();
    
    console.log('VR app initialized successfully');
    console.log('Use keys 1-5 to spawn objects, R for remove mode, C to clear all');
}

// Register enhanced A-Frame components
function registerComponents() {
    // Enhanced menu clickable component with debouncing
    AFRAME.registerComponent('menu-clickable', {
        init: function() {
            const el = this.el;
            let lastClick = 0;
            
            el.addEventListener('click', function(evt) {
                evt.stopPropagation();
                const now = Date.now();
                if (now - lastClick < 500) return; // Debounce clicks
                lastClick = now;
                
                const buttonId = el.getAttribute('data-spawn-type');
                console.log(`Menu button clicked: ${buttonId}`);
                if (buttonId && !isSpawning) {
                    spawnObjectByType(buttonId);
                }
            });
            
            // Enhanced hover effects
            el.addEventListener('mouseenter', function() {
                el.setAttribute('scale', '1.1 1.1 1.1');
                el.setAttribute('material', 'opacity', 0.8);
            });
            
            el.addEventListener('mouseleave', function() {
                el.setAttribute('scale', '1 1 1');
                el.setAttribute('material', 'opacity', 1);
            });
        }
    });

    // Enhanced interactable object component with full VR support
    AFRAME.registerComponent('interactable-object', {
        init: function() {
            const el = this.el;
            
            // Make it fully VR interactive
            el.setAttribute('grabbable', '');
            el.setAttribute('stretchable', '');
            el.setAttribute('draggable', '');
            
            // Add proper classes for targeting
            el.classList.add('clickable');
            el.classList.add('interactable');
            el.classList.add('grabbable');
            
            // Handle grab events
            el.addEventListener('grab-start', function(evt) {
                console.log('Object grabbed:', el.id);
                el.setAttribute('material', 'opacity', 0.8);
                showMessage('Grabbed object!');
            });
            
            el.addEventListener('grab-end', function(evt) {
                console.log('Object released:', el.id);
                el.setAttribute('material', 'opacity', 1);
            });
            
            // Handle click for removal
            el.addEventListener('click', function(evt) {
                evt.stopPropagation();
                if (removeMode) {
                    removeObject(el);
                }
            });
            
            // Enhanced hover effects
            el.addEventListener('mouseenter', function() {
                if (removeMode) {
                    el.setAttribute('material', 'color', '#FF6B6B');
                    el.setAttribute('scale', '1.1 1.1 1.1');
                    showMessage('Click to remove this object');
                } else {
                    el.setAttribute('scale', '1.05 1.05 1.05');
                    el.setAttribute('material', 'opacity', 0.9);
                }
            });
            
            el.addEventListener('mouseleave', function() {
                if (removeMode) {
                    const originalColor = el.getAttribute('data-original-color');
                    if (originalColor) {
                        el.setAttribute('material', 'color', originalColor);
                    }
                    el.setAttribute('scale', '1 1 1');
                } else {
                    el.setAttribute('scale', '1 1 1');
                    el.setAttribute('material', 'opacity', 1);
                }
            });
        }
    });

    // Special action button component
    AFRAME.registerComponent('action-button', {
        schema: {
            action: { type: 'string' }
        },
        init: function() {
            const el = this.el;
            const action = this.data.action;
            let lastClick = 0;
            
            el.addEventListener('click', function(evt) {
                evt.stopPropagation();
                const now = Date.now();
                if (now - lastClick < 300) return; // Debounce
                lastClick = now;
                
                console.log(`${action} button clicked`);
                
                switch(action) {
                    case 'remove':
                        toggleRemoveMode();
                        break;
                    case 'clear':
                        clearAllObjects();
                        break;
                }
            });
            
            el.addEventListener('mouseenter', function() {
                el.setAttribute('scale', '1.1 1.1 1.1');
            });
            
            el.addEventListener('mouseleave', function() {
                el.setAttribute('scale', '1 1 1');
            });
        }
    });
}

// Setup VR controllers with proper raycasting
function setupVRControllers() {
    const leftHand = document.querySelector('#leftHand');
    const rightHand = document.querySelector('#rightHand');
    
    if (leftHand) {
        leftHand.setAttribute('raycaster', {
            objects: '.clickable',
            far: 20,
            interval: 1000
        });
    }
    
    if (rightHand) {
        rightHand.setAttribute('raycaster', {
            objects: '.clickable', 
            far: 20,
            interval: 1000
        });
    }
    
    console.log('VR controllers configured');
}

// Enhanced menu button setup
function setupMenuButtons() {
    console.log('Setting up menu buttons...');
    
    // Setup spawn buttons with single event system
    const spawnButtons = [
        { id: 'spawn-box', type: 'box' },
        { id: 'spawn-sphere', type: 'sphere' },
        { id: 'spawn-cylinder', type: 'cylinder' },
        { id: 'spawn-cone', type: 'cone' },
        { id: 'spawn-torus', type: 'torus' }
    ];
    
    spawnButtons.forEach(button => {
        const element = document.querySelector(`#${button.id}`);
        if (element) {
            element.setAttribute('data-spawn-type', button.type);
            element.setAttribute('menu-clickable', '');
            console.log(`Configured ${button.id} for ${button.type}`);
        }
    });
    
    // Setup action buttons
    const removeButton = document.querySelector('#remove-mode');
    if (removeButton) {
        removeButton.setAttribute('action-button', { action: 'remove' });
    }
    
    const clearButton = document.querySelector('#clear-all');
    if (clearButton) {
        clearButton.setAttribute('action-button', { action: 'clear' });
    }
    
    console.log('Menu buttons configured successfully');
}

// Enhanced event listeners
function setupEventListeners() {
    // Keyboard controls with debouncing
    let lastKeyPress = 0;
    
    document.addEventListener('keydown', function(evt) {
        const now = Date.now();
        if (now - lastKeyPress < 200) return; // Debounce rapid key presses
        lastKeyPress = now;
        
        console.log(`Key pressed: ${evt.key}`);
        
        switch(evt.key) {
            case '1':
                console.log('Spawning box via keyboard');
                spawnObjectByType('box');
                break;
            case '2':
                console.log('Spawning sphere via keyboard');
                spawnObjectByType('sphere');
                break;
            case '3':
                console.log('Spawning cylinder via keyboard');
                spawnObjectByType('cylinder');
                break;
            case '4':
                console.log('Spawning cone via keyboard');
                spawnObjectByType('cone');
                break;
            case '5':
                console.log('Spawning torus via keyboard');
                spawnObjectByType('torus');
                break;
            case 'r':
            case 'R':
                console.log('Toggling remove mode via keyboard');
                toggleRemoveMode();
                break;
            case 'c':
            case 'C':
                console.log('Clearing all objects via keyboard');
                clearAllObjects();
                break;
        }
    });
    
    console.log('Event listeners configured');
}

// Enhanced spawn function with better VR support
function spawnObjectByType(type) {
    if (!sceneReady) {
        console.warn('Scene not ready, cannot spawn object');
        return;
    }
    
    if (isSpawning) {
        console.warn('Already spawning, please wait');
        return;
    }
    
    if (objectCounter >= maxObjects) {
        showMessage('Maximum objects reached!');
        return;
    }
    
    const config = OBJECT_CONFIGS[type];
    if (!config) {
        console.error(`Unknown object type: ${type}`);
        return;
    }
    
    isSpawning = true;
    console.log(`Spawning ${type} with color ${config.color}`);
    
    const scene = document.querySelector('a-scene');
    const camera = document.querySelector('#head');
    
    // Enhanced spawn position calculation
    let spawnPos = { x: 0, y: 2, z: -1 };
    
    if (camera) {
        const cameraPos = camera.getAttribute('position') || { x: 0, y: 1.6, z: 3 };
        spawnPos = {
            x: cameraPos.x + (Math.random() - 0.5) * 2,
            y: cameraPos.y + 0.5,
            z: cameraPos.z - 2
        };
    }
    
    // Create entity with unique ID
    const entity = document.createElement('a-entity');
    entity.id = `object-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set position and rotation
    entity.setAttribute('position', spawnPos);
    entity.setAttribute('rotation', {
        x: Math.random() * 360,
        y: Math.random() * 360,
        z: Math.random() * 360
    });
    
    // Set geometry with enhanced randomization
    const geometryAttribs = { primitive: config.shape };
    
    switch(type) {
        case 'box':
            geometryAttribs.width = 0.4 + Math.random() * 0.4;
            geometryAttribs.height = 0.4 + Math.random() * 0.4;
            geometryAttribs.depth = 0.4 + Math.random() * 0.4;
            break;
        case 'sphere':
            geometryAttribs.radius = 0.2 + Math.random() * 0.25;
            break;
        case 'cylinder':
            geometryAttribs.radius = 0.15 + Math.random() * 0.2;
            geometryAttribs.height = 0.4 + Math.random() * 0.5;
            break;
        case 'cone':
            geometryAttribs.radiusBottom = 0.15 + Math.random() * 0.2;
            geometryAttribs.height = 0.4 + Math.random() * 0.5;
            break;
        case 'torus':
            geometryAttribs.radius = 0.25 + Math.random() * 0.2;
            geometryAttribs.radiusTubular = 0.04 + Math.random() * 0.04;
            break;
    }
    
    entity.setAttribute('geometry', geometryAttribs);
    
    // Enhanced material with better VR visibility
    entity.setAttribute('material', {
        color: config.color,
        roughness: 0.6,
        metalness: 0.2,
        transparent: false,
        opacity: 1
    });
    
    // Store original color and add enhanced physics
    entity.setAttribute('data-original-color', config.color);
    entity.setAttribute('dynamic-body', { 
        mass: 1, 
        shape: 'auto',
        linearDamping: 0.1,
        angularDamping: 0.1
    });
    entity.setAttribute('shadow', 'cast: true; receive: true');
    
    // Add enhanced interactable component
    entity.setAttribute('interactable-object', '');
    entity.classList.add('spawning');
    
    // Add to scene with animation
    entity.setAttribute('scale', '0.1 0.1 0.1');
    scene.appendChild(entity);
    
    // Animate spawn
    entity.setAttribute('animation', {
        property: 'scale',
        to: '1 1 1',
        dur: 500,
        easing: 'easeOutElastic'
    });
    
    spawnedObjects.push(entity);
    objectCounter++;
    updateObjectCounter();
    
    // Show enhanced spawn indicator
    showSpawnIndicator(spawnPos);
    
    // Remove spawning state and animation class
    setTimeout(() => {
        entity.classList.remove('spawning');
        entity.removeAttribute('animation');
        isSpawning = false;
    }, 500);
    
    console.log(`Successfully spawned ${type} object (total: ${objectCounter})`);
    showMessage(`✨ Spawned ${type} object!`);
}

// Enhanced remove mode with better VR controller support
function toggleRemoveMode() {
    removeMode = !removeMode;
    const removeButton = document.querySelector('#remove-mode');
    const removeModeIndicator = document.querySelector('#remove-mode-indicator');
    const leftHand = document.querySelector('#leftHand');
    const rightHand = document.querySelector('#rightHand');
    
    if (removeMode) {
        // Update button appearance
        if (removeButton) {
            removeButton.setAttribute('material', 'color', '#C0392B');
            removeButton.setAttribute('animation__pulse', {
                property: 'scale',
                to: '1.2 1.2 1.2',
                dir: 'alternate',
                dur: 500,
                loop: true
            });
        }
        
        // Show remove mode indicator
        if (removeModeIndicator) {
            removeModeIndicator.style.display = 'block !important';
            removeModeIndicator.style.animation = 'pulse 1s infinite';
        }
        
        // Update VR controller raycasters to target objects
        if (leftHand) {
            leftHand.setAttribute('raycaster', {
                objects: '.clickable, .interactable, .grabbable',
                far: 20,
                interval: 100
            });
        }
        if (rightHand) {
            rightHand.setAttribute('raycaster', {
                objects: '.clickable, .interactable, .grabbable',
                far: 20,
                interval: 100
            });
        }
        
        // Add visual feedback to all spawned objects
        spawnedObjects.forEach(obj => {
            if (obj && obj.parentNode) {
                obj.classList.add('remove-mode-active');
                obj.setAttribute('animation__glow', {
                    property: 'material.opacity',
                    to: '0.6',
                    dir: 'alternate',
                    dur: 800,
                    loop: true
                });
                obj.setAttribute('animation__outline', {
                    property: 'scale',
                    to: '1.05 1.05 1.05',
                    dir: 'alternate',
                    dur: 600,
                    loop: true
                });
            }
        });
        
        showMessage('🗑️ REMOVE MODE ON - Point and click objects to delete them');
        console.log('Remove mode activated with enhanced VR targeting');
    } else {
        // Reset button appearance
        if (removeButton) {
            removeButton.setAttribute('material', 'color', '#E74C3C');
            removeButton.removeAttribute('animation__pulse');
            removeButton.setAttribute('scale', '1 1 1');
        }
        
        // Hide remove mode indicator
        if (removeModeIndicator) {
            removeModeIndicator.style.display = 'none !important';
        }
        
        // Reset VR controller raycasters to menu only
        if (leftHand) {
            leftHand.setAttribute('raycaster', {
                objects: '.clickable',
                far: 20,
                interval: 1000
            });
        }
        if (rightHand) {
            rightHand.setAttribute('raycaster', {
                objects: '.clickable',
                far: 20,
                interval: 1000
            });
        }
        
        // Remove visual feedback from all objects
        spawnedObjects.forEach(obj => {
            if (obj && obj.parentNode) {
                obj.classList.remove('remove-mode-active');
                obj.removeAttribute('animation__glow');
                obj.removeAttribute('animation__outline');
                obj.setAttribute('material', 'opacity', 1);
                obj.setAttribute('scale', '1 1 1');
                const originalColor = obj.getAttribute('data-original-color');
                if (originalColor) {
                    obj.setAttribute('material', 'color', originalColor);
                }
            }
        });
        
        showMessage('✅ Remove mode OFF');
        console.log('Remove mode deactivated');
    }
}

// Enhanced object removal with better animation
function removeObject(objectEl) {
    if (!objectEl || !objectEl.parentNode) return;
    
    console.log(`Removing object: ${objectEl.id}`);
    
    // Enhanced removal animation
    objectEl.setAttribute('animation__shrink', {
        property: 'scale',
        to: '0 0 0',
        dur: 400,
        easing: 'easeInQuint'
    });
    
    objectEl.setAttribute('animation__spin', {
        property: 'rotation',
        to: '720 720 720',
        dur: 400,
        easing: 'easeInQuint'
    });
    
    objectEl.setAttribute('animation__fade', {
        property: 'material.opacity',
        to: '0',
        dur: 300
    });
    
    setTimeout(() => {
        if (objectEl.parentNode) {
            objectEl.parentNode.removeChild(objectEl);
        }
        
        // Update counter and array
        const index = spawnedObjects.indexOf(objectEl);
        if (index > -1) {
            spawnedObjects.splice(index, 1);
        }
        objectCounter--;
        updateObjectCounter();
        
        console.log(`Object removed (remaining: ${objectCounter})`);
        showMessage('💥 Object destroyed!');
    }, 400);
}

// Enhanced clear all with staggered animation
function clearAllObjects() {
    console.log('Clearing all objects with animation');
    
    if (spawnedObjects.length === 0) {
        showMessage('No objects to clear!');
        return;
    }
    
    // Staggered removal animation
    spawnedObjects.forEach((obj, index) => {
        if (obj && obj.parentNode) {
            setTimeout(() => {
                obj.setAttribute('animation__clear', {
                    property: 'scale',
                    to: '0 0 0',
                    dur: 300
                });
                obj.setAttribute('animation__fade', {
                    property: 'material.opacity',
                    to: '0',
                    dur: 250
                });
                
                setTimeout(() => {
                    if (obj.parentNode) {
                        obj.parentNode.removeChild(obj);
                    }
                }, 300);
            }, index * 50); // Stagger by 50ms
        }
    });
    
    // Reset counters after animation
    setTimeout(() => {
        spawnedObjects = [];
        objectCounter = 0;
        updateObjectCounter();
        
        if (removeMode) {
            toggleRemoveMode();
        }
        
        console.log('All objects cleared');
        showMessage('🧹 All objects cleared with style!');
    }, spawnedObjects.length * 50 + 300);
}

// Enhanced spawn indicator
function showSpawnIndicator(position) {
    const indicator = document.querySelector('#spawn-indicator');
    if (indicator) {
        indicator.setAttribute('position', position);
        indicator.setAttribute('visible', true);
        indicator.setAttribute('scale', '0.5 0.5 0.5');
        
        // Enhanced spawn animation
        indicator.setAttribute('animation__grow', {
            property: 'scale',
            to: '1.5 1.5 1.5',
            dur: 300,
            easing: 'easeOutQuad'
        });
        
        setTimeout(() => {
            indicator.setAttribute('animation__shrink', {
                property: 'scale',
                to: '0 0 0',
                dur: 200
            });
            
            setTimeout(() => {
                indicator.setAttribute('visible', false);
                indicator.removeAttribute('animation__grow');
                indicator.removeAttribute('animation__shrink');
            }, 200);
        }, 800);
    }
}

// Enhanced UI functions (keeping all original functionality)
function addRemoveModeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'remove-mode-indicator';
    indicator.innerHTML = '🗑️ REMOVE MODE ACTIVE';
    
    indicator.style.cssText = `
        position: fixed !important;
        top: 70px !important;
        right: 20px !important;
        background: #E74C3C !important;
        color: white !important;
        padding: 10px 15px !important;
        border-radius: 8px !important;
        font-weight: bold !important;
        font-size: 14px !important;
        z-index: 1000 !important;
        display: none !important;
        border: 2px solid #C0392B !important;
        text-align: center !important;
        box-shadow: 0 0 15px rgba(231, 76, 60, 0.7) !important;
    `;
    
    document.body.appendChild(indicator);
    console.log('Enhanced remove mode indicator added');
}

function addInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.innerHTML = `
        <h3>🎮 VR Object Room Controls</h3>
        <ul>
            <li><strong>1:</strong> Spawn Box (Blue)</li>
            <li><strong>2:</strong> Spawn Sphere (Red)</li>
            <li><strong>3:</strong> Spawn Cylinder (Yellow)</li>
            <li><strong>4:</strong> Spawn Cone (Green)</li>
            <li><strong>5:</strong> Spawn Torus (Purple)</li>
            <li><strong>R:</strong> Toggle remove mode</li>
            <li><strong>C:</strong> Clear all objects</li>
        </ul>
        <p><em>In VR: Use controllers to point and click!</em></p>
    `;
    
    instructions.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        left: 10px !important;
        background: rgba(44, 62, 80, 0.9) !important;
        color: #ECF0F1 !important;
        padding: 15px !important;
        border-radius: 10px !important;
        font-family: Arial, sans-serif !important;
        font-size: 12px !important;
        z-index: 1000 !important;
        border: 2px solid #34495E !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
        max-width: 250px !important;
    `;
    
    document.body.appendChild(instructions);
    console.log('Enhanced instructions added');
}

function addObjectCounter() {
    const counter = document.createElement('div');
    counter.className = 'object-counter';
    counter.id = 'object-counter';
    counter.innerHTML = `Objects: <span id="count">0</span>/${maxObjects}`;
    
    counter.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: #2C3E50 !important;
        color: #ECF0F1 !important;
        padding: 12px 18px !important;
        border-radius: 10px !important;
        border: 2px solid #34495E !important;
        font-family: Arial, sans-serif !important;
        font-size: 16px !important;
        font-weight: bold !important;
        z-index: 1000 !important;
        display: block !important;
        min-width: 140px !important;
        text-align: center !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
    `;
    
    document.body.appendChild(counter);
    console.log('Enhanced object counter added');
}

function updateObjectCounter() {
    const counter = document.querySelector('#object-counter');
    const countSpan = document.querySelector('#count');
    
    if (counter && countSpan) {
        countSpan.textContent = objectCounter;
        
        // Enhanced color feedback
        if (objectCounter >= maxObjects) {
            counter.style.backgroundColor = '#E74C3C !important';
            counter.style.color = '#FFFFFF !important';
            counter.style.animation = 'pulse 1s infinite';
        } else if (objectCounter >= maxObjects * 0.8) {
            counter.style.backgroundColor = '#F39C12 !important';
            counter.style.color = '#FFFFFF !important';
            counter.style.animation = '';
        } else {
            counter.style.backgroundColor = '#2C3E50 !important';
            counter.style.color = '#ECF0F1 !important';
            counter.style.animation = '';
        }
        
        console.log(`Object counter updated: ${objectCounter}/${maxObjects}`);
    }
}

function showMessage(message) {
    console.log('Message:', message);
    
    let messageEl = document.querySelector('#temp-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'temp-message';
        messageEl.style.cssText = `
            position: fixed !important;
            bottom: 30px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: #3498DB !important;
            color: white !important;
            padding: 15px 30px !important;
            border-radius: 25px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            z-index: 1000 !important;
            display: none !important;
            border: 2px solid #2980B9 !important;
            box-shadow: 0 6px 12px rgba(0,0,0,0.3) !important;
            animation: slideIn 0.3s ease-out !important;
        `;
        document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block !important';
    
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease-in !important';
        setTimeout(() => {
            messageEl.style.display = 'none !important';
            messageEl.style.animation = 'slideIn 0.3s ease-out !important';
        }, 300);
    }, 2200);
}

// Enhanced debugging interface
window.VRApp = {
    spawn: spawnObjectByType,
    clear: clearAllObjects,
    toggleRemove: toggleRemoveMode,
    getCount: () => objectCounter,
    getObjects: () => spawnedObjects,
    isRemoveMode: () => removeMode,
    isSpawning: () => isSpawning,
    // New debugging functions
    forceRemoveMode: () => { removeMode = false; toggleRemoveMode(); },
    spawnRandom: () => {
        const types = Object.keys(OBJECT_CONFIGS);
        const randomType = types[Math.floor(Math.random() * types.length)];
        spawnObjectByType(randomType);
    },
    getStats: () => ({
        objectCounter,
        removeMode,
        isSpawning,
        sceneReady,
        objectsInScene: spawnedObjects.length
    })
};

console.log('🎮 Enhanced VR Interactive Object Room loaded and ready!');
console.log('Press 1-5 to spawn objects, R for remove mode, C to clear all');
console.log('Try VRApp.spawnRandom() in console for fun!');
