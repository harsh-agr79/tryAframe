// VR Interactive Workshop - Simplified Version
// Focus on easy object creation and interaction without hand gestures

document.addEventListener('DOMContentLoaded', function() {
    console.log('Simplified VR Interactive Workshop initializing...');
    
    // Global variables
    let objectCounter = 0;
    let isVRMode = false;
    let deleteMode = false;
    let selectedObject = null;
    
    let performanceStats = {
        fps: 0,
        objects: 0,
        memoryUsage: 0
    };
    
    // Simplified shape definitions with proper A-Frame geometry
    const shapeDefinitions = [
        { 
            type: 'box', 
            name: 'Cube', 
            color: '#4CC3D9', 
            geometry: 'primitive: box; width: 0.5; height: 0.5; depth: 0.5'
        },
        { 
            type: 'sphere', 
            name: 'Sphere', 
            color: '#EF2D5E', 
            geometry: 'primitive: sphere; radius: 0.3'
        },
        { 
            type: 'cylinder', 
            name: 'Cylinder', 
            color: '#FFC65D', 
            geometry: 'primitive: cylinder; radius: 0.2; height: 0.8'
        },
        { 
            type: 'cone', 
            name: 'Cone', 
            color: '#90EE90', 
            geometry: 'primitive: cone; radiusBottom: 0.3; radiusTop: 0; height: 0.6'
        },
        { 
            type: 'torus', 
            name: 'Torus', 
            color: '#E0E0E0', 
            geometry: 'primitive: torus; radius: 0.25; radiusTubular: 0.08'
        },
        { 
            type: 'plane', 
            name: 'Plane', 
            color: '#DDA0DD', 
            geometry: 'primitive: plane; width: 0.6; height: 0.6'
        }
    ];

    // Initialize all systems
    initializeComponents();
    setupEventListeners();
    initializeUI();
    startPerformanceMonitoring();

    /**
     * Register simplified A-Frame components
     */
    function initializeComponents() {
        
        // Simplified cursor listener for menu interactions
        AFRAME.registerComponent('cursor-listener', {
            init: function() {
                this.el.addEventListener('click', this.onClick.bind(this));
                this.el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
                this.el.addEventListener('mouseleave', this.onMouseLeave.bind(this));
            },
            
            onClick: function(evt) {
                const shapeType = this.el.getAttribute('data-shape');
                const action = this.el.getAttribute('data-action');
                
                if (shapeType) {
                    console.log('Menu clicked shape:', shapeType);
                    this.spawnShape(shapeType);
                    showNotification(`${shapeType} spawned!`);
                } else if (action) {
                    console.log('Menu clicked action:', action);
                    this.executeAction(action);
                }
                
                // Visual feedback
                this.el.setAttribute('animation', {
                    property: 'scale',
                    to: '1.2 1.2 1.2',
                    dur: 150,
                    dir: 'alternate',
                    loop: 1
                });
            },
            
            spawnShape: function(shapeType) {
                const shapeData = shapeDefinitions.find(s => s.type === shapeType);
                
                if (shapeData) {
                    const spawnPosition = {
                        x: (Math.random() - 0.5) * 2,
                        y: 2.5,
                        z: (Math.random() - 0.5) * 2
                    };
                    spawnInteractiveObject(shapeData, spawnPosition);
                }
            },
            
            executeAction: function(action) {
                switch(action) {
                    case 'delete-mode':
                        toggleDeleteMode();
                        break;
                    case 'clear-all':
                        clearAllObjects();
                        break;
                    case 'close-menu':
                        toggleVRMenu();
                        break;
                    default:
                        console.log('Unknown action:', action);
                }
            },
            
            onMouseEnter: function() {
                this.el.setAttribute('animation', {
                    property: 'scale',
                    to: '1.1 1.1 1.1',
                    dur: 200
                });
            },
            
            onMouseLeave: function() {
                this.el.setAttribute('animation', {
                    property: 'scale',
                    to: '1 1 1',
                    dur: 200
                });
            }
        });

        // Enhanced grabbable component - FIXED for proper interaction
        AFRAME.registerComponent('interactive-object', {
            init: function() {
                // Make sure the object can be grabbed and interacted with
                this.el.classList.add('interactive-object');
                
                // Add click handler for delete mode
                this.el.addEventListener('click', this.onClick.bind(this));
                
                // Add grab start/end handlers
                this.el.addEventListener('grab-start', this.onGrabStart.bind(this));
                this.el.addEventListener('grab-end', this.onGrabEnd.bind(this));
                
                // Visual feedback on hover
                this.el.addEventListener('mouseenter', this.onHover.bind(this));
                this.el.addEventListener('mouseleave', this.onHoverEnd.bind(this));
                
                console.log('Interactive object initialized:', this.el.id);
            },
            
            onClick: function(evt) {
                if (deleteMode) {
                    evt.stopPropagation();
                    this.deleteObject();
                } else {
                    this.selectObject();
                }
            },
            
            onGrabStart: function(evt) {
                if (deleteMode) {
                    this.deleteObject();
                    return;
                }
                
                this.el.setAttribute('material', 'emissive: #333333');
                selectedObject = this.el;
                showNotification(`Grabbed ${this.el.id}`);
                console.log('Object grabbed:', this.el.id);
            },
            
            onGrabEnd: function(evt) {
                this.el.setAttribute('material', 'emissive: #000000');
                console.log('Object released:', this.el.id);
            },
            
            onHover: function() {
                if (deleteMode) {
                    this.el.setAttribute('material', 'color: #ff4444; emissive: #440000');
                } else {
                    this.el.setAttribute('material', 'emissive: #111111');
                }
            },
            
            onHoverEnd: function() {
                if (!deleteMode) {
                    this.el.setAttribute('material', 'emissive: #000000');
                }
            },
            
            selectObject: function() {
                // Remove previous selection
                if (selectedObject && selectedObject !== this.el) {
                    selectedObject.setAttribute('material', 'emissive: #000000');
                }
                
                selectedObject = this.el;
                this.el.setAttribute('material', 'emissive: #222222');
                showNotification(`Selected ${this.el.id}`);
            },
            
            deleteObject: function() {
                console.log('Deleting object:', this.el.id);
                showNotification(`Deleted ${this.el.id}`);
                
                // Animation before deletion
                this.el.setAttribute('animation', {
                    property: 'scale',
                    to: '0 0 0',
                    dur: 300,
                    easing: 'easeInQuad'
                });
                
                setTimeout(() => {
                    if (this.el.parentNode) {
                        this.el.parentNode.removeChild(this.el);
                        performanceStats.objects--;
                    }
                }, 300);
            }
        });

        // Performance monitor component
        AFRAME.registerComponent('performance-monitor', {
            init: function() {
                this.frameCount = 0;
                this.lastTime = performance.now();
            },
            
            tick: function() {
                this.frameCount++;
                const currentTime = performance.now();
                
                if (currentTime - this.lastTime >= 1000) {
                    performanceStats.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
                    performanceStats.objects = document.querySelectorAll('.interactive-object').length;
                    
                    if (performance.memory) {
                        performanceStats.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
                    }
                    
                    updatePerformanceDisplay();
                    
                    this.frameCount = 0;
                    this.lastTime = currentTime;
                }
            }
        });
    }

    /**
     * Setup comprehensive event listeners
     */
    function setupEventListeners() {
        const scene = document.querySelector('a-scene');
        
        // Scene loaded event
        scene.addEventListener('loaded', function() {
            console.log('A-Frame scene loaded');
            hideLoadingScreen();
            setupControllers();
            setupVRButton();
            showWelcomeMessage();
        });

        // VR mode events
        scene.addEventListener('enter-vr', function() {
            isVRMode = true;
            console.log('Entered VR mode');
            document.body.classList.add('vr-mode');
            showNotification('Entered VR mode - Use controllers to interact!');
        });

        scene.addEventListener('exit-vr', function() {
            isVRMode = false;
            console.log('Exited VR mode');
            document.body.classList.remove('vr-mode');
            showNotification('Exited VR mode');
        });

        // Simplified keyboard shortcuts
        document.addEventListener('keydown', function(evt) {
            if (isVRMode) return;
            
            switch(evt.key.toLowerCase()) {
                case '1': case '2': case '3': case '4': case '5': case '6':
                    const index = parseInt(evt.key) - 1;
                    if (shapeDefinitions[index]) {
                        spawnInteractiveObject(shapeDefinitions[index], {x: 0, y: 2, z: -1});
                        showNotification(`Spawned ${shapeDefinitions[index].name}`);
                    }
                    break;
                case 'm':
                    toggleVRMenu();
                    break;
                case 'delete':
                case 'backspace':
                    toggleDeleteMode();
                    break;
                case 'c':
                    if (evt.ctrlKey) {
                        evt.preventDefault();
                        clearAllObjects();
                    }
                    break;
                case 'p':
                    togglePerformanceStats();
                    break;
                case 'h':
                    showHelpMessage();
                    break;
            }
        });
    }

    /**
     * Setup VR controllers with simplified functionality
     */
    function setupControllers() {
        const leftController = document.querySelector('#leftController');
        const rightController = document.querySelector('#rightController');

        if (leftController) {
            leftController.addEventListener('xbuttondown', function() {
                toggleVRMenu();
                showNotification('Menu toggled');
            });
            
            leftController.addEventListener('gripdown', function() {
                if (shapeDefinitions[0]) {
                    const pos = leftController.getAttribute('position') || { x: -0.5, y: 2, z: -1 };
                    spawnInteractiveObject(shapeDefinitions[0], pos);
                    showNotification(`Spawned ${shapeDefinitions[0].name}`);
                }
            });
        }

        if (rightController) {
            rightController.addEventListener('abuttondown', function() {
                toggleDeleteMode();
            });
            
            rightController.addEventListener('bbuttondown', function() {
                clearAllObjects();
                showNotification('All objects cleared');
            });
            
            rightController.addEventListener('gripdown', function() {
                if (shapeDefinitions[1]) {
                    const pos = rightController.getAttribute('position') || { x: 0.5, y: 2, z: -1 };
                    spawnInteractiveObject(shapeDefinitions[1], pos);
                    showNotification(`Spawned ${shapeDefinitions[1].name}`);
                }
            });
        }

        console.log('Controllers setup completed');
    }

    /**
     * Setup VR Enter button
     */
    function setupVRButton() {
        const enterVRButton = document.getElementById('enterVRButton');
        const scene = document.querySelector('a-scene');
        
        if (enterVRButton && scene) {
            enterVRButton.addEventListener('click', function() {
                scene.enterVR().catch(err => {
                    console.error('Failed to enter VR:', err);
                    showNotification('Failed to enter VR mode. Make sure your headset is connected.', 'error');
                });
            });
            
            // Check VR availability
            if (navigator.xr) {
                navigator.xr.isSessionSupported('immersive-vr').then(function(supported) {
                    if (!supported) {
                        enterVRButton.textContent = 'VR Not Available';
                        enterVRButton.disabled = true;
                    }
                }).catch(() => {
                    enterVRButton.textContent = 'VR Check Failed';
                    enterVRButton.disabled = true;
                });
            } else {
                enterVRButton.textContent = 'WebXR Not Supported';
                enterVRButton.disabled = true;
            }
        }
    }

    /**
     * FIXED: Spawn interactive object with proper components
     */
    function spawnInteractiveObject(shapeData, position) {
        const scene = document.querySelector('a-scene');
        const entity = document.createElement('a-entity');
        
        objectCounter++;
        const objectId = `${shapeData.type}-${objectCounter}`;
        entity.setAttribute('id', objectId);
        
        // Set position with slight randomization
        const spawnPos = {
            x: position.x + (Math.random() - 0.5) * 0.3,
            y: position.y + Math.random() * 0.2,
            z: position.z + (Math.random() - 0.5) * 0.3
        };
        entity.setAttribute('position', spawnPos);
        
        // Set geometry - FIXED format
        entity.setAttribute('geometry', shapeData.geometry);
        
        // Set material with enhanced properties
        entity.setAttribute('material', {
            color: shapeData.color,
            metalness: 0.3,
            roughness: 0.7,
            emissive: '#000000'
        });
        
        // Add physics
        entity.setAttribute('dynamic-body', 'shape: auto; mass: 1');
        
        // FIXED: Add proper interaction components in the right order
        entity.setAttribute('interactive-object', '');
        entity.setAttribute('grabbable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('droppable', '');
        
        // Add to scene
        scene.appendChild(entity);
        performanceStats.objects++;
        
        console.log(`Spawned ${shapeData.name} (${objectId}) at:`, spawnPos);
        
        return entity;
    }

    /**
     * Toggle VR menu visibility
     */
    function toggleVRMenu() {
        const vrMenu = document.querySelector('#vr-menu');
        if (vrMenu) {
            const isVisible = vrMenu.getAttribute('visible') === 'true';
            vrMenu.setAttribute('visible', !isVisible);
            showNotification(isVisible ? 'Menu closed' : 'Menu opened');
        }
    }

    /**
     * Toggle delete mode
     */
    function toggleDeleteMode() {
        deleteMode = !deleteMode;
        
        // Update UI
        const deleteButton = document.querySelector('[data-action="delete-mode"]');
        if (deleteButton) {
            if (deleteMode) {
                deleteButton.setAttribute('material', 'color: #ff4444');
            } else {
                deleteButton.setAttribute('material', 'color: #ffffff');
            }
        }
        
        // Update cursor appearance
        document.body.classList.toggle('delete-mode', deleteMode);
        
        const message = deleteMode ? 'Delete mode ON - Click objects to delete' : 'Delete mode OFF';
        showNotification(message, deleteMode ? 'warning' : 'info');
    }

    /**
     * Clear all interactive objects
     */
    function clearAllObjects() {
        const objects = document.querySelectorAll('.interactive-object');
        
        if (objects.length === 0) {
            showNotification('No objects to clear');
            return;
        }
        
        console.log('Clearing', objects.length, 'objects');
        showNotification(`Clearing ${objects.length} objects`);
        
        objects.forEach((obj, index) => {
            setTimeout(() => {
                obj.setAttribute('animation', {
                    property: 'scale',
                    to: '0 0 0',
                    dur: 200,
                    easing: 'easeInQuad'
                });
                
                setTimeout(() => {
                    if (obj.parentNode) {
                        obj.parentNode.removeChild(obj);
                    }
                }, 200);
            }, index * 50); // Stagger the deletion for visual effect
        });
        
        setTimeout(() => {
            performanceStats.objects = 0;
            selectedObject = null;
        }, objects.length * 50 + 200);
    }

    /**
     * Initialize UI elements
     */
    function initializeUI() {
        // Create loading screen
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading VR Workshop...</div>
        `;
        document.body.appendChild(loadingScreen);

        // Create simplified controls info
        const controlsInfo = document.createElement('div');
        controlsInfo.className = 'controls-info';
        controlsInfo.innerHTML = `
            <h3>🎮 VR Interactive Workshop</h3>
            <div class="control-section">
                <h4>Desktop Controls:</h4>
                <div class="control-grid">
                    <div><kbd>1-6</kbd> Spawn shapes</div>
                    <div><kbd>M</kbd> Toggle menu</div>
                    <div><kbd>Del</kbd> Delete mode</div>
                    <div><kbd>Ctrl+C</kbd> Clear all</div>
                    <div><kbd>P</kbd> Performance</div>
                    <div><kbd>H</kbd> Help</div>
                </div>
            </div>
            <div class="control-section">
                <h4>VR Controls:</h4>
                <div class="control-grid">
                    <div><strong>Trigger:</strong> Grab objects</div>
                    <div><strong>Grip:</strong> Spawn shapes</div>
                    <div><strong>X/Y:</strong> Open menu</div>
                    <div><strong>A:</strong> Delete mode</div>
                    <div><strong>B:</strong> Clear all</div>
                </div>
            </div>
            <button id="toggleControls" onclick="this.parentElement.classList.toggle('minimized')">
                Minimize
            </button>
        `;
        document.body.appendChild(controlsInfo);

        // Create notification system
        const notificationArea = document.createElement('div');
        notificationArea.className = 'notification-area';
        document.body.appendChild(notificationArea);

        // Create performance stats
        const perfStats = document.createElement('div');
        perfStats.className = 'performance-stats hidden';
        perfStats.innerHTML = `
            <h4>📊 Performance</h4>
            <div class="stat-line">FPS: <span id="fps-value">0</span></div>
            <div class="stat-line">Objects: <span id="objects-value">0</span></div>
            <div class="stat-line">Memory: <span id="memory-value">0</span>MB</div>
        `;
        document.body.appendChild(perfStats);
    }

    /**
     * Enhanced notification system
     */
    function showNotification(message, type = 'info') {
        const notificationArea = document.querySelector('.notification-area');
        if (!notificationArea) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
        notification.innerHTML = `${icon} ${message}`;
        
        notificationArea.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }

    /**
     * Welcome and help messages
     */
    function showWelcomeMessage() {
        showNotification('Welcome! Press H for help, M for menu, or use keys 1-6 to spawn shapes', 'info');
    }

    function showHelpMessage() {
        const helpText = `
            🎮 HOW TO USE:
            • Desktop: Use keys 1-6 to spawn different shapes
            • VR: Use grip buttons to spawn, trigger to grab
            • Click objects to select them
            • Press Delete key or use delete mode to remove objects
            • All objects are grabbable and interactive!
        `;
        showNotification(helpText, 'info');
    }

    /**
     * Performance monitoring
     */
    function startPerformanceMonitoring() {
        const cameraRig = document.querySelector('#cameraRig');
        if (cameraRig) {
            cameraRig.setAttribute('performance-monitor', '');
        }
    }

    function updatePerformanceDisplay() {
        const fpsEl = document.getElementById('fps-value');
        const objectsEl = document.getElementById('objects-value');
        const memoryEl = document.getElementById('memory-value');
        
        if (fpsEl) fpsEl.textContent = performanceStats.fps;
        if (objectsEl) objectsEl.textContent = performanceStats.objects;
        if (memoryEl) memoryEl.textContent = performanceStats.memoryUsage;
    }

    function togglePerformanceStats() {
        const perfStats = document.querySelector('.performance-stats');
        if (perfStats) {
            perfStats.classList.toggle('hidden');
        }
    }

    function hideLoadingScreen() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => loadingScreen.remove(), 500);
        }
    }

    // Global API for easy access
    window.VRWorkshop = {
        spawnCube: () => spawnInteractiveObject(shapeDefinitions[0], {x: 0, y: 2, z: -1}),
        spawnSphere: () => spawnInteractiveObject(shapeDefinitions[1], {x: 0, y: 2, z: -1}),
        clearAll: clearAllObjects,
        toggleMenu: toggleVRMenu,
        toggleDelete: toggleDeleteMode,
        getStats: () => performanceStats
    };

    console.log('✅ Simplified VR Interactive Workshop ready!');
    console.log('💡 Use keys 1-6 to spawn shapes, M for menu, H for help');
});
