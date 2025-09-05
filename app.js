// VR Interactive Workshop - JavaScript
// Meta Quest 2 optimized A-Frame application with Hand Tracking and Gestures

document.addEventListener('DOMContentLoaded', function() {
    console.log('VR Interactive Workshop with Hand Tracking initializing...');
    
    // Global variables
    let objectCounter = 0;
    let isVRMode = false;
    let handTrackingEnabled = false;
    let twoHandedObjects = new Map(); // Track objects being manipulated by both hands
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
        
        // Hand tracking component
        AFRAME.registerComponent('hand-tracking', {
            schema: {
                hand: {type: 'string', oneOf: ['left', 'right']},
                enableGestures: {type: 'boolean', default: true}
            },
            init: function() {
                this.hand = this.data.hand;
                this.pinching = false;
                this.grabbedObject = null;
                this.pinchThreshold = 0.8;
                this.lastPinchValue = 0;
                
                // Gesture states
                this.gestures = {
                    pinch: false,
                    point: false,
                    thumbsUp: false,
                    openHand: false
                };
                
                this.el.addEventListener('hand-tracking-extras-ready', this.setupGestures.bind(this));
            },
            
            setupGestures: function() {
                this.handTrackingExtras = this.el.components['hand-tracking-extras'];
                if (this.handTrackingExtras) {
                    console.log(`Hand tracking setup for ${this.hand} hand`);
                    handTrackingEnabled = true;
                }
            },
            
            tick: function() {
                if (!this.handTrackingExtras) return;
                
                const pinchStrength = this.handTrackingExtras.pinchStrength || 0;
                const isPointing = this.handTrackingExtras.isPointing || false;
                
                // Detect pinch gesture
                if (pinchStrength > this.pinchThreshold && !this.pinching) {
                    this.startPinchGrab();
                } else if (pinchStrength < this.pinchThreshold && this.pinching) {
                    this.endPinchGrab();
                }
                
                // Update gesture states
                this.gestures.pinch = pinchStrength > this.pinchThreshold;
                this.gestures.point = isPointing;
                this.gestures.openHand = pinchStrength < 0.3;
                
                // Check for objects in grab range
                this.checkForGrabbableObjects();
                
                // Update grabbed object position
                if (this.grabbedObject) {
                    this.updateGrabbedObjectPosition();
                }
            },
            
            checkForGrabbableObjects: function() {
                if (this.pinching || !this.gestures.openHand) return;
                
                const handPosition = this.el.getAttribute('position');
                const interactiveObjects = document.querySelectorAll('.interactive-object');
                
                let closestObject = null;
                let closestDistance = Infinity;
                
                interactiveObjects.forEach(obj => {
                    const objPosition = obj.getAttribute('position');
                    const distance = this.calculateDistance(handPosition, objPosition);
                    
                    if (distance < 0.15 && distance < closestDistance) {
                        closestDistance = distance;
                        closestObject = obj;
                    }
                });
                
                // Highlight closest object
                interactiveObjects.forEach(obj => {
                    if (obj === closestObject) {
                        obj.classList.add('hand-hoverable');
                    } else {
                        obj.classList.remove('hand-hoverable');
                    }
                });
            },
            
            startPinchGrab: function() {
                this.pinching = true;
                const handPosition = this.el.getAttribute('position');
                const interactiveObjects = document.querySelectorAll('.interactive-object');
                
                let closestObject = null;
                let closestDistance = Infinity;
                
                interactiveObjects.forEach(obj => {
                    const objPosition = obj.getAttribute('position');
                    const distance = this.calculateDistance(handPosition, objPosition);
                    
                    if (distance < 0.15 && distance < closestDistance) {
                        closestDistance = distance;
                        closestObject = obj;
                    }
                });
                
                if (closestObject) {
                    this.grabbedObject = closestObject;
                    this.grabbedObject.classList.add('hand-grabbed');
                    
                    // Store initial offset
                    const objPosition = closestObject.getAttribute('position');
                    this.grabOffset = {
                        x: objPosition.x - handPosition.x,
                        y: objPosition.y - handPosition.y,
                        z: objPosition.z - handPosition.z
                    };
                    
                    // Check if other hand is also grabbing this object
                    this.checkTwoHandedGrab(closestObject);
                    
                    console.log(`${this.hand} hand pinch grabbed object:`, closestObject.id);
                }
            },
            
            endPinchGrab: function() {
                if (this.grabbedObject) {
                    this.grabbedObject.classList.remove('hand-grabbed');
                    
                    // Remove from two-handed manipulation if applicable
                    if (twoHandedObjects.has(this.grabbedObject)) {
                        this.endTwoHandedManipulation(this.grabbedObject);
                    }
                    
                    console.log(`${this.hand} hand released object:`, this.grabbedObject.id);
                    this.grabbedObject = null;
                }
                this.pinching = false;
            },
            
            checkTwoHandedGrab: function(object) {
                // Check if the other hand is also grabbing this object
                const otherHandSelector = this.hand === 'left' ? '#rightHandTracking' : '#leftHandTracking';
                const otherHand = document.querySelector(otherHandSelector);
                
                if (otherHand && otherHand.components['hand-tracking'].grabbedObject === object) {
                    this.startTwoHandedManipulation(object);
                }
            },
            
            startTwoHandedManipulation: function(object) {
                if (twoHandedObjects.has(object)) return;
                
                const leftHand = document.querySelector('#leftHandTracking');
                const rightHand = document.querySelector('#rightHandTracking');
                
                if (leftHand && rightHand && 
                    leftHand.components['hand-tracking'].grabbedObject === object &&
                    rightHand.components['hand-tracking'].grabbedObject === object) {
                    
                    const leftPos = leftHand.getAttribute('position');
                    const rightPos = rightHand.getAttribute('position');
                    const objectPos = object.getAttribute('position');
                    
                    twoHandedObjects.set(object, {
                        initialDistance: this.calculateDistance(leftPos, rightPos),
                        initialScale: object.getAttribute('scale') || {x: 1, y: 1, z: 1},
                        initialRotation: object.getAttribute('rotation') || {x: 0, y: 0, z: 0},
                        centerOffset: {
                            x: objectPos.x - (leftPos.x + rightPos.x) / 2,
                            y: objectPos.y - (leftPos.y + rightPos.y) / 2,
                            z: objectPos.z - (leftPos.z + rightPos.z) / 2
                        }
                    });
                    
                    object.classList.add('two-handed-manipulation');
                    console.log('Started two-handed manipulation for:', object.id);
                }
            },
            
            endTwoHandedManipulation: function(object) {
                if (twoHandedObjects.has(object)) {
                    twoHandedObjects.delete(object);
                    object.classList.remove('two-handed-manipulation');
                    console.log('Ended two-handed manipulation for:', object.id);
                }
            },
            
            updateGrabbedObjectPosition: function() {
                if (!this.grabbedObject) return;
                
                const handPosition = this.el.getAttribute('position');
                const handRotation = this.el.getAttribute('rotation');
                
                if (twoHandedObjects.has(this.grabbedObject)) {
                    this.updateTwoHandedObject();
                } else {
                    // Single hand manipulation
                    const newPosition = {
                        x: handPosition.x + this.grabOffset.x,
                        y: handPosition.y + this.grabOffset.y,
                        z: handPosition.z + this.grabOffset.z
                    };
                    
                    this.grabbedObject.setAttribute('position', newPosition);
                    
                    // Optional: Apply hand rotation to object
                    if (this.gestures.point) {
                        this.grabbedObject.setAttribute('rotation', {
                            x: handRotation.x,
                            y: handRotation.y,
                            z: handRotation.z
                        });
                    }
                }
            },
            
            updateTwoHandedObject: function() {
                const object = this.grabbedObject;
                const manipData = twoHandedObjects.get(object);
                if (!manipData) return;
                
                const leftHand = document.querySelector('#leftHandTracking');
                const rightHand = document.querySelector('#rightHandTracking');
                
                if (!leftHand || !rightHand) return;
                
                const leftPos = leftHand.getAttribute('position');
                const rightPos = rightHand.getAttribute('position');
                const leftRot = leftHand.getAttribute('rotation');
                const rightRot = rightHand.getAttribute('rotation');
                
                // Calculate center position
                const centerPos = {
                    x: (leftPos.x + rightPos.x) / 2 + manipData.centerOffset.x,
                    y: (leftPos.y + rightPos.y) / 2 + manipData.centerOffset.y,
                    z: (leftPos.z + rightPos.z) / 2 + manipData.centerOffset.z
                };
                
                // Calculate distance for scaling
                const currentDistance = this.calculateDistance(leftPos, rightPos);
                const scaleMultiplier = currentDistance / manipData.initialDistance;
                const newScale = {
                    x: manipData.initialScale.x * Math.max(0.1, Math.min(3, scaleMultiplier)),
                    y: manipData.initialScale.y * Math.max(0.1, Math.min(3, scaleMultiplier)),
                    z: manipData.initialScale.z * Math.max(0.1, Math.min(3, scaleMultiplier))
                };
                
                // Calculate rotation based on hand orientations
                const avgRotation = {
                    x: (leftRot.x + rightRot.x) / 2,
                    y: (leftRot.y + rightRot.y) / 2,
                    z: (leftRot.z + rightRot.z) / 2
                };
                
                // Apply transformations
                object.setAttribute('position', centerPos);
                object.setAttribute('scale', newScale);
                object.setAttribute('rotation', avgRotation);
            },
            
            calculateDistance: function(pos1, pos2) {
                const dx = pos1.x - pos2.x;
                const dy = pos1.y - pos2.y;
                const dz = pos1.z - pos2.z;
                return Math.sqrt(dx * dx + dy * dy + dz * dz);
            }
        });

        // Enhanced grabbable component with both controller and hand support
        AFRAME.registerComponent('enhanced-grabbable', {
            schema: {
                startButtons: {default: 'triggerdown'},
                endButtons: {default: 'triggerup'},
                handGrabbable: {default: true}
            },
            init: function() {
                // Controller events
                this.el.addEventListener('grab-start', this.onGrabStart.bind(this));
                this.el.addEventListener('grab-end', this.onGrabEnd.bind(this));
                this.el.addEventListener('stretch-start', this.onStretchStart.bind(this));
                this.el.addEventListener('stretch-end', this.onStretchEnd.bind(this));
                
                // Hand tracking events
                this.el.addEventListener('hand-grab-start', this.onHandGrabStart.bind(this));
                this.el.addEventListener('hand-grab-end', this.onHandGrabEnd.bind(this));
            },
            
            onGrabStart: function(evt) {
                // Controller grab
                if (evt.detail.hand && evt.detail.hand.components['meta-touch-controls']) {
                    evt.detail.hand.components['meta-touch-controls'].pulse(0.5, 100);
                }
                this.applyGrabVisuals();
                console.log('Controller grabbed:', this.el.id || 'unnamed');
            },
            
            onGrabEnd: function(evt) {
                this.removeGrabVisuals();
                console.log('Controller released:', this.el.id || 'unnamed');
            },
            
            onHandGrabStart: function(evt) {
                // Hand grab
                this.applyGrabVisuals();
                console.log('Hand grabbed:', this.el.id || 'unnamed');
            },
            
            onHandGrabEnd: function(evt) {
                this.removeGrabVisuals();
                console.log('Hand released:', this.el.id || 'unnamed');
            },
            
            applyGrabVisuals: function() {
                this.el.setAttribute('material', 'opacity', 0.8);
                this.el.setAttribute('animation', {
                    property: 'scale',
                    to: '1.1 1.1 1.1',
                    dur: 200,
                    easing: 'easeOutQuad'
                });
            },
            
            removeGrabVisuals: function() {
                this.el.setAttribute('material', 'opacity', 1);
                this.el.setAttribute('animation', {
                    property: 'scale',
                    to: '1 1 1',
                    dur: 200,
                    easing: 'easeOutQuad'
                });
            },
            
            onStretchStart: function(evt) {
                console.log('Stretch started:', this.el.id || 'unnamed');
            },
            
            onStretchEnd: function(evt) {
                console.log('Stretch ended:', this.el.id || 'unnamed');
            }
        });

        // Gesture recognition component
        AFRAME.registerComponent('gesture-recognition', {
            schema: {
                enabled: {type: 'boolean', default: true}
            },
            init: function() {
                this.gestures = {
                    spawn: {
                        name: 'spawn',
                        pattern: 'thumbsUp',
                        duration: 1000,
                        active: false,
                        timer: 0
                    },
                    delete: {
                        name: 'delete',
                        pattern: 'point',
                        duration: 2000,
                        active: false,
                        timer: 0
                    }
                };
            },
            
            tick: function(time, timeDelta) {
                if (!this.data.enabled) return;
                
                const leftHand = document.querySelector('#leftHandTracking');
                const rightHand = document.querySelector('#rightHandTracking');
                
                if (leftHand && rightHand) {
                    this.checkGestures(leftHand, rightHand, timeDelta);
                }
            },
            
            checkGestures: function(leftHand, rightHand, timeDelta) {
                const leftComponent = leftHand.components['hand-tracking'];
                const rightComponent = rightHand.components['hand-tracking'];
                
                if (!leftComponent || !rightComponent) return;
                
                // Check spawn gesture (both hands thumbs up)
                if (leftComponent.gestures.thumbsUp && rightComponent.gestures.thumbsUp) {
                    this.gestures.spawn.timer += timeDelta;
                    if (this.gestures.spawn.timer >= this.gestures.spawn.duration && !this.gestures.spawn.active) {
                        this.executeSpawnGesture();
                        this.gestures.spawn.active = true;
                    }
                } else {
                    this.gestures.spawn.timer = 0;
                    this.gestures.spawn.active = false;
                }
                
                // Check delete gesture (pointing at object for extended time)
                if (rightComponent.gestures.point) {
                    const pointedObject = this.getPointedObject(rightHand);
                    if (pointedObject) {
                        this.gestures.delete.timer += timeDelta;
                        if (this.gestures.delete.timer >= this.gestures.delete.duration) {
                            this.executeDeleteGesture(pointedObject);
                            this.gestures.delete.timer = 0;
                        }
                    } else {
                        this.gestures.delete.timer = 0;
                    }
                } else {
                    this.gestures.delete.timer = 0;
                }
            },
            
            executeSpawnGesture: function() {
                const randomObject = spawnableObjects[Math.floor(Math.random() * spawnableObjects.length)];
                const spawnPos = {x: 0, y: 2, z: -1};
                spawnInteractiveObject(randomObject, spawnPos);
                console.log('Gesture spawned object:', randomObject.name);
            },
            
            executeDeleteGesture: function(object) {
                if (object && object.classList.contains('interactive-object')) {
                    object.setAttribute('animation', {
                        property: 'scale',
                        to: '0 0 0',
                        dur: 300,
                        easing: 'easeInQuad'
                    });
                    
                    setTimeout(() => {
                        if (object.parentNode) {
                            object.parentNode.removeChild(object);
                            performanceStats.objects--;
                            console.log('Gesture deleted object');
                        }
                    }, 300);
                }
            },
            
            getPointedObject: function(hand) {
                // Simplified ray casting from hand position
                const handPosition = hand.getAttribute('position');
                const handRotation = hand.getAttribute('rotation');
                
                // This would need more sophisticated ray casting implementation
                // For now, return null - implement proper ray casting as needed
                return null;
            }
        });

        // Rest of the existing components (cursor-listener, object-spawner, etc.)
        // ... (keeping all existing components as they were)
        
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
            setupHandTracking();
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

        // Rest of existing event listeners...
        // (keeping keyboard shortcuts and error handling as before)
    }

    /**
     * Setup hand tracking
     */
    function setupHandTracking() {
        const leftHandTracking = document.querySelector('#leftHandTracking');
        const rightHandTracking = document.querySelector('#rightHandTracking');
        
        if (leftHandTracking) {
            leftHandTracking.setAttribute('hand-tracking', 'hand: left');
            console.log('Left hand tracking initialized');
        }
        
        if (rightHandTracking) {
            rightHandTracking.setAttribute('hand-tracking', 'hand: right');
            console.log('Right hand tracking initialized');
        }
        
        // Add gesture recognition to camera rig
        const cameraRig = document.querySelector('#cameraRig');
        if (cameraRig) {
            cameraRig.setAttribute('gesture-recognition', '');
        }
    }

    /**
     * Spawn an interactive object with enhanced hand support
     */
    function spawnInteractiveObject(spawnData, position) {
        const scene = document.querySelector('a-scene');
        const entity = document.createElement('a-entity');
        
        objectCounter++;
        entity.setAttribute('id', `spawned-object-${objectCounter}`);
        entity.setAttribute('class', 'interactive-object');
        
        // Set position with slight randomization
        const spawnPos = {
            x: position.x + (Math.random() - 0.5) * 0.5,
            y: position.y + Math.random() * 0.5,
            z: position.z + (Math.random() - 0.5) * 0.5
        };
        entity.setAttribute('position', spawnPos);
        
        // Set geometry based on type (same as before)
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
        
        // Set material
        const baseColor = spawnData.defaultColor;
        entity.setAttribute('material', {
            color: baseColor,
            metalness: 0.2,
            roughness: 0.8
        });
        
        // Add interaction components for both controllers and hands
        entity.setAttribute('super-hands', 'colliderEvent: raycaster-intersection; colliderEventProperty: els; colliderEndEvent: raycaster-intersection-cleared; colliderEndEventProperty: clearedEls');
        entity.setAttribute('grabbable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('stretchable', 'startButtons: gripdown; endButtons: gripup');
        entity.setAttribute('draggable', 'startButtons: triggerdown; endButtons: triggerup');
        entity.setAttribute('enhanced-grabbable', 'handGrabbable: true');
        
        scene.appendChild(entity);
        performanceStats.objects++;
        
        console.log(`Spawned ${spawnData.name} with hand support at position:`, spawnPos);
    }

    // Rest of existing functions (initializeUI, hideLoadingScreen, etc.)
    // ... (keeping all other existing functions as they were)

    // Export functions for global access
    window.VRWorkshop = {
        spawnObject: spawnInteractiveObject,
        togglePerformanceStats: togglePerformanceStats,
        toggleDebugMode: toggleDebugMode,
        getStats: () => performanceStats,
        getHandTrackingStatus: () => handTrackingEnabled,
        getTwoHandedObjects: () => Array.from(twoHandedObjects.keys())
    };

    console.log('VR Interactive Workshop with Hand Tracking initialized successfully!');
});
