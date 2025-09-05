// VR Interactive Workshop - JavaScript
// Meta Quest 2 optimized A-Frame application

document.addEventListener('DOMContentLoaded', function() {
    console.log('VR Interactive Workshop initializing...');
    
    // Global variables
    let objectCounter = 0;
    let isVRMode = false;
    let performanceStats = {
        fps: 0,
        objects: 0,
        physics: 0
    };
    
    // Object spawn data
    const spawnableObjects = [
        { type: 'box', name: 'Cube', defaultColor: '#4CC3D9', size: '0.5 0.5 0.5' },
        { type: 'sphere', name: 'Ball', defaultColor: '#EF2D5E', radius: 0.3 },
        { type: 'cylinder', name: 'Cylinder', defaultColor: '#FFC65D', radius: 0.2, height: 0.8 },
        { type: 'dodecahedron', name: 'Dodecahedron', defaultColor: '#90EE90', radius: 0.3 },
        { type: 'octahedron', name: 'Octahedron', defaultColor: '#FFB347', radius: 0.3 }
    ];

    // Initialize A-Frame components
    initializeComponents();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize UI
    initializeUI();
    
    // Start performance monitoring
    startPerformanceMonitoring();

    /**
     * Register custom A-Frame components
     */
    function initializeComponents() {
        
        // Cursor listener component for click interactions
        AFRAME.registerComponent('cursor-listener', {
            init: function() {
                this.el.addEventListener('click', this.onClick.bind(this));
                this.el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
                this.el.addEventListener('mouseleave', this.onMouseLeave.bind(this));
            },
            onClick: function(evt) {
                const objectType = this.el.getAttribute('data-object-type');
                if (objectType) {
                    const spawnData = spawnableObjects.find(obj => obj.type === objectType);
                    if (spawnData) {
                        spawnInteractiveObject(spawnData, {x: 0, y: 2, z: -1});
                        console.log('UI button spawned:', objectType);
                    }
                }
            },
            onMouseEnter: function() {
                this.el.setAttribute('scale', '1.1 1.1 1.1');
                this.el.classList.add('highlighted');
            },
            onMouseLeave: function() {
                this.el.setAttribute('scale', '1 1 1');
                this.el.classList.remove('highlighted');
            }
        });
        
        // Enhanced grabbable component with haptic feedback
        AFRAME.registerComponent('enhanced-grabbable', {
            schema: {
                startButtons: {default: 'triggerdown'},
                endButtons: {default: 'triggerup'}
            },
            init: function() {
                this.el.addEventListener('grab-start', this.onGrabStart.bind(this));
                this.el.addEventListener('grab-end', this.onGrabEnd.bind(this));
                this.el.addEventListener('stretch-start', this.onStretchStart.bind(this));
                this.el.addEventListener('stretch-end', this.onStretchEnd.bind(this));
            },
            onGrabStart: function(evt) {
                // Add haptic feedback
                if (evt.detail.hand && evt.detail.hand.components['meta-touch-controls']) {
                    evt.detail.hand.components['meta-touch-controls'].pulse(0.5, 100);
                }
                // Visual feedback
                this.el.setAttribute('material', 'opacity', 0.8);
                this.el.setAttribute('scale', '1.1 1.1 1.1');
                
                console.log('Object grabbed:', this.el.id || 'unnamed');
            },
            onGrabEnd: function(evt) {
                // Reset visual state
                this.el.setAttribute('material', 'opacity', 1);
                this.el.setAttribute('scale', '1 1 1');
                
                console.log('Object released:', this.el.id || 'unnamed');
            },
            onStretchStart: function(evt) {
                console.log('Stretch started:', this.el.id || 'unnamed');
            },
            onStretchEnd: function(evt) {
                console.log('Stretch ended:', this.el.id || 'unnamed');
            }
        });

        // Object spawner component
        AFRAME.registerComponent('object-spawner', {
            schema: {
                objectType: {type: 'string', default: 'box'},
                spawnPosition: {type: 'vec3', default: {x: 0, y: 2, z: -1}}
            },
            init: function() {
                this.el.addEventListener('click', this.spawnObject.bind(this));
                this.el.addEventListener('raycaster-intersected', this.onHover.bind(this));
                this.el.addEventListener('raycaster-intersected-cleared', this.onHoverEnd.bind(this));
            },
            onHover: function() {
                this.el.classList.add('highlighted');
                this.el.setAttribute('scale', '1.1 1.1 1.1');
            },
            onHoverEnd: function() {
                this.el.classList.remove('highlighted');
                this.el.setAttribute('scale', '1 1 1');
            },
            spawnObject: function(evt) {
                const objectType = this.el.getAttribute('data-object-type') || this.data.objectType;
                const spawnData = spawnableObjects.find(obj => obj.type === objectType);
                
                if (!spawnData) {
                    console.error('Unknown object type:', objectType);
                    return;
                }

                // Haptic feedback
                if (evt.detail.cursorEl && evt.detail.cursorEl.components['meta-touch-controls']) {
                    evt.detail.cursorEl.components['meta-touch-controls'].pulse(0.8, 150);
                }

                spawnInteractiveObject(spawnData, this.data.spawnPosition);
                
                console.log('Spawned object:', objectType);
            }
        });

        // Delete zone component
        AFRAME.registerComponent('delete-zone', {
            init: function() {
                this.el.addEventListener('collide', this.onCollision.bind(this));
            },
            onCollision: function(evt) {
                const collidedEl = evt.detail.target.el;
                
                if (collidedEl.classList.contains('interactive-object')) {
                    // Visual effect before deletion
                    collidedEl.setAttribute('animation', {
                        property: 'scale',
                        to: '0 0 0',
                        dur: 300,
                        easing: 'easeInQuad'
                    });
                    
                    setTimeout(() => {
                        if (collidedEl.parentNode) {
                            collidedEl.parentNode.removeChild(collidedEl);
                            performanceStats.objects--;
                            console.log('Object deleted');
                        }
                    }, 300);
                }
            }
        });

        // Performance tracker component
        AFRAME.registerComponent('performance-tracker', {
            init: function() {
                this.frameCount = 0;
                this.lastTime = performance.now();
                this.tick = AFRAME.utils.throttle(this.tick, 1000, this);
            },
            tick: function() {
                this.frameCount++;
                const currentTime = performance.now();
                
                if (currentTime - this.lastTime >= 1000) {
                    performanceStats.fps = Math.round(this.frameCount * 1000 / (currentTime - this.lastTime));
                    performanceStats.objects = document.querySelectorAll('.interactive-object').length;
                    performanceStats.physics = document.querySelectorAll('[dynamic-body]').length;
                    
                    updatePerformanceDisplay();
                    
                    this.frameCount = 0;
                    this.lastTime = currentTime;
                }
            }
        });

        // Enhanced raycaster for better VR interaction
        AFRAME.registerComponent('enhanced-raycaster', {
            dependencies: ['raycaster'],
            init: function() {
                this.el.addEventListener('raycaster-intersection', this.onIntersection.bind(this));
                this.el.addEventListener('raycaster-intersection-cleared', this.onIntersectionCleared.bind(this));
            },
            onIntersection: function(evt) {
                const intersectedEl = evt.detail.els[0];
                if (intersectedEl && intersectedEl.classList.contains('interactive-object')) {
                    intersectedEl.classList.add('hoverable');
                }
            },
            onIntersectionCleared: function(evt) {
                if (evt.detail.clearedEls) {
                    evt.detail.clearedEls.forEach(el => {
                        if (el.classList.contains('interactive-object')) {
                            el.classList.remove('hoverable');
                        }
                    });
                }
            }
        });
    }

    /**
     * Setup event listeners for the scene
     */
    function setupEventListeners() {
        const scene = document.querySelector('a-scene');
        
        // Scene loaded event
        scene.addEventListener('loaded', function() {
            console.log('A-Frame scene loaded');
            hideLoadingScreen();
            setupSpawnButtons();
            setupDeleteZone();
            setupControllers();
            setupVRButton();
        });

        // VR mode events
        scene.addEventListener('enter-vr', function() {
            isVRMode = true;
            console.log('Entered VR mode');
            document.querySelector('.vr-ui').style.display = 'none';
            document.querySelector('.desktop-controls').style.display = 'none';
        });

        scene.addEventListener('exit-vr', function() {
            isVRMode = false;
            console.log('Exited VR mode');
            document.querySelector('.vr-ui').style.display = 'block';
            document.querySelector('.desktop-controls').style.display = 'block';
        });

        // Error handling
        window.addEventListener('error', function(evt) {
            console.error('Application error:', evt.error);
            showErrorMessage('An error occurred. Please refresh the page.');
        });

        // Keyboard shortcuts for desktop testing
        document.addEventListener('keydown', function(evt) {
            if (!isVRMode) {
                switch(evt.key) {
                    case '1':
                        spawnInteractiveObject(spawnableObjects[0], {x: 0, y: 2, z: -1});
                        break;
                    case '2':
                        spawnInteractiveObject(spawnableObjects[1], {x: 0, y: 2, z: -1});
                        break;
                    case '3':
                        spawnInteractiveObject(spawnableObjects[2], {x: 0, y: 2, z: -1});
                        break;
                    case '4':
                        spawnInteractiveObject(spawnableObjects[3], {x: 0, y: 2, z: -1});
                        break;
                    case '5':
                        spawnInteractiveObject(spawnableObjects[4], {x: 0, y: 2, z: -1});
                        break;
                    case 'p':
                        togglePerformanceStats();
                        break;
                    case 'd':
                        toggleDebugMode();
                        break;
                }
            }
        });
    }

    /**
     * Setup VR Enter button
     */
    function setupVRButton() {
        const enterVRButton = document.getElementById('enterVRButton');
        const scene = document.querySelector('a-scene');
        
        if (enterVRButton && scene) {
            enterVRButton.addEventListener('click', function() {
                scene.enterVR();
            });
            
            // Check VR availability
            if (navigator.xr) {
                navigator.xr.isSessionSupported('immersive-vr').then(function(supported) {
                    if (!supported) {
                        enterVRButton.textContent = 'VR Not Available';
                        enterVRButton.disabled = true;
                    }
                });
            } else {
                enterVRButton.textContent = 'WebXR Not Supported';
                enterVRButton.disabled = true;
            }
        }
    }

    /**
     * Setup spawn buttons with interaction components
     */
    function setupSpawnButtons() {
        const spawnButtons = document.querySelectorAll('.spawn-button');
        spawnButtons.forEach((button, index) => {
            button.setAttribute('object-spawner', '');
            button.setAttribute('class', button.getAttribute('class') + ' interactive-button');
            
            // Add direct click event listeners for desktop interaction
            button.addEventListener('click', function() {
                const objectType = this.getAttribute('data-object-type');
                const spawnData = spawnableObjects.find(obj => obj.type === objectType);
                if (spawnData) {
                    spawnInteractiveObject(spawnData, {x: 0, y: 2, z: -1});
                    console.log('Desktop click spawned:', objectType);
                }
            });
        });
    }

    /**
     * Setup delete zone
     */
    function setupDeleteZone() {
        const deleteZone = document.querySelector('#delete-zone');
        if (deleteZone) {
            deleteZone.setAttribute('delete-zone', '');
        }
    }

    /**
     * Setup VR controllers with enhanced components
     */
    function setupControllers() {
        const leftHand = document.querySelector('#leftHand');
        const rightHand = document.querySelector('#rightHand');

        if (leftHand) {
            leftHand.setAttribute('enhanced-raycaster', '');
            leftHand.setAttribute('sphere-collider', 'objects: .interactive-object');
        }

        if (rightHand) {
            rightHand.setAttribute('enhanced-raycaster', '');
            rightHand.setAttribute('sphere-collider', 'objects: .interactive-object');
        }

        // Add performance tracker to camera rig
        const cameraRig = document.querySelector('#cameraRig');
        if (cameraRig) {
            cameraRig.setAttribute('performance-tracker', '');
        }
    }

    /**
     * Spawn an interactive object with physics and grab capabilities
     */
    function spawnInteractiveObject(spawnData, position) {
        const scene = document.querySelector('a-scene');
        const entity = document.createElement('a-entity');
        
        objectCounter++;
        entity.setAttribute('id', `spawned-object-${objectCounter}`);
        entity.setAttribute('class', 'interactive-object grabbable');
        entity.setAttribute('class', 'interactive-object');
        entity.setAttribute('hoverable', '');
        entity.setAttribute('clickable', '');
        entity.setAttribute('super-hands', '');
        entity.setAttribute('grabbable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('stretchable', 'startButtons: gripdown; endButtons: gripup');
        entity.setAttribute('draggable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('enhanced-grabbable', '');
        
        // Set position with slight randomization
        const spawnPos = {
            x: position.x + (Math.random() - 0.5) * 0.5,
            y: position.y + Math.random() * 0.5,
            z: position.z + (Math.random() - 0.5) * 0.5
        };
        entity.setAttribute('position', spawnPos);
        
        // Set geometry based on type
        switch(spawnData.type) {
            case 'box':
                entity.setAttribute('geometry', {
                    primitive: 'box',
                    width: 0.5,
                    height: 0.5,
                    depth: 0.5
                });
                entity.setAttribute('dynamic-body', 'shape: box; mass: 1');
                break;
            case 'sphere':
                entity.setAttribute('geometry', {
                    primitive: 'sphere',
                    radius: spawnData.radius || 0.3
                });
                entity.setAttribute('dynamic-body', 'shape: sphere; mass: 1');
                break;
            case 'cylinder':
                entity.setAttribute('geometry', {
                    primitive: 'cylinder',
                    radius: spawnData.radius || 0.2,
                    height: spawnData.height || 0.8
                });
                entity.setAttribute('dynamic-body', 'shape: cylinder; mass: 1');
                break;
            case 'dodecahedron':
                entity.setAttribute('geometry', {
                    primitive: 'dodecahedron',
                    radius: spawnData.radius || 0.3
                });
                entity.setAttribute('dynamic-body', 'shape: sphere; mass: 1');
                break;
            case 'octahedron':
                entity.setAttribute('geometry', {
                    primitive: 'octahedron',
                    radius: spawnData.radius || 0.3
                });
                entity.setAttribute('dynamic-body', 'shape: sphere; mass: 1');
                break;
        }
        
        // Set material with random color variation
        const baseColor = spawnData.defaultColor;
        entity.setAttribute('material', {
            color: baseColor,
            metalness: 0.2,
            roughness: 0.8
        });
        
        // Add interaction components
        entity.setAttribute('super-hands', 'colliderEvent: raycaster-intersection; colliderEventProperty: els; colliderEndEvent: raycaster-intersection-cleared; colliderEndEventProperty: clearedEls');
        entity.setAttribute('grabbable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('stretchable', 'startButtons: gripdown; endButtons: gripup');
        entity.setAttribute('draggable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('enhanced-grabbable', '');
        
        scene.appendChild(entity);
        performanceStats.objects++;
        
        console.log(`Spawned ${spawnData.name} at position:`, spawnPos);
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

        // Create VR UI instructions
        const vrUI = document.createElement('div');
        vrUI.className = 'vr-ui';
        vrUI.innerHTML = `
            <h3>VR Interactive Workshop</h3>
            <p>Put on your Meta Quest 2 headset and click "Enter VR" to start.</p>
            <div class="controls-info">
                <h4>VR Controls:</h4>
                <ul>
                    <li>Trigger: Grab objects</li>
                    <li>Grip: Stretch/scale objects</li>
                    <li>Point at spawn buttons to create objects</li>
                    <li>Drag objects to red zone to delete</li>
                </ul>
            </div>
        `;
        document.body.appendChild(vrUI);

        // Create desktop controls info
        const desktopControls = document.createElement('div');
        desktopControls.className = 'desktop-controls';
        desktopControls.innerHTML = `
            <h4>Desktop Controls:</h4>
            <ul>
                <li>1-5: Spawn objects</li>
                <li>P: Toggle performance</li>
                <li>D: Toggle debug mode</li>
                <li>Mouse: Look around</li>
                <li>WASD: Move (desktop)</li>
                <li>Click spawn buttons in scene</li>
            </ul>
        `;
        document.body.appendChild(desktopControls);

        // Create performance stats display
        const perfStats = document.createElement('div');
        perfStats.className = 'performance-stats hidden';
        perfStats.innerHTML = `
            <div class="stat-line">FPS: <span class="stat-value" id="fps-value">0</span></div>
            <div class="stat-line">Objects: <span class="stat-value" id="objects-value">0</span></div>
            <div class="stat-line">Physics: <span class="stat-value" id="physics-value">0</span></div>
        `;
        document.body.appendChild(perfStats);
    }

    /**
     * Hide loading screen
     */
    function hideLoadingScreen() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }

    /**
     * Show error message
     */
    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h3>Error</h3>
            <p>${message}</p>
            <button onclick="location.reload()">Reload Page</button>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    /**
     * Start performance monitoring
     */
    function startPerformanceMonitoring() {
        setInterval(() => {
            // Monitor memory usage if available
            if (performance.memory) {
                const memUsed = Math.round(performance.memory.usedJSHeapSize / 1048576);
                console.log(`Memory usage: ${memUsed}MB`);
            }
            
            // Monitor object count
            const objectCount = document.querySelectorAll('.interactive-object').length;
            if (objectCount > 50) {
                console.warn('High object count detected:', objectCount);
            }
        }, 5000);
    }

    /**
     * Update performance display
     */
    function updatePerformanceDisplay() {
        const fpsValue = document.getElementById('fps-value');
        const objectsValue = document.getElementById('objects-value');
        const physicsValue = document.getElementById('physics-value');
        
        if (fpsValue) fpsValue.textContent = performanceStats.fps;
        if (objectsValue) objectsValue.textContent = performanceStats.objects;
        if (physicsValue) physicsValue.textContent = performanceStats.physics;
    }

    /**
     * Toggle performance stats display
     */
    function togglePerformanceStats() {
        const perfStats = document.querySelector('.performance-stats');
        if (perfStats) {
            perfStats.classList.toggle('hidden');
        }
    }

    /**
     * Toggle debug mode
     */
    function toggleDebugMode() {
        const scene = document.querySelector('a-scene');
        const currentPhysics = scene.getAttribute('physics');
        const isDebug = currentPhysics.includes('debug: true');
        
        scene.setAttribute('physics', `driver: ammo; debug: ${!isDebug}; debugDrawMode: 1`);
        document.body.classList.toggle('debug-mode');
        
        console.log('Debug mode:', !isDebug ? 'enabled' : 'disabled');
    }

    // Export functions for global access
    window.VRWorkshop = {
        spawnObject: spawnInteractiveObject,
        togglePerformanceStats: togglePerformanceStats,
        toggleDebugMode: toggleDebugMode,
        getStats: () => performanceStats
    };

    console.log('VR Interactive Workshop initialized successfully!');
});