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
    
    console.log('VR app initialized successfully');
    console.log('Use keys 1-5 to spawn objects, R for remove mode, C to clear all');
}

// Register A-Frame components
function registerComponents() {
    // Clickable component for menu interactions
    AFRAME.registerComponent('menu-clickable', {
        init: function() {
            const el = this.el;
            el.addEventListener('click', function(evt) {
                const buttonId = el.getAttribute('data-spawn-type');
                console.log(`Menu button clicked: ${buttonId}`);
                if (buttonId) {
                    spawnObjectByType(buttonId);
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

    // Interactable object component
    AFRAME.registerComponent('interactable-object', {
        init: function() {
            const el = this.el;
            
            el.addEventListener('click', function(evt) {
                if (removeMode) {
                    removeObject(el);
                }
            });
            
            el.addEventListener('mouseenter', function() {
                if (removeMode) {
                    el.setAttribute('material', 'color', '#FF6B6B');
                    el.setAttribute('scale', '1.1 1.1 1.1');
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
                    el.setAttribute('scale', '1 1 1');
                } else {
                    el.setAttribute('scale', '1 1 1');
                }
            });
        }
    });
}

// Setup menu buttons with proper click handlers
function setupMenuButtons() {
    // Setup spawn buttons
    const spawnBox = document.querySelector('#spawn-box');
    const spawnSphere = document.querySelector('#spawn-sphere');
    const spawnCylinder = document.querySelector('#spawn-cylinder');
    const spawnCone = document.querySelector('#spawn-cone');
    const spawnTorus = document.querySelector('#spawn-torus');
    const removeButton = document.querySelector('#remove-mode');
    const clearButton = document.querySelector('#clear-all');
    
    if (spawnBox) {
        spawnBox.setAttribute('data-spawn-type', 'box');
        spawnBox.setAttribute('menu-clickable', '');
    }
    if (spawnSphere) {
        spawnSphere.setAttribute('data-spawn-type', 'sphere');
        spawnSphere.setAttribute('menu-clickable', '');
    }
    if (spawnCylinder) {
        spawnCylinder.setAttribute('data-spawn-type', 'cylinder');
        spawnCylinder.setAttribute('menu-clickable', '');
    }
    if (spawnCone) {
        spawnCone.setAttribute('data-spawn-type', 'cone');
        spawnCone.setAttribute('menu-clickable', '');
    }
    if (spawnTorus) {
        spawnTorus.setAttribute('data-spawn-type', 'torus');
        spawnTorus.setAttribute('menu-clickable', '');
    }
    
    // Setup special buttons
    if (removeButton) {
        removeButton.addEventListener('click', function() {
            console.log('Remove mode button clicked');
            toggleRemoveMode();
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', function() {
            console.log('Clear all button clicked');
            clearAllObjects();
        });
    }
    
    console.log('Menu buttons set up successfully');
}

// Setup event listeners
function setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', function(evt) {
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
    
    console.log('Event listeners set up');
}

// Spawn object by type
function spawnObjectByType(type) {
    if (!sceneReady) {
        console.warn('Scene not ready, cannot spawn object');
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
    
    console.log(`Spawning ${type} with color ${config.color}`);
    
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
    
    // Create entity
    const entity = document.createElement('a-entity');
    entity.id = `object-${Date.now()}-${Math.random()}`;
    
    // Set position and rotation
    entity.setAttribute('position', spawnPos);
    entity.setAttribute('rotation', {
        x: Math.random() * 360,
        y: Math.random() * 360,
        z: Math.random() * 360
    });
    
    // Set geometry based on type
    const geometryAttribs = { primitive: config.shape };
    
    switch(type) {
        case 'box':
            geometryAttribs.width = 0.5 + Math.random() * 0.3;
            geometryAttribs.height = 0.5 + Math.random() * 0.3;
            geometryAttribs.depth = 0.5 + Math.random() * 0.3;
            break;
        case 'sphere':
            geometryAttribs.radius = 0.25 + Math.random() * 0.2;
            break;
        case 'cylinder':
            geometryAttribs.radius = 0.2 + Math.random() * 0.15;
            geometryAttribs.height = 0.5 + Math.random() * 0.4;
            break;
        case 'cone':
            geometryAttribs.radiusBottom = 0.2 + Math.random() * 0.15;
            geometryAttribs.height = 0.5 + Math.random() * 0.4;
            break;
        case 'torus':
            geometryAttribs.radius = 0.3 + Math.random() * 0.15;
            geometryAttribs.radiusTubular = 0.05 + Math.random() * 0.03;
            break;
    }
    
    entity.setAttribute('geometry', geometryAttribs);
    entity.setAttribute('material', {
        color: config.color,
        roughness: 0.7,
        metalness: 0.1
    });
    
    // Store original color and add physics
    entity.setAttribute('data-original-color', config.color);
    entity.setAttribute('dynamic-body', { mass: 1, shape: 'auto' });
    entity.setAttribute('shadow', 'cast: true; receive: true');
    
    // Add interactable component
    entity.setAttribute('interactable-object', '');
    entity.classList.add('interactable');
    entity.classList.add('spawning');
    
    // Add to scene
    scene.appendChild(entity);
    spawnedObjects.push(entity);
    objectCounter++;
    updateObjectCounter();
    
    // Show spawn indicator
    showSpawnIndicator(spawnPos);
    
    // Remove spawning animation
    setTimeout(() => {
        entity.classList.remove('spawning');
    }, 500);
    
    console.log(`Successfully spawned ${type} object (total: ${objectCounter})`);
    showMessage(`Spawned ${type} object!`);
}

// Toggle remove mode with enhanced visual feedback
function toggleRemoveMode() {
    removeMode = !removeMode;
    const removeButton = document.querySelector('#remove-mode');
    const removeModeIndicator = document.querySelector('#remove-mode-indicator');
    
    if (removeMode) {
        // Update button color
        if (removeButton) {
            removeButton.setAttribute('color', '#C0392B');
            removeButton.setAttribute('animation', {
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
        
        // Add visual feedback to all objects
        spawnedObjects.forEach(obj => {
            if (obj && obj.parentNode) {
                obj.classList.add('remove-mode-active');
                obj.setAttribute('animation__glow', {
                    property: 'material.opacity',
                    to: '0.7',
                    dir: 'alternate',
                    dur: 800,
                    loop: true
                });
            }
        });
        
        showMessage('🗑️ REMOVE MODE ON - Click objects to delete them');
        console.log('Remove mode activated with visual feedback');
    } else {
        // Reset button
        if (removeButton) {
            removeButton.setAttribute('color', '#E74C3C');
            removeButton.removeAttribute('animation');
            removeButton.setAttribute('scale', '1 1 1');
        }
        
        // Hide remove mode indicator
        if (removeModeIndicator) {
            removeModeIndicator.style.display = 'none !important';
        }
        
        // Remove visual feedback from all objects
        spawnedObjects.forEach(obj => {
            if (obj && obj.parentNode) {
                obj.classList.remove('remove-mode-active');
                obj.removeAttribute('animation__glow');
                obj.setAttribute('material', 'opacity', 1);
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

// Remove specific object
function removeObject(objectEl) {
    if (!objectEl || !objectEl.parentNode) return;
    
    console.log(`Removing object: ${objectEl.id}`);
    
    // Animate removal
    objectEl.setAttribute('animation', {
        property: 'scale',
        to: '0 0 0',
        dur: 300
    });
    
    objectEl.setAttribute('animation__spin', {
        property: 'rotation',
        to: '360 360 360',
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
        showMessage('💥 Object removed!');
    }, 300);
}

// Clear all objects
function clearAllObjects() {
    console.log('Clearing all objects');
    
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
    
    console.log('All objects cleared');
    showMessage('🧹 All objects cleared!');
}

// Show spawn indicator
function showSpawnIndicator(position) {
    const indicator = document.querySelector('#spawn-indicator');
    if (indicator) {
        indicator.setAttribute('position', position);
        indicator.setAttribute('visible', true);
        setTimeout(() => {
            indicator.setAttribute('visible', false);
        }, 1000);
    }
}

// Add remove mode indicator
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
        box-shadow: 0 0 10px rgba(231, 76, 60, 0.5) !important;
    `;
    
    document.body.appendChild(indicator);
    console.log('Remove mode indicator added');
}

// Add instructions overlay
function addInstructions() {
    const instructions = document.createElement('div');
    instructions.className = 'instructions';
    instructions.innerHTML = `
        <h3>VR Object Room Controls</h3>
        <ul>
            <li><strong>1:</strong> Spawn Box (Blue)</li>
            <li><strong>2:</strong> Spawn Sphere (Red)</li>
            <li><strong>3:</strong> Spawn Cylinder (Yellow)</li>
            <li><strong>4:</strong> Spawn Cone (Green)</li>
            <li><strong>5:</strong> Spawn Torus (Purple)</li>
            <li><strong>R:</strong> Toggle remove mode</li>
            <li><strong>C:</strong> Clear all objects</li>
        </ul>
    `;
    document.body.appendChild(instructions);
    console.log('Instructions added');
}

// Add object counter
function addObjectCounter() {
    const counter = document.createElement('div');
    counter.className = 'object-counter';
    counter.id = 'object-counter';
    counter.innerHTML = `Objects: <span id="count">0</span>/${maxObjects}`;
    
    // Ensure it's visible with explicit styles
    counter.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: #2C3E50 !important;
        color: #ECF0F1 !important;
        padding: 10px 15px !important;
        border-radius: 8px !important;
        border: 2px solid #34495E !important;
        font-family: Arial, sans-serif !important;
        font-size: 14px !important;
        font-weight: bold !important;
        z-index: 1000 !important;
        display: block !important;
        min-width: 120px !important;
        text-align: center !important;
    `;
    
    document.body.appendChild(counter);
    console.log('Object counter added and styled');
}

// Update object counter display
function updateObjectCounter() {
    const counter = document.querySelector('#object-counter');
    const countSpan = document.querySelector('#count');
    
    if (counter && countSpan) {
        countSpan.textContent = objectCounter;
        
        // Change color based on count
        if (objectCounter >= maxObjects * 0.8) {
            counter.style.backgroundColor = '#E74C3C !important';
            counter.style.color = '#FFFFFF !important';
        } else {
            counter.style.backgroundColor = '#2C3E50 !important';
            counter.style.color = '#ECF0F1 !important';
        }
        
        console.log(`Object counter updated: ${objectCounter}/${maxObjects}`);
    }
}

// Show temporary message
function showMessage(message) {
    console.log('Message:', message);
    
    let messageEl = document.querySelector('#temp-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'temp-message';
        messageEl.style.cssText = `
            position: fixed !important;
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            background: #3498DB !important;
            color: white !important;
            padding: 12px 24px !important;
            border-radius: 8px !important;
            font-weight: bold !important;
            font-size: 16px !important;
            z-index: 1000 !important;
            display: none !important;
            border: 2px solid #2980B9 !important;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
        `;
        document.body.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.style.display = 'block !important';
    
    setTimeout(() => {
        messageEl.style.display = 'none !important';
    }, 2500);
}

// Export for debugging
window.VRApp = {
    spawn: spawnObjectByType,
    clear: clearAllObjects,
    toggleRemove: toggleRemoveMode,
    getCount: () => objectCounter,
    getObjects: () => spawnedObjects,
    isRemoveMode: () => removeMode
};

console.log('VR Interactive Object Room loaded and ready!');
console.log('Press 1-5 to spawn objects, R for remove mode, C to clear all');