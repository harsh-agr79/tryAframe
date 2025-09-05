// VR Interactive Workshop - Advanced JavaScript
// Meta Quest 2 optimized with comprehensive hand tracking and menu system

document.addEventListener('DOMContentLoaded', function() {
    console.log('Advanced VR Interactive Workshop initializing...');
    
    // Global variables
    let objectCounter = 0;
    let isVRMode = false;
    let handTrackingEnabled = false;
    let controllersPresent = false;
    let rotationMode = false;
    let deleteMode = false;
    let selectedShape = null;
    let grabbedObjects = new Map();
    let twoHandedObjects = new Map();
    
    let performanceStats = {
        fps: 0,
        objects: 0,
        physics: 0,
        memoryUsage: 0
    };
    
    // Comprehensive shape definitions with proper A-Frame geometry
    const shapeDefinitions = [
        { 
            type: 'box', 
            name: 'Cube', 
            color: '#4CC3D9', 
            geometry: { primitive: 'box', width: 0.5, height: 0.5, depth: 0.5 }, 
            physics: 'box' 
        },
        { 
            type: 'sphere', 
            name: 'Sphere', 
            color: '#EF2D5E', 
            geometry: { primitive: 'sphere', radius: 0.3 }, 
            physics: 'sphere' 
        },
        { 
            type: 'cylinder', 
            name: 'Cylinder', 
            color: '#FFC65D', 
            geometry: { primitive: 'cylinder', radius: 0.2, height: 0.8 }, 
            physics: 'cylinder' 
        },
        { 
            type: 'cone', 
            name: 'Cone', 
            color: '#90EE90', 
            geometry: { primitive: 'cone', radiusBottom: 0.3, radiusTop: 0, height: 0.6 }, 
            physics: 'cylinder' 
        },
        { 
            type: 'torus', 
            name: 'Torus', 
            color: '#E0E0E0', 
            geometry: { primitive: 'torus', radius: 0.25, radiusTubular: 0.08 }, 
            physics: 'sphere' 
        },
        { 
            type: 'plane', 
            name: 'Plane', 
            color: '#DDA0DD', 
            geometry: { primitive: 'plane', width: 0.6, height: 0.6 }, 
            physics: 'box' 
        },
        { 
            type: 'tetrahedron', 
            name: 'Tetrahedron', 
            color: '#FFB347', 
            geometry: { primitive: 'tetrahedron', radius: 0.3 }, 
            physics: 'sphere' 
        },
        { 
            type: 'octahedron', 
            name: 'Octahedron', 
            color: '#F0E68C', 
            geometry: { primitive: 'octahedron', radius: 0.3 }, 
            physics: 'sphere' 
        },
        { 
            type: 'icosahedron', 
            name: 'Icosahedron', 
            color: '#98FB98', 
            geometry: { primitive: 'icosahedron', radius: 0.3 }, 
            physics: 'sphere' 
        },
        { 
            type: 'dodecahedron', 
            name: 'Dodecahedron', 
            color: '#FFE4B5', 
            geometry: { primitive: 'dodecahedron', radius: 0.3 }, 
            physics: 'sphere' 
        },
        { 
            type: 'ring', 
            name: 'Ring', 
            color: '#F5DEB3', 
            geometry: { primitive: 'ring', radiusInner: 0.15, radiusOuter: 0.35 }, 
            physics: 'box' 
        },
        { 
            type: 'triangle', 
            name: 'Triangle', 
            color: '#40E0D0', 
            geometry: { primitive: 'triangle' }, 
            physics: 'box' 
        }
    ];

    // Initialize all systems
    initializeComponents();
    setupEventListeners();
    initializeUI();
    startPerformanceMonitoring();

    /**
     * Register comprehensive A-Frame components
     */
    function initializeComponents() {
        
        // Advanced hand tracking component
        AFRAME.registerComponent('advanced-hand-tracking', {
            schema: {
                hand: { type: 'string', oneOf: ['left', 'right'] }
            },
            init: function() {
                this.hand = this.data.hand;
                this.isTracking = false;
                this.pinching = false;
                this.pointing = false;
                this.grabbedObject = null;
                this.lastPosition = { x: 0, y: 0, z: 0 };
                this.gestures = {};
                
                // Setup hand tracking detection
                this.setupHandTracking();
                
                // Listen for controller events
                this.el.addEventListener('controllerconnected', this.onControllerConnected.bind(this));
                this.el.addEventListener('controllerdisconnected', this.onControllerDisconnected.bind(this));
            },
            
            setupHandTracking: function() {
                // Check for WebXR hand tracking support
                if (navigator.xr) {
                    navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                        if (supported) {
                            this.enableHandTracking();
                        }
                    }).catch(() => {
                        console.log('Hand tracking check failed, using simulation');
                        this.startHandTrackingSimulation();
                    });
                } else {
                    // Fallback hand tracking simulation
                    this.startHandTrackingSimulation();
                }
            },
            
            enableHandTracking: function() {
                this.isTracking = true;
                handTrackingEnabled = true;
                
                // Show hand model when controller not present
                if (!controllersPresent) {
                    this.showHandModel();
                }
                
                updateHandTrackingStatus(true);
                console.log(`${this.hand} hand tracking enabled`);
            },
            
            showHandModel: function() {
                const handModel = document.querySelector(`#${this.hand}HandModel`);
                if (handModel) {
                    handModel.setAttribute('visible', true);
                }
                
                // Hide controller model
                const controller = this.hand === 'left' ? 
                    document.querySelector('#leftController') : 
                    document.querySelector('#rightController');
                if (controller) {
                    controller.setAttribute('visible', false);
                }
            },
            
            hideHandModel: function() {
                const handModel = document.querySelector(`#${this.hand}HandModel`);
                if (handModel) {
                    handModel.setAttribute('visible', false);
                }
                
                // Show controller model
                const controller = this.hand === 'left' ? 
                    document.querySelector('#leftController') : 
                    document.querySelector('#rightController');
                if (controller) {
                    controller.setAttribute('visible', true);
                }
            },
            
            onControllerConnected: function(evt) {
                controllersPresent = true;
                this.hideHandModel();
                updateHandTrackingStatus(false);
                console.log(`${this.hand} controller connected`);
            },
            
            onControllerDisconnected: function(evt) {
                controllersPresent = false;
                if (this.isTracking) {
                    this.showHandModel();
                    updateHandTrackingStatus(true);
                }
                console.log(`${this.hand} controller disconnected`);
            },
            
            startHandTrackingSimulation: function() {
                this.isTracking = true;
                handTrackingEnabled = true;
                updateHandTrackingStatus(true);
                console.log(`${this.hand} hand tracking simulation started`);
            },
            
            tick: function() {
                if (!this.isTracking || controllersPresent) return;
                
                // Simulate basic hand tracking for demo purposes
                this.updateHandGestures();
                this.checkHandInteractions();
            },
            
            updateHandGestures: function() {
                // Basic gesture simulation
                const currentTime = Date.now();
                
                // Simulate occasional pinch gestures
                if (Math.random() < 0.005) {
                    this.pinching = !this.pinching;
                    if (this.pinching) {
                        this.startPinchGrab();
                    } else {
                        this.endPinchGrab();
                    }
                }
            },
            
            checkHandInteractions: function() {
                if (!this.pinching) {
                    this.highlightNearbyObjects();
                }
            },
            
            highlightNearbyObjects: function() {
                const handPosition = this.el.getAttribute('position') || { x: 0, y: 0, z: 0 };
                const interactiveObjects = document.querySelectorAll('.interactive-object');
                
                interactiveObjects.forEach(obj => {
                    const objPosition = obj.getAttribute('position') || { x: 0, y: 0, z: 0 };
                    const distance = this.calculateDistance(handPosition, objPosition);
                    
                    if (distance < 0.5) {
                        obj.classList.add('hand-hoverable');
                    } else {
                        obj.classList.remove('hand-hoverable');
                    }
                });
            },
            
            startPinchGrab: function() {
                const handPosition = this.el.getAttribute('position') || { x: 0, y: 0, z: 0 };
                const nearbyObjects = this.getNearbyObjects(handPosition, 0.4);
                
                if (nearbyObjects.length > 0) {
                    this.grabbedObject = nearbyObjects[0];
                    this.grabbedObject.classList.add('grabbed');
                    grabbedObjects.set(this.hand, this.grabbedObject);
                    
                    console.log(`${this.hand} hand grabbed:`, this.grabbedObject.id);
                    showGestureFeedback(`${this.hand.toUpperCase()} GRAB`);
                }
            },
            
            endPinchGrab: function() {
                if (this.grabbedObject) {
                    this.grabbedObject.classList.remove('grabbed');
                    grabbedObjects.delete(this.hand);
                    console.log(`${this.hand} hand released:`, this.grabbedObject.id);
                    this.grabbedObject = null;
                }
            },
            
            getNearbyObjects: function(position, maxDistance) {
                const interactiveObjects = document.querySelectorAll('.interactive-object');
                const nearby = [];
                
                interactiveObjects.forEach(obj => {
                    const objPosition = obj.getAttribute('position') || { x: 0, y: 0, z: 0 };
                    const distance = this.calculateDistance(position, objPosition);
                    
                    if (distance <= maxDistance) {
                        nearby.push(obj);
                    }
                });
                
                return nearby.sort((a, b) => {
                    const aDist = this.calculateDistance(position, a.getAttribute('position'));
                    const bDist = this.calculateDistance(position, b.getAttribute('position'));
                    return aDist - bDist;
                });
            },
            
            calculateDistance: function(pos1, pos2) {
                const dx = pos1.x - pos2.x;
                const dy = pos1.y - pos2.y;
                const dz = pos1.z - pos2.z;
                return Math.sqrt(dx * dx + dy * dy + dz * dz);
            }
        });

        // Enhanced cursor listener for menu interactions
        AFRAME.registerComponent('cursor-listener', {
            init: function() {
                this.el.addEventListener('click', this.onClick.bind(this));
                this.el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
                this.el.addEventListener('mouseleave', this.onMouseLeave.bind(this));
                this.el.addEventListener('raycaster-intersected', this.onRaycastEnter.bind(this));
                this.el.addEventListener('raycaster-intersected-cleared', this.onRaycastLeave.bind(this));
            },
            
            onClick: function(evt) {
                const shapeType = this.el.getAttribute('data-shape');
                const action = this.el.getAttribute('data-action');
                
                if (shapeType) {
                    console.log('Menu clicked shape:', shapeType);
                    this.spawnShape(shapeType);
                } else if (action) {
                    console.log('Menu clicked action:', action);
                    this.executeAction(action);
                }
                
                // Visual feedback
                this.el.classList.add('selected');
                setTimeout(() => {
                    this.el.classList.remove('selected');
                }, 300);
            },
            
            spawnShape: function(shapeType) {
                const shapeData = shapeDefinitions.find(s => s.type === shapeType);
                console.log('Found shape data:', shapeData);
                
                if (shapeData) {
                    const spawnPosition = {
                        x: (Math.random() - 0.5) * 2,
                        y: 2.5,
                        z: (Math.random() - 0.5) * 2
                    };
                    spawnInteractiveObject(shapeData, spawnPosition);
                    console.log('Menu spawned:', shapeType);
                } else {
                    console.error('Shape not found:', shapeType);
                }
            },
            
            executeAction: function(action) {
                switch(action) {
                    case 'rotation-toggle':
                        toggleRotationMode();
                        break;
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
                this.el.setAttribute('scale', '1.1 1.1 1.1');
            },
            
            onMouseLeave: function() {
                this.el.setAttribute('scale', '1 1 1');
            },
            
            onRaycastEnter: function(evt) {
                this.onMouseEnter();
            },
            
            onRaycastLeave: function(evt) {
                this.onMouseLeave();
            }
        });

        // Enhanced grabbable component with rotation support
        AFRAME.registerComponent('enhanced-grabbable', {
            schema: {
                startButtons: { default: 'triggerdown' },
                endButtons: { default: 'triggerup' }
            },
            init: function() {
                this.el.addEventListener('grab-start', this.onGrabStart.bind(this));
                this.el.addEventListener('grab-end', this.onGrabEnd.bind(this));
                this.el.addEventListener('stretch-start', this.onStretchStart.bind(this));
                this.el.addEventListener('stretch-end', this.onStretchEnd.bind(this));
                this.el.addEventListener('click', this.onClick.bind(this));
                
                this.initialRotation = null;
                this.isRotating = false;
            },
            
            onClick: function(evt) {
                if (deleteMode) {
                    evt.stopPropagation();
                    this.deleteObject();
                }
            },
            
            onGrabStart: function(evt) {
                if (deleteMode) {
                    this.deleteObject();
                    return;
                }
                
                // Haptic feedback
                if (evt.detail.hand && evt.detail.hand.components['oculus-touch-controls']) {
                    evt.detail.hand.components['oculus-touch-controls'].pulse(0.5, 100);
                }
                
                this.el.classList.add('grabbed');
                
                if (rotationMode) {
                    this.startRotation(evt);
                }
                
                console.log('Object grabbed:', this.el.id || 'unnamed');
            },
            
            onGrabEnd: function(evt) {
                this.el.classList.remove('grabbed');
                
                if (this.isRotating) {
                    this.endRotation();
                }
                
                console.log('Object released:', this.el.id || 'unnamed');
            },
            
            startRotation: function(evt) {
                this.isRotating = true;
                this.initialRotation = this.el.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
                this.grabberHand = evt.detail.hand;
                
                // Show rotation indicator
                showRotationIndicator(this.el.getAttribute('position'));
            },
            
            endRotation: function() {
                this.isRotating = false;
                hideRotationIndicator();
            },
            
            deleteObject: function() {
                console.log('Deleting object:', this.el.id);
                
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
                        console.log('Object deleted');
                    }
                }, 300);
            },
            
            onStretchStart: function(evt) {
                console.log('Stretch started:', this.el.id || 'unnamed');
            },
            
            onStretchEnd: function(evt) {
                console.log('Stretch ended:', this.el.id || 'unnamed');
            },
            
            tick: function() {
                if (this.isRotating && this.grabberHand && rotationMode) {
                    const handRotation = this.grabberHand.getAttribute('rotation');
                    if (handRotation && this.initialRotation) {
                        this.el.setAttribute('rotation', {
                            x: this.initialRotation.x + handRotation.x * 0.5,
                            y: this.initialRotation.y + handRotation.y * 0.5,
                            z: this.initialRotation.z + handRotation.z * 0.5
                        });
                    }
                }
            }
        });

        // Delete zone component
        AFRAME.registerComponent('delete-zone', {
            init: function() {
                this.el.addEventListener('collidestart', this.onCollision.bind(this));
            },
            
            onCollision: function(evt) {
                const collidedEl = evt.detail.target.el;
                
                if (collidedEl && collidedEl.classList.contains('interactive-object')) {
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
                            console.log('Object deleted by zone');
                        }
                    }, 300);
                }
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
                    performanceStats.physics = document.querySelectorAll('[dynamic-body]').length;
                    
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
            setupHandTracking();
            setupVRButton();
            setupDeleteZone();
        });

        // VR mode events
        scene.addEventListener('enter-vr', function() {
            isVRMode = true;
            console.log('Entered VR mode');
            document.body.classList.add('vr-mode');
        });

        scene.addEventListener('exit-vr', function() {
            isVRMode = false;
            console.log('Exited VR mode');
            document.body.classList.remove('vr-mode');
        });

        // Keyboard shortcuts for desktop testing
        document.addEventListener('keydown', function(evt) {
            if (isVRMode) return;
            
            switch(evt.key.toLowerCase()) {
                case '1': case '2': case '3': case '4': case '5':
                case '6': case '7': case '8': case '9': case '0':
                    const index = evt.key === '0' ? 9 : parseInt(evt.key) - 1;
                    if (shapeDefinitions[index]) {
                        spawnInteractiveObject(shapeDefinitions[index], {x: 0, y: 2, z: -1});
                        console.log('Keyboard spawned:', shapeDefinitions[index].name);
                    }
                    break;
                case 'm':
                    toggleVRMenu();
                    break;
                case 'r':
                    toggleRotationMode();
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
                case 'd':
                    toggleDebugMode();
                    break;
                case 'h':
                    toggleHandTrackingSimulation();
                    break;
            }
        });

        // Error handling
        window.addEventListener('error', function(evt) {
            console.error('Application error:', evt.error);
            showErrorMessage('An error occurred: ' + evt.error.message);
        });
    }

    /**
     * Setup VR controllers with enhanced functionality
     */
    function setupControllers() {
        const leftController = document.querySelector('#leftController');
        const rightController = document.querySelector('#rightController');

        // Enhanced button mappings for controllers
        if (leftController) {
            leftController.addEventListener('xbuttondown', function() {
                toggleVRMenu();
            });
            
            leftController.addEventListener('ybuttondown', function() {
                toggleRotationMode();
            });
            
            leftController.addEventListener('gripdown', function() {
                // Quick spawn cube
                if (shapeDefinitions[0]) {
                    const pos = leftController.getAttribute('position') || { x: -0.5, y: 2, z: -1 };
                    spawnInteractiveObject(shapeDefinitions[0], pos);
                }
            });
        }

        if (rightController) {
            rightController.addEventListener('abuttondown', function() {
                toggleDeleteMode();
            });
            
            rightController.addEventListener('bbuttondown', function() {
                clearAllObjects();
            });
            
            rightController.addEventListener('gripdown', function() {
                // Quick spawn sphere
                if (shapeDefinitions[1]) {
                    const pos = rightController.getAttribute('position') || { x: 0.5, y: 2, z: -1 };
                    spawnInteractiveObject(shapeDefinitions[1], pos);
                }
            });
        }

        console.log('Controllers setup completed');
    }

    /**
     * Setup hand tracking system
     */
    function setupHandTracking() {
        const leftController = document.querySelector('#leftController');
        const rightController = document.querySelector('#rightController');
        
        if (leftController) {
            leftController.setAttribute('advanced-hand-tracking', 'hand: left');
        }
        
        if (rightController) {
            rightController.setAttribute('advanced-hand-tracking', 'hand: right');
        }
        
        // Add performance monitor to camera rig
        const cameraRig = document.querySelector('#cameraRig');
        if (cameraRig) {
            cameraRig.setAttribute('performance-monitor', '');
        }
        
        console.log('Hand tracking system initialized');
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
     * Setup VR Enter button
     */
    function setupVRButton() {
        const enterVRButton = document.getElementById('enterVRButton');
        const scene = document.querySelector('a-scene');
        
        if (enterVRButton && scene) {
            enterVRButton.addEventListener('click', function() {
                scene.enterVR().catch(err => {
                    console.error('Failed to enter VR:', err);
                    showErrorMessage('Failed to enter VR mode. Make sure your headset is connected.');
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
     * Spawn interactive object with comprehensive physics and interaction
     */
    function spawnInteractiveObject(shapeData, position) {
        const scene = document.querySelector('a-scene');
        const entity = document.createElement('a-entity');
        
        objectCounter++;
        entity.setAttribute('id', `spawned-${shapeData.type}-${objectCounter}`);
        entity.setAttribute('class', 'interactive-object');
        
        // Set position with randomization
        const spawnPos = {
            x: position.x + (Math.random() - 0.5) * 0.3,
            y: position.y + Math.random() * 0.2,
            z: position.z + (Math.random() - 0.5) * 0.3
        };
        entity.setAttribute('position', spawnPos);
        
        // Set geometry - ensure proper A-Frame geometry format
        console.log('Setting geometry for', shapeData.type, shapeData.geometry);
        entity.setAttribute('geometry', shapeData.geometry);
        
        // Set material with enhanced properties
        entity.setAttribute('material', {
            color: shapeData.color,
            metalness: 0.3,
            roughness: 0.7,
            emissive: '#111111'
        });
        
        // Add physics
        const physicsShape = shapeData.physics || 'box';
        entity.setAttribute('dynamic-body', `shape: ${physicsShape}; mass: 1`);
        
        // Add interaction components
        entity.setAttribute('super-hands', 'colliderEvent: raycaster-intersection; colliderEventProperty: els; colliderEndEvent: raycaster-intersection-cleared; colliderEndEventProperty: clearedEls');
        entity.setAttribute('grabbable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('stretchable', 'startButtons: gripdown; endButtons: gripup');
        entity.setAttribute('draggable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('enhanced-grabbable', '');
        
        scene.appendChild(entity);
        performanceStats.objects++;
        
        console.log(`Spawned ${shapeData.name} (${shapeData.type}) at:`, spawnPos);
        
        // Performance check
        if (performanceStats.objects > 50) {
            console.warn('High object count detected, consider optimization');
        }
        
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
            console.log('VR menu toggled:', !isVisible);
        }
    }

    /**
     * Toggle rotation mode
     */
    function toggleRotationMode() {
        rotationMode = !rotationMode;
        updateModeIndicator('rotation', rotationMode);
        
        // Update control button appearance in menu
        const rotationButton = document.querySelector('[data-action="rotation-toggle"]');
        if (rotationButton) {
            if (rotationMode) {
                rotationButton.classList.add('active');
            } else {
                rotationButton.classList.remove('active');
            }
        }
        
        console.log('Rotation mode:', rotationMode ? 'enabled' : 'disabled');
    }

    /**
     * Toggle delete mode
     */
    function toggleDeleteMode() {
        deleteMode = !deleteMode;
        updateModeIndicator('delete', deleteMode);
        
        // Update control button appearance in menu
        const deleteButton = document.querySelector('[data-action="delete-mode"]');
        if (deleteButton) {
            if (deleteMode) {
                deleteButton.classList.add('active');
            } else {
                deleteButton.classList.remove('active');
            }
        }
        
        console.log('Delete mode:', deleteMode ? 'enabled' : 'disabled');
    }

    /**
     * Clear all interactive objects
     */
    function clearAllObjects() {
        const objects = document.querySelectorAll('.interactive-object');
        console.log('Clearing', objects.length, 'objects');
        
        objects.forEach(obj => {
            obj.setAttribute('animation', {
                property: 'scale',
                to: '0 0 0',
                dur: 200,
                easing: 'easeInQuad'
            });
        });
        
        setTimeout(() => {
            objects.forEach(obj => {
                if (obj.parentNode) {
                    obj.parentNode.removeChild(obj);
                }
            });
            performanceStats.objects = 0;
            console.log('All objects cleared');
        }, 200);
    }

    /**
     * Show/hide rotation indicator
     */
    function showRotationIndicator(position) {
        const indicator = document.querySelector('#rotation-indicator');
        if (indicator) {
            indicator.setAttribute('position', position);
            indicator.setAttribute('visible', true);
        }
    }

    function hideRotationIndicator() {
        const indicator = document.querySelector('#rotation-indicator');
        if (indicator) {
            indicator.setAttribute('visible', false);
        }
    }

    /**
     * Update mode indicators
     */
    function updateModeIndicator(mode, active) {
        let indicator = document.querySelector(`.mode-indicator.${mode}-mode`);
        
        if (active && !indicator) {
            indicator = document.createElement('div');
            indicator.className = `mode-indicator ${mode}-mode`;
            indicator.textContent = `${mode.toUpperCase()} MODE ACTIVE`;
            document.body.appendChild(indicator);
        } else if (!active && indicator) {
            indicator.remove();
        }
    }

    /**
     * Update hand tracking status
     */
    function updateHandTrackingStatus(enabled) {
        let status = document.querySelector('.hand-tracking-status');
        
        if (!status) {
            status = document.createElement('div');
            status.className = 'hand-tracking-status';
            document.body.appendChild(status);
        }
        
        status.textContent = enabled ? 'HAND TRACKING ACTIVE' : 'CONTROLLERS ACTIVE';
        status.className = `hand-tracking-status ${enabled ? '' : 'disabled'}`;
    }

    /**
     * Show gesture feedback
     */
    function showGestureFeedback(gesture) {
        let feedback = document.querySelector('.gesture-feedback');
        
        if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'gesture-feedback';
            document.body.appendChild(feedback);
        }
        
        feedback.textContent = gesture;
        feedback.classList.remove('hidden');
        
        setTimeout(() => {
            feedback.classList.add('hidden');
        }, 2000);
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
            <div class="loading-text">Loading Advanced VR Workshop...</div>
        `;
        document.body.appendChild(loadingScreen);

        // Create VR UI instructions
        const vrUI = document.createElement('div');
        vrUI.className = 'vr-ui';
        vrUI.innerHTML = `
            <h3>Advanced VR Interactive Workshop</h3>
            <p>Experience comprehensive VR interaction with hand tracking and controller support.</p>
            <div class="controls-info">
                <h4>VR Controls:</h4>
                <ul>
                    <li><strong>X/Y Button:</strong> Open/Close Menu</li>
                    <li><strong>Trigger:</strong> Grab & Interact</li>
                    <li><strong>Grip:</strong> Quick Spawn Shapes</li>
                    <li><strong>A Button:</strong> Toggle Delete Mode</li>
                    <li><strong>B Button:</strong> Clear All Objects</li>
                </ul>
                <h4>Hand Tracking:</h4>
                <ul>
                    <li><strong>Pinch:</strong> Grab Objects</li>
                    <li><strong>Point:</strong> Select Menu Items</li>
                    <li><strong>Open Palm:</strong> Release Objects</li>
                </ul>
            </div>
        `;
        document.body.appendChild(vrUI);

        // Create desktop controls
        const desktopControls = document.createElement('div');
        desktopControls.className = 'desktop-controls';
        desktopControls.innerHTML = `
            <h4>Desktop Controls:</h4>
            <ul>
                <li><strong>1-9,0:</strong> Spawn shapes (1=Cube, 2=Sphere, etc.)</li>
                <li><strong>M:</strong> Toggle menu</li>
                <li><strong>R:</strong> Toggle rotation mode</li>
                <li><strong>Del:</strong> Toggle delete mode</li>
                <li><strong>Ctrl+C:</strong> Clear all objects</li>
                <li><strong>P:</strong> Performance stats</li>
                <li><strong>D:</strong> Debug mode</li>
                <li><strong>H:</strong> Hand tracking simulation</li>
            </ul>
        `;
        document.body.appendChild(desktopControls);

        // Create performance stats display
        const perfStats = document.createElement('div');
        perfStats.className = 'performance-stats hidden';
        perfStats.innerHTML = `
            <div class="stat-line"><span class="stat-label">FPS:</span> <span class="stat-value" id="fps-value">0</span></div>
            <div class="stat-line"><span class="stat-label">Objects:</span> <span class="stat-value" id="objects-value">0</span></div>
            <div class="stat-line"><span class="stat-label">Physics:</span> <span class="stat-value" id="physics-value">0</span></div>
            <div class="stat-line"><span class="stat-label">Memory:</span> <span class="stat-value" id="memory-value">0</span>MB</div>
        `;
        document.body.appendChild(perfStats);
    }

    /**
     * Performance monitoring and optimization
     */
    function startPerformanceMonitoring() {
        setInterval(() => {
            // Memory usage monitoring
            if (performance.memory) {
                const memUsed = Math.round(performance.memory.usedJSHeapSize / 1048576);
                if (memUsed > 100) {
                    console.warn(`High memory usage: ${memUsed}MB`);
                }
            }
            
            // Object count optimization
            const objectCount = document.querySelectorAll('.interactive-object').length;
            if (objectCount > 100) {
                console.warn(`Very high object count: ${objectCount}. Consider cleanup.`);
            }
            
            // FPS monitoring
            if (performanceStats.fps < 30) {
                console.warn(`Low FPS detected: ${performanceStats.fps}`);
            }
        }, 5000);
    }

    /**
     * Utility functions
     */
    function hideLoadingScreen() {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            setTimeout(() => loadingScreen.remove(), 800);
        }
    }

    function showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <h3>⚠️ Error</h3>
            <p>${message}</p>
            <button onclick="this.parentElement.remove()">Dismiss</button>
            <button onclick="location.reload()">Reload</button>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 10000);
    }

    function updatePerformanceDisplay() {
        const fpsEl = document.getElementById('fps-value');
        const objectsEl = document.getElementById('objects-value');
        const physicsEl = document.getElementById('physics-value');
        const memoryEl = document.getElementById('memory-value');
        
        if (fpsEl) fpsEl.textContent = performanceStats.fps;
        if (objectsEl) objectsEl.textContent = performanceStats.objects;
        if (physicsEl) physicsEl.textContent = performanceStats.physics;
        if (memoryEl) memoryEl.textContent = performanceStats.memoryUsage;
    }

    function togglePerformanceStats() {
        const perfStats = document.querySelector('.performance-stats');
        if (perfStats) {
            perfStats.classList.toggle('hidden');
        }
    }

    function toggleDebugMode() {
        const scene = document.querySelector('a-scene');
        const currentPhysics = scene.getAttribute('physics');
        const isDebug = currentPhysics.includes('debug: true');
        
        scene.setAttribute('physics', `driver: ammo; debug: ${!isDebug}; debugDrawMode: 1`);
        document.body.classList.toggle('debug-mode');
        
        console.log('Debug mode:', !isDebug ? 'enabled' : 'disabled');
    }

    function toggleHandTrackingSimulation() {
        handTrackingEnabled = !handTrackingEnabled;
        updateHandTrackingStatus(handTrackingEnabled);
        console.log('Hand tracking simulation:', handTrackingEnabled ? 'enabled' : 'disabled');
    }

    // Export functions for global access
    window.VRWorkshop = {
        spawnObject: spawnInteractiveObject,
        toggleMenu: toggleVRMenu,
        toggleRotation: toggleRotationMode,
        toggleDelete: toggleDeleteMode,
        clearAll: clearAllObjects,
        togglePerformanceStats: togglePerformanceStats,
        toggleDebugMode: toggleDebugMode,
        getStats: () => performanceStats,
        getShapes: () => shapeDefinitions,
        isHandTrackingEnabled: () => handTrackingEnabled,
        isRotationMode: () => rotationMode,
        isDeleteMode: () => deleteMode
    };

    console.log('Advanced VR Interactive Workshop initialized successfully!');
    console.log('Available shapes:', shapeDefinitions.length);
    console.log('Use keys 1-9,0 to spawn different shapes, M for menu, R for rotation, Del for delete mode');
});