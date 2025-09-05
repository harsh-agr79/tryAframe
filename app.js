// VR Interactive Workshop - Fixed VR Version
// Proper VR object showcase with working interactions

document.addEventListener('DOMContentLoaded', function() {
    console.log('VR Interactive Workshop with Object Showcase initializing...');
    
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
    
    // Shape definitions for showcase
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
    setupVRShowcase();
    startPerformanceMonitoring();

    /**
     * Register VR components
     */
    function initializeComponents() {
        
        // VR Object Spawner Component
        AFRAME.registerComponent('vr-spawner', {
            schema: {
                shapeType: { type: 'string' },
                shapeName: { type: 'string' }
            },
            
            init: function() {
                this.el.addEventListener('click', this.onSpawn.bind(this));
                this.el.addEventListener('mouseenter', this.onHover.bind(this));
                this.el.addEventListener('mouseleave', this.onHoverEnd.bind(this));
                
                // Add floating animation
                this.el.setAttribute('animation', {
                    property: 'rotation',
                    to: '0 360 0',
                    dur: 8000,
                    loop: true,
                    easing: 'linear'
                });
            },
            
            onSpawn: function(evt) {
                const shapeData = shapeDefinitions.find(s => s.type === this.data.shapeType);
                if (shapeData) {
                    // Spawn in front of user
                    const spawnPosition = {
                        x: (Math.random() - 0.5) * 2,
                        y: 1.5 + Math.random() * 0.5,
                        z: -2 + (Math.random() - 0.5) * 1
                    };
                    spawnInteractiveObject(shapeData, spawnPosition);
                    
                    // Visual feedback
                    this.el.setAttribute('animation__spawn', {
                        property: 'scale',
                        to: '1.3 1.3 1.3',
                        dur: 200,
                        dir: 'alternate',
                        loop: 1
                    });
                    
                    console.log(`VR Spawned: ${this.data.shapeName}`);
                }
            },
            
            onHover: function() {
                this.el.setAttribute('material', 'emissive: #222222');
                this.el.setAttribute('animation__hover', {
                    property: 'scale',
                    to: '1.2 1.2 1.2',
                    dur: 300
                });
            },
            
            onHoverEnd: function() {
                this.el.setAttribute('material', 'emissive: #000000');
                this.el.setAttribute('animation__hover', {
                    property: 'scale',
                    to: '1 1 1',
                    dur: 300
                });
            }
        });

        // Enhanced Interactive Object Component - FIXED
        AFRAME.registerComponent('interactive-object', {
            init: function() {
                console.log('Initializing interactive object:', this.el.id);
                
                // Ensure proper class
                this.el.classList.add('interactive-object');
                
                // Wait a frame for all components to be ready
                setTimeout(() => {
                    this.setupInteractions();
                }, 100);
            },
            
            setupInteractions: function() {
                // Remove any existing listeners to avoid duplicates
                this.el.removeEventListener('triggerdown', this.onTrigger);
                this.el.removeEventListener('abuttondown', this.onDelete);
                this.el.removeEventListener('grab-start', this.onGrabStart);
                this.el.removeEventListener('grab-end', this.onGrabEnd);
                
                // Add VR controller interactions
                this.el.addEventListener('triggerdown', this.onTrigger.bind(this));
                this.el.addEventListener('abuttondown', this.onDelete.bind(this));
                this.el.addEventListener('grab-start', this.onGrabStart.bind(this));
                this.el.addEventListener('grab-end', this.onGrabEnd.bind(this));
                
                // Add mouse interactions for desktop
                this.el.addEventListener('click', this.onClick.bind(this));
                this.el.addEventListener('mouseenter', this.onHover.bind(this));
                this.el.addEventListener('mouseleave', this.onHoverEnd.bind(this));
                
                console.log('Interactive object setup complete:', this.el.id);
            },
            
            onTrigger: function(evt) {
                if (deleteMode) {
                    this.deleteObject();
                } else {
                    this.selectObject();
                }
            },
            
            onDelete: function(evt) {
                evt.stopPropagation();
                this.deleteObject();
            },
            
            onClick: function(evt) {
                if (deleteMode) {
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
                console.log('Object grabbed:', this.el.id);
                
                // Haptic feedback if available
                if (evt.detail && evt.detail.hand) {
                    const controller = evt.detail.hand.components['oculus-touch-controls'] || 
                                     evt.detail.hand.components['vive-controls'];
                    if (controller && controller.pulse) {
                        controller.pulse(0.8, 100);
                    }
                }
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
                    const prevMaterial = selectedObject.getAttribute('material');
                    if (prevMaterial) {
                        selectedObject.setAttribute('material', 'emissive: #000000');
                    }
                }
                
                selectedObject = this.el;
                this.el.setAttribute('material', 'emissive: #222222');
                console.log('Selected:', this.el.id);
            },
            
            deleteObject: function() {
                console.log('Deleting object:', this.el.id);
                
                // Animation before deletion
                this.el.setAttribute('animation__delete', {
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
     * Setup VR Object Showcase
     */
    function setupVRShowcase() {
        const scene = document.querySelector('a-scene');
        
        // Create showcase container
        const showcase = document.createElement('a-entity');
        showcase.setAttribute('id', 'object-showcase');
        showcase.setAttribute('position', '0 2 -4');
        
        // Create title text
        const title = document.createElement('a-text');
        title.setAttribute('value', 'VR OBJECT SPAWNER');
        title.setAttribute('position', '0 1.5 0');
        title.setAttribute('align', 'center');
        title.setAttribute('color', '#4CC3D9');
        title.setAttribute('font', 'kelsonsans');
        title.setAttribute('width', '8');
        showcase.appendChild(title);
        
        // Create instructions text
        const instructions = document.createElement('a-text');
        instructions.setAttribute('value', 'Point and TRIGGER to spawn • A button to delete');
        instructions.setAttribute('position', '0 1 0');
        instructions.setAttribute('align', 'center');
        instructions.setAttribute('color', '#FFFFFF');
        instructions.setAttribute('width', '6');
        showcase.appendChild(instructions);
        
        // Create showcase objects in a circle
        const radius = 2;
        shapeDefinitions.forEach((shape, index) => {
            const angle = (index / shapeDefinitions.length) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create showcase object
            const showcaseObject = document.createElement('a-entity');
            showcaseObject.setAttribute('id', `showcase-${shape.type}`);
            showcaseObject.setAttribute('position', `${x} 0 ${z}`);
            showcaseObject.setAttribute('geometry', shape.geometry);
            showcaseObject.setAttribute('material', {
                color: shape.color,
                metalness: 0.3,
                roughness: 0.7,
                emissive: '#000000'
            });
            
            // Add spawner component
            showcaseObject.setAttribute('vr-spawner', {
                shapeType: shape.type,
                shapeName: shape.name
            });
            
            // Make it interactive
            showcaseObject.setAttribute('class', 'clickable');
            
            // Add label
            const label = document.createElement('a-text');
            label.setAttribute('value', shape.name);
            label.setAttribute('position', '0 -0.8 0');
            label.setAttribute('align', 'center');
            label.setAttribute('color', '#FFFFFF');
            label.setAttribute('width', '8');
            showcaseObject.appendChild(label);
            
            showcase.appendChild(showcaseObject);
        });
        
        // Add delete mode toggle
        const deleteModeToggle = document.createElement('a-box');
        deleteModeToggle.setAttribute('id', 'delete-toggle');
        deleteModeToggle.setAttribute('position', '0 -1.5 0');
        deleteModeToggle.setAttribute('width', '1');
        deleteModeToggle.setAttribute('height', '0.3');
        deleteModeToggle.setAttribute('depth', '0.3');
        deleteModeToggle.setAttribute('color', '#ff4444');
        deleteModeToggle.setAttribute('class', 'clickable');
        deleteModeToggle.addEventListener('click', toggleDeleteMode);
        
        const deleteLabel = document.createElement('a-text');
        deleteLabel.setAttribute('value', 'DELETE MODE');
        deleteLabel.setAttribute('position', '0 -0.3 0.2');
        deleteLabel.setAttribute('align', 'center');
        deleteLabel.setAttribute('color', '#FFFFFF');
        deleteLabel.setAttribute('width', '6');
        deleteModeToggle.appendChild(deleteLabel);
        
        showcase.appendChild(deleteModeToggle);
        
        // Add clear all button
        const clearButton = document.createElement('a-box');
        clearButton.setAttribute('id', 'clear-all');
        clearButton.setAttribute('position', '2.5 -1.5 0');
        clearButton.setAttribute('width', '1');
        clearButton.setAttribute('height', '0.3');
        clearButton.setAttribute('depth', '0.3');
        clearButton.setAttribute('color', '#FFC65D');
        clearButton.setAttribute('class', 'clickable');
        clearButton.addEventListener('click', clearAllObjects);
        
        const clearLabel = document.createElement('a-text');
        clearLabel.setAttribute('value', 'CLEAR ALL');
        clearLabel.setAttribute('position', '0 -0.3 0.2');
        clearLabel.setAttribute('align', 'center');
        clearLabel.setAttribute('color', '#000000');
        clearLabel.setAttribute('width', '6');
        clearButton.appendChild(clearLabel);
        
        showcase.appendChild(clearButton);
        
        scene.appendChild(showcase);
        console.log('VR Object Showcase created');
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        const scene = document.querySelector('a-scene');
        
        scene.addEventListener('loaded', function() {
            console.log('VR Scene loaded');
            hideLoadingScreen();
            setupControllers();
            setupVRButton();
        });

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

        // Desktop controls
        document.addEventListener('keydown', function(evt) {
            if (isVRMode) return;
            
            switch(evt.key.toLowerCase()) {
                case '1': case '2': case '3': case '4': case '5': case '6':
                    const index = parseInt(evt.key) - 1;
                    if (shapeDefinitions[index]) {
                        spawnInteractiveObject(shapeDefinitions[index], {x: 0, y: 2, z: -1});
                    }
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
            }
        });
    }

    /**
     * Setup VR controllers
     */
    function setupControllers() {
        const leftController = document.querySelector('#leftController');
        const rightController = document.querySelector('#rightController');

        if (leftController) {
            leftController.addEventListener('bbuttondown', function() {
                toggleDeleteMode();
                console.log('Left B - Delete mode toggled');
            });
            
            leftController.addEventListener('ybuttondown', function() {
                clearAllObjects();
                console.log('Left Y - Clear all');
            });
        }

        if (rightController) {
            rightController.addEventListener('bbuttondown', function() {
                toggleDeleteMode();
                console.log('Right B - Delete mode toggled');
            });
            
            rightController.addEventListener('abuttondown', function() {
                // This will be handled by individual objects
                console.log('Right A - Delete selected');
            });
        }

        console.log('VR Controllers setup completed');
    }

    /**
     * Setup VR button
     */
    function setupVRButton() {
        const enterVRButton = document.getElementById('enterVRButton');
        const scene = document.querySelector('a-scene');
        
        if (enterVRButton && scene) {
            enterVRButton.addEventListener('click', function() {
                scene.enterVR().catch(err => {
                    console.error('Failed to enter VR:', err);
                });
            });
        }
    }

    /**
     * FIXED: Spawn interactive object with ALL required components
     */
    function spawnInteractiveObject(shapeData, position) {
        const scene = document.querySelector('a-scene');
        const entity = document.createElement('a-entity');
        
        objectCounter++;
        const objectId = `spawned-${shapeData.type}-${objectCounter}`;
        entity.setAttribute('id', objectId);
        
        // Set position
        const spawnPos = {
            x: position.x + (Math.random() - 0.5) * 0.3,
            y: position.y + Math.random() * 0.2,
            z: position.z + (Math.random() - 0.5) * 0.3
        };
        entity.setAttribute('position', spawnPos);
        
        // Set geometry
        entity.setAttribute('geometry', shapeData.geometry);
        
        // Set material
        entity.setAttribute('material', {
            color: shapeData.color,
            metalness: 0.3,
            roughness: 0.7,
            emissive: '#000000'
        });
        
        // Add physics
        entity.setAttribute('dynamic-body', 'shape: auto; mass: 1');
        
        // CRITICAL: Add all interaction components
        entity.setAttribute('grabbable', '');
        entity.setAttribute('droppable', '');
        entity.setAttribute('stretchable', '');
        
        // Add to scene FIRST
        scene.appendChild(entity);
        
        // THEN add our custom component (this is crucial)
        setTimeout(() => {
            entity.setAttribute('interactive-object', '');
        }, 50);
        
        performanceStats.objects++;
        
        console.log(`✅ Spawned interactive ${shapeData.name} (${objectId})`);
        
        return entity;
    }

    /**
     * Toggle delete mode
     */
    function toggleDeleteMode() {
        deleteMode = !deleteMode;
        
        // Update delete button color
        const deleteToggle = document.querySelector('#delete-toggle');
        if (deleteToggle) {
            deleteToggle.setAttribute('color', deleteMode ? '#ff0000' : '#ff4444');
        }
        
        document.body.classList.toggle('delete-mode', deleteMode);
        console.log('Delete mode:', deleteMode ? 'ON' : 'OFF');
    }

    /**
     * Clear all objects
     */
    function clearAllObjects() {
        const objects = document.querySelectorAll('.interactive-object');
        
        console.log('Clearing', objects.length, 'objects');
        
        objects.forEach((obj, index) => {
            setTimeout(() => {
                if (obj && obj.parentNode) {
                    obj.setAttribute('animation__clear', {
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
                }
            }, index * 30);
        });
        
        setTimeout(() => {
            performanceStats.objects = 0;
            selectedObject = null;
        }, objects.length * 30 + 200);
    }

    /**
     * Initialize UI elements
     */
    function initializeUI() {
        // Loading screen
        const loadingScreen = document.createElement('div');
        loadingScreen.className = 'loading-screen';
        loadingScreen.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading VR Object Showcase...</div>
        `;
        document.body.appendChild(loadingScreen);

        // Desktop controls
        const controlsInfo = document.createElement('div');
        controlsInfo.className = 'controls-info';
        controlsInfo.innerHTML = `
            <h3>🎮 VR Object Showcase</h3>
            <div class="control-section">
                <h4>VR Controls:</h4>
                <ul>
                    <li><strong>Trigger:</strong> Spawn objects from showcase / Select objects</li>
                    <li><strong>A Button:</strong> Delete pointed object</li>
                    <li><strong>B Button:</strong> Toggle delete mode</li>
                    <li><strong>Y Button:</strong> Clear all objects</li>
                    <li><strong>Grip:</strong> Grab and move objects</li>
                </ul>
                <h4>Desktop:</h4>
                <ul>
                    <li><kbd>1-6</kbd> Spawn shapes</li>
                    <li><kbd>Delete</kbd> Toggle delete mode</li>
                    <li><kbd>Ctrl+C</kbd> Clear all</li>
                </ul>
            </div>
            <button onclick="this.parentElement.style.display='none'">Hide</button>
        `;
        document.body.appendChild(controlsInfo);

        // Performance stats
        const perfStats = document.createElement('div');
        perfStats.className = 'performance-stats hidden';
        perfStats.innerHTML = `
            <h4>📊 Performance</h4>
            <div>FPS: <span id="fps-value">0</span></div>
            <div>Objects: <span id="objects-value">0</span></div>
            <div>Memory: <span id="memory-value">0</span>MB</div>
        `;
        document.body.appendChild(perfStats);
    }

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

    // Global API
    window.VRWorkshop = {
        spawnCube: () => spawnInteractiveObject(shapeDefinitions[0], {x: 0, y: 2, z: -1}),
        clearAll: clearAllObjects,
        toggleDelete: toggleDeleteMode,
        getStats: () => performanceStats
    };

    console.log('✅ VR Object Showcase Ready!');
    console.log('🎯 Point at showcase objects and pull trigger to spawn');
    console.log('🗑️ Press A button while pointing at objects to delete');
});
