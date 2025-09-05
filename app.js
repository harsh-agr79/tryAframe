// VR Interactive Object Room - JavaScript Logic

// Global variables
let objectCounter = 0;
let removeMode = false;
let maxObjects = 20;
let spawnedObjects = [];
let sceneReady = false;

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
        setTimeout(initializeApp, 2000);
    }
});

function initializeApp() {
    console.log('Initializing VR app...');
    sceneReady = true;
    
    registerComponents();
    setupEventListeners();
    setupMenuButtons();
    
    console.log('VR app initialized successfully');
}

// Register A-Frame components
function registerComponents() {
    // Enhanced grabbable component for spawned objects
    AFRAME.registerComponent('grabbable-object', {
        init: function() {
            const el = this.el;
            
            // Make it grabbable by super-hands
            el.setAttribute('grabbable', '');
            el.setAttribute('stretchable', '');
            el.setAttribute('draggable', '');
            
            // Add to clickable class for raycaster
            el.classList.add('clickable');
            el.classList.add('interactable');
            
            // Handle grab events
            el.addEventListener('grab-start', function() {
                console.log('Object grabbed:', el.id);
                el.setAttribute('material', 'opacity', 0.8);
            });
            
            el.addEventListener('grab-end', function() {
                console.log('Object released:', el.id);
                el.setAttribute('material', 'opacity', 1);
            });
            
            // Handle click for removal
            el.addEventListener('click', function(evt) {
                evt.stopPropagation(); // Prevent event bubbling
                if (removeMode) {
                    removeObject(el);
                }
            });
            
            // Hover effects
            el.addEventListener('mouseenter', function() {
                if (removeMode) {
                    el.setAttribute('material', 'color', '#FF6B6B');
                } else {
                    el.setAttribute('scale', '1.05 1.05 1.05');
                }
            });
            
            el.addEventListener('mouseleave', function() {
                if (removeMode) {
                    const originalColor = el.getAttribute('data-original-color');
                    if (originalColor) {
                        el.setAttribute('material', 'color', originalColor);
                    }
                } else {
                    el.setAttribute('scale', '1 1 1');
                }
            });
        }
    });

    // Menu button component (fixed to prevent double spawning)
    AFRAME.registerComponent('spawn-button', {
        schema: {
            objectType: { type: 'string' }
        },
        init: function() {
            const el = this.el;
            const objectType = this.data.objectType;
            
            // Single click handler to prevent double spawning
            el.addEventListener('click', function(evt) {
                evt.stopPropagation();
                console.log(`Spawning ${objectType} from menu button`);
                spawnObjectByType(objectType);
            });
            
            // Hover effects
            el.addEventListener('mouseenter', function() {
                el.setAttribute('scale', '1.1 1.1 1.1');
            });
            
            el.addEventListener('mouseleave', function() {
                el.setAttribute('scale', '1 1 1');
            });
        }
    });
}

// Setup menu buttons (simplified to prevent double events)
function setupMenuButtons() {
    console.log('Setting up menu buttons...');
    
    // Setup spawn buttons with single event handlers
    const buttons = {
        'spawn-box': 'box',
        'spawn-sphere': 'sphere', 
        'spawn-cylinder': 'cylinder',
        'spawn-cone': 'cone',
        'spawn-torus': 'torus'
    };
    
    Object.keys(buttons).forEach(buttonId => {
        const button = document.querySelector(`#${buttonId}`);
        if (button) {
            button.setAttribute('spawn-button', { objectType: buttons[buttonId] });
            console.log(`Configured ${buttonId} for ${buttons[buttonId]}`);
        }
    });
    
    // Special buttons
    const removeButton = document.querySelector('#remove-mode');
    if (removeButton) {
        removeButton.addEventListener('click', function(evt) {
            evt.stopPropagation();
            console.log('Toggle remove mode');
            toggleRemoveMode();
        });
    }
    
    const clearButton = document.querySelector('#clear-all');
    if (clearButton) {
        clearButton.addEventListener('click', function(evt) {
            evt.stopPropagation();
            console.log('Clear all objects');
            clearAllObjects();
        });
    }
    
    console.log('Menu buttons configured');
}

// Setup event listeners
function setupEventListeners() {
    document.addEventListener('keydown', function(evt) {
        switch(evt.key) {
            case '1': spawnObjectByType('box'); break;
            case '2': spawnObjectByType('sphere'); break;
            case '3': spawnObjectByType('cylinder'); break;
            case '4': spawnObjectByType('cone'); break;
            case '5': spawnObjectByType('torus'); break;
            case 'r':
            case 'R': toggleRemoveMode(); break;
            case 'c':
            case 'C': clearAllObjects(); break;
        }
    });
}

// Enhanced spawn function with proper VR interaction setup
function spawnObjectByType(type) {
    if (!sceneReady) {
        console.warn('Scene not ready');
        return;
    }
    
    if (objectCounter >= maxObjects) {
        showMessage('Maximum objects reached!');
        return;
    }
    
    const config = OBJECT_CONFIGS[type];
    if (!config) return;
    
    console.log(`Spawning ${type}`);
    
    const scene = document.querySelector('a-scene');
    const camera = document.querySelector('#head');
    
    // Calculate spawn position
    let spawnPos = { x: 0, y: 2, z: -1 };
    if (camera) {
        const cameraPos = camera.getAttribute('position') || { x: 0, y: 1.6, z: 3 };
        spawnPos = {
            x: cameraPos.x + (Math.random() - 0.5) * 2,
            y: cameraPos.y + 0.5,
            z: cameraPos.z - 2
        };
    }
    
    // Create entity with proper A-Frame primitive
    const entity = document.createElement(`a-${config.shape}`);
    entity.id = `object-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set basic properties
    entity.setAttribute('position', spawnPos);
    entity.setAttribute('rotation', {
        x: Math.random() * 360,
        y: Math.random() * 360,
        z: Math.random() * 360
    });
    
    // Set size based on type with proper attribute names
    switch(type) {
        case 'box':
            entity.setAttribute('width', 0.5 + Math.random() * 0.3);
            entity.setAttribute('height', 0.5 + Math.random() * 0.3);
            entity.setAttribute('depth', 0.5 + Math.random() * 0.3);
            break;
        case 'sphere':
            entity.setAttribute('radius', 0.25 + Math.random() * 0.2);
            break;
        case 'cylinder':
            entity.setAttribute('radius', 0.2 + Math.random() * 0.15);
            entity.setAttribute('height', 0.5 + Math.random() * 0.4);
            break;
        case 'cone':
            entity.setAttribute('radius-bottom', 0.2 + Math.random() * 0.15);
            entity.setAttribute('height', 0.5 + Math.random() * 0.4);
            break;
        case 'torus':
            entity.setAttribute('radius', 0.3 + Math.random() * 0.15);
            entity.setAttribute('radius-tubular', 0.05 + Math.random() * 0.03);
            break;
    }
    
    // Set material and physics
    entity.setAttribute('material', {
        color: config.color,
        roughness: 0.7,
        metalness: 0.1
    });
    
    entity.setAttribute('data-original-color', config.color);
    entity.setAttribute('dynamic-body', { mass: 1, shape: 'auto' });
    entity.setAttribute('shadow', 'cast: true; receive: true');
    
    // Add VR interaction components
    entity.setAttribute('grabbable-object', '');
    
    // Add to scene
    scene.appendChild(entity);
    spawnedObjects.push(entity);
    objectCounter++;
    updateObjectCounter();
    
    showSpawnIndicator(spawnPos);
    showMessage(`Spawned ${type}!`);
    
    console.log(`Spawned ${type} (total: ${objectCounter})`);
}

// Enhanced remove mode with proper VR controller support
function toggleRemoveMode() {
    removeMode = !removeMode;
    const removeButton = document.querySelector('#remove-mode');
    
    if (removeMode) {
        if (removeButton) {
            removeButton.setAttribute('material', 'color', '#C0392B');
        }
        
        // Update raycaster to target spawned objects
        updateRaycastersForRemoveMode();
        
        showMessage('🗑️ REMOVE MODE ON - Point and click objects to delete');
        console.log('Remove mode ON');
    } else {
        if (removeButton) {
            removeButton.setAttribute('material', 'color', '#E74C3C');
        }
        
        resetRaycasters();
        
        showMessage('✅ Remove mode OFF');
        console.log('Remove mode OFF');
    }
}

// Update raycasters to include spawned objects
function updateRaycastersForRemoveMode() {
    const leftHand = document.querySelector('#leftHand');
    const rightHand = document.querySelector('#rightHand');
    
    if (leftHand) {
        leftHand.setAttribute('raycaster', 'objects', '.clickable, .interactable');
    }
    if (rightHand) {
        rightHand.setAttribute('raycaster', 'objects', '.clickable, .interactable');
    }
}

function resetRaycasters() {
    const leftHand = document.querySelector('#leftHand');
    const rightHand = document.querySelector('#rightHand');
    
    if (leftHand) {
        leftHand.setAttribute('raycaster', 'objects', '.clickable');
    }
    if (rightHand) {
        rightHand.setAttribute('raycaster', 'objects', '.clickable');
    }
}

// Remove specific object
function removeObject(objectEl) {
    if (!objectEl || !objectEl.parentNode) return;
    
    console.log(`Removing object: ${objectEl.id}`);
    
    // Animate removal
    objectEl.setAttribute('animation__scale', {
        property: 'scale',
        to: '0 0 0',
        dur: 300
    });
    
    objectEl.setAttribute('animation__spin', {
        property: 'rotation',
        to: '720 720 720',
        dur: 300
    });
    
    setTimeout(() => {
        if (objectEl.parentNode) {
            objectEl.parentNode.removeChild(objectEl);
        }
        
        const index = spawnedObjects.indexOf(objectEl);
        if (index > -1) {
            spawnedObjects.splice(index, 1);
        }
        objectCounter--;
        updateObjectCounter();
        
        showMessage('💥 Object removed!');
    }, 300);
}

// Clear all objects
function clearAllObjects() {
    spawnedObjects.forEach(obj => {
        if (obj && obj.parentNode) {
            obj.parentNode.removeChild(obj);
        }
    });
    
    spawnedObjects = [];
    objectCounter = 0;
    updateObjectCounter();
    
    if (removeMode) {
        toggleRemoveMode();
    }
    
    showMessage('🧹 All objects cleared!');
}

// Show spawn indicator
function showSpawnIndicator(position) {
    const indicator = document.querySelector('#spawn-indicator');
    if (indicator) {
        indicator.setAttribute('position', position);
        indicator.setAttribute('visible', true);
        setTimeout(() => indicator.setAttribute('visible', false), 1000);
    }
}

// UI functions (keeping existing ones)
function addRemoveModeIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'remove-mode-indicator';
    indicator.innerHTML = '🗑️ REMOVE MODE ACTIVE';
    indicator.style.cssText = `
        position: fixed !important; top: 70px !important; right: 20px !important;
        background: #E74C3C !important; color: white !important; padding: 10px 15px !important;
        border-radius: 8px !important; font-weight: bold !important; font-size: 14px !important;
        z-index: 1000 !important; display: none !important; border: 2px solid #C0392B !important;
    `;
    document.body.appendChild(indicator);
}

function addInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.innerHTML = `
        <h3>VR Object Room Controls</h3>
        <ul>
            <li><strong>1:</strong> Spawn Box</li>
            <li><strong>2:</strong> Spawn Sphere</li>
            <li><strong>3:</strong> Spawn Cylinder</li>
            <li><strong>4:</strong> Spawn Cone</li>
            <li><strong>5:</strong> Spawn Torus</li>
            <li><strong>R:</strong> Toggle remove mode</li>
            <li><strong>C:</strong> Clear all objects</li>
        </ul>
    `;
    document.body.appendChild(instructions);
}

function addObjectCounter() {
    const counter = document.createElement('div');
    counter.id = 'object-counter';
    counter.innerHTML = `Objects: <span id="count">0</span>/${maxObjects}`;
    counter.style.cssText = `
        position: fixed !important; top: 20px !important; right: 20px !important;
        background: #2C3E50 !important; color: #ECF0F1 !important; padding: 10px 15px !important;
        border-radius: 8px !important; font-weight: bold !important; z-index: 1000 !important;
    `;
    document.body.appendChild(counter);
}

function updateObjectCounter() {
    const countSpan = document.querySelector('#count');
    if (countSpan) {
        countSpan.textContent = objectCounter;
    }
}

function showMessage(message) {
    let messageEl = document.querySelector('#temp-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'temp-message';
        messageEl.style.cssText = `
            position: fixed !important; bottom: 20px !important; left: 50% !important;
            transform: translateX(-50%) !important; background: #3498DB !important; color: white !important;
            padding: 12px 24px !important; border-radius: 8px !important; font-weight: bold !important;
            z-index: 1000 !important; display: none !important;
        `;
        document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block !important';
    setTimeout(() => messageEl.style.display = 'none !important', 2500);
}

// Export for debugging
window.VRApp = {
    spawn: spawnObjectByType,
    clear: clearAllObjects,
    toggleRemove: toggleRemoveMode,
    getCount: () => objectCounter,
    getObjects: () => spawnedObjects
};

console.log('VR Interactive Object Room loaded and ready!');
