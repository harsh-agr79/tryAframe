import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Enhanced VR Object Creator with comprehensive WebXR support
class VRObjectCreator {
    constructor() {
        // Core Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // VR components
        this.controllers = [];
        this.hands = [];
        this.raycasters = [];
        
        // Scene objects
        this.objects = [];
        this.menu = null;
        this.menuButtons = [];
        this.room = null;
        this.platform = null;
        this.tables = [];
        
        // Interaction state
        this.selectedObject = null;
        this.grabbedObject = null;
        this.grabbedController = null;
        this.isDeleteMode = false;
        this.objectCount = 0;
        
        // Input handling
        this.mouse = new THREE.Vector2();
        this.mouseRaycaster = new THREE.Raycaster();
        this.inputMethod = 'desktop';
        
        // WebXR compatibility
        this.webXRSupported = false;
        this.vrSessionAvailable = false;
        this.httpsRequired = !this.isHTTPS();
        this.compatibilityIssues = [];
        
        // Grab interaction
        this.grabOffset = new THREE.Vector3();
        this.grabRotationOffset = new THREE.Quaternion();
        
        this.init();
    }

    async init() {
        try {
            this.showLoadingStep('step-webxr', '⏳ Checking WebXR support');
            
            // Check compatibility first
            await this.checkWebXRCompatibility();
            this.updateCompatibilityUI();
            
            this.showLoadingStep('step-scene', '⏳ Creating 3D scene');
            this.createScene();
            this.createRoom();
            this.createPlatform();
            this.createTables();
            this.createMenu();
            this.setupLights();
            
            this.showLoadingStep('step-vr', '⏳ Setting up VR');
            await this.setupVR();
            
            this.setupEventListeners();
            this.animate();
            this.updateUI();
            
            // Hide loading overlay
            setTimeout(() => {
                document.getElementById('loading-overlay').classList.add('hidden');
            }, 1000);

            console.log('VR Object Creator initialized successfully');
            
        } catch (error) {
            console.error('Initialization failed:', error);
            this.showLoadingError(error.message);
        }
    }

    showLoadingError(message) {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div style="color: var(--color-error); font-size: var(--font-size-xl); margin-bottom: var(--space-16);">
                        ❌ Application Failed to Load
                    </div>
                    <div style="font-size: var(--font-size-md); margin-bottom: var(--space-16);">
                        ${message}
                    </div>
                    <button onclick="location.reload()" class="btn btn--primary">
                        🔄 Reload Page
                    </button>
                </div>
            `;
        }
    }

    isHTTPS() {
        return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    }

    async checkWebXRCompatibility() {
        const issues = [];
        
        // Check HTTPS
        if (!this.isHTTPS()) {
            issues.push({
                type: 'https',
                message: 'HTTPS required for WebXR',
                solution: 'Access this page via HTTPS or localhost'
            });
        }
        
        // Check navigator.xr
        if (!('xr' in navigator)) {
            issues.push({
                type: 'webxr-api',
                message: 'WebXR not available in this browser',
                solution: 'Use Chrome 79+, Firefox 98+, or Quest Browser'
            });
        } else {
            this.webXRSupported = true;
            
            try {
                // Check VR session support
                const vrSupported = await navigator.xr.isSessionSupported('immersive-vr');
                this.vrSessionAvailable = vrSupported;
                
                if (!vrSupported) {
                    issues.push({
                        type: 'vr-session',
                        message: 'VR sessions not supported',
                        solution: 'Connect a VR headset or enable WebXR flags'
                    });
                }
            } catch (error) {
                console.warn('VR support check failed:', error);
                issues.push({
                    type: 'vr-check-failed',
                    message: 'Failed to check VR support',
                    solution: 'Check browser WebXR flags or permissions'
                });
            }
        }
        
        this.compatibilityIssues = issues;
    }

    updateCompatibilityUI() {
        // Update HTTPS status
        const httpsStatus = document.getElementById('https-status');
        if (this.isHTTPS()) {
            httpsStatus.className = 'status status--success';
            httpsStatus.innerHTML = '✅ HTTPS: Secure';
        } else {
            httpsStatus.className = 'status status--error';
            httpsStatus.innerHTML = '❌ HTTPS: Required';
        }
        
        // Update WebXR status
        const webxrStatus = document.getElementById('webxr-status');
        if (this.webXRSupported) {
            webxrStatus.className = 'status status--success';
            webxrStatus.innerHTML = '✅ WebXR: Available';
        } else {
            webxrStatus.className = 'status status--error';
            webxrStatus.innerHTML = '❌ WebXR: Not Available';
        }
        
        // Update VR status
        const vrStatus = document.getElementById('vr-status');
        if (this.vrSessionAvailable) {
            vrStatus.className = 'status status--success';
            vrStatus.innerHTML = '✅ VR Support: Ready';
        } else if (this.webXRSupported) {
            vrStatus.className = 'status status--warning';
            vrStatus.innerHTML = '⚠️ VR Support: Limited';
        } else {
            vrStatus.className = 'status status--error';
            vrStatus.innerHTML = '❌ VR Support: None';
        }
        
        // Show error/troubleshooting panels if needed
        if (this.compatibilityIssues.length > 0) {
            this.showCompatibilityIssues();
        }
        
        // Update current mode
        const modeElement = document.getElementById('current-mode');
        if (this.vrSessionAvailable) {
            modeElement.textContent = 'VR Ready';
            modeElement.style.color = 'var(--color-success)';
        } else {
            modeElement.textContent = 'Desktop Fallback';
            modeElement.style.color = 'var(--color-warning)';
        }
    }

    showCompatibilityIssues() {
        const errorPanel = document.getElementById('error-panel');
        const errorList = document.getElementById('error-list');
        const troubleshooting = document.getElementById('troubleshooting');
        
        // Build error list
        let errorHTML = '<ul>';
        this.compatibilityIssues.forEach(issue => {
            errorHTML += `<li><strong>${issue.message}</strong><br><small>${issue.solution}</small></li>`;
        });
        errorHTML += '</ul>';
        
        errorList.innerHTML = errorHTML;
        errorPanel.classList.remove('hidden');
        troubleshooting.classList.remove('hidden');
    }

    showLoadingStep(stepId, text) {
        const step = document.getElementById(stepId);
        if (step) {
            step.textContent = text;
            step.classList.add('completed');
        }
    }

    createScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x404040);
        this.scene.fog = new THREE.Fog(0x404040, 5, 15);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            1000
        );
        this.camera.position.set(0, 1.6, 3);

        // Renderer with enhanced settings
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        document.body.appendChild(this.renderer.domElement);

        // Desktop controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1.6, 0);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.minDistance = 1;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI / 1.8;
        this.controls.update();
    }

    createRoom() {
        const roomGroup = new THREE.Group();
        const { width, height, depth } = { width: 10, height: 4, depth: 10 };
        
        // Enhanced materials with textures
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B7355,
            transparent: true,
            opacity: 0.9
        });
        
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x654321
        });
        
        const ceilingMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xF5F5DC
        });

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(width, depth);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        roomGroup.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry.clone(), ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        roomGroup.add(ceiling);

        // Walls
        const wallGeometry = new THREE.PlaneGeometry(width, height);
        
        // Back wall
        const backWall = new THREE.Mesh(wallGeometry.clone(), wallMaterial.clone());
        backWall.position.set(0, height / 2, -depth / 2);
        roomGroup.add(backWall);

        // Front wall (partial for entrance)
        const frontWall = new THREE.Mesh(wallGeometry.clone(), wallMaterial.clone());
        frontWall.position.set(0, height / 2, depth / 2);
        frontWall.rotation.y = Math.PI;
        roomGroup.add(frontWall);

        // Side walls
        const sideWallGeometry = new THREE.PlaneGeometry(depth, height);
        
        const leftWall = new THREE.Mesh(sideWallGeometry.clone(), wallMaterial.clone());
        leftWall.position.set(-width / 2, height / 2, 0);
        leftWall.rotation.y = Math.PI / 2;
        roomGroup.add(leftWall);

        const rightWall = new THREE.Mesh(sideWallGeometry.clone(), wallMaterial.clone());
        rightWall.position.set(width / 2, height / 2, 0);
        rightWall.rotation.y = -Math.PI / 2;
        roomGroup.add(rightWall);

        this.room = roomGroup;
        this.scene.add(roomGroup);
    }

    createPlatform() {
        const platformGeometry = new THREE.BoxGeometry(4, 0.2, 4);
        const platformMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513
        });
        
        this.platform = new THREE.Mesh(platformGeometry, platformMaterial);
        this.platform.position.set(0, 0.1, 0);
        this.platform.castShadow = true;
        this.platform.receiveShadow = true;
        this.scene.add(this.platform);
    }

    createTables() {
        const tablePositions = [
            { x: 2, y: 0.4, z: 2 },
            { x: -2, y: 0.4, z: -2 }
        ];

        tablePositions.forEach((pos, index) => {
            const tableGroup = new THREE.Group();
            
            // Table top
            const topGeometry = new THREE.BoxGeometry(1.5, 0.1, 1);
            const topMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            const top = new THREE.Mesh(topGeometry, topMaterial);
            top.position.y = 0.4;
            top.castShadow = true;
            top.receiveShadow = true;
            tableGroup.add(top);

            // Table legs
            const legGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.1);
            const legMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
            
            const legPositions = [
                [-0.7, 0, -0.4], [0.7, 0, -0.4],
                [-0.7, 0, 0.4], [0.7, 0, 0.4]
            ];
            
            legPositions.forEach(legPos => {
                const leg = new THREE.Mesh(legGeometry.clone(), legMaterial.clone());
                leg.position.set(legPos[0], legPos[1], legPos[2]);
                leg.castShadow = true;
                tableGroup.add(leg);
            });

            tableGroup.position.set(pos.x, pos.y, pos.z);
            this.tables.push(tableGroup);
            this.scene.add(tableGroup);
        });
    }

    createMenu() {
        const menuGroup = new THREE.Group();
        menuGroup.position.set(0, 2.5, -3);

        // Menu background
        const menuBg = new THREE.Mesh(
            new THREE.PlaneGeometry(4, 1.8),
            new THREE.MeshLambertMaterial({ 
                color: 0x333333, 
                transparent: true, 
                opacity: 0.9
            })
        );
        menuGroup.add(menuBg);

        // Menu title
        const titleGeometry = new THREE.PlaneGeometry(2, 0.3);
        const titleMaterial = new THREE.MeshLambertMaterial({ color: 0x00FFFF });
        const title = new THREE.Mesh(titleGeometry, titleMaterial);
        title.position.set(0, 0.6, 0.01);
        menuGroup.add(title);

        // Object creation buttons
        const objectTypes = ['cube', 'sphere', 'cylinder', 'cone', 'torus', 'tetrahedron'];
        const buttonWidth = 0.5;
        const buttonHeight = 0.3;
        const buttonsPerRow = 3;
        
        this.menuButtons = [];
        
        objectTypes.forEach((type, index) => {
            const row = Math.floor(index / buttonsPerRow);
            const col = index % buttonsPerRow;
            const x = (col - 1) * (buttonWidth + 0.2);
            const y = 0.1 - row * (buttonHeight + 0.15);

            const buttonGeometry = new THREE.PlaneGeometry(buttonWidth, buttonHeight);
            const buttonMaterial = new THREE.MeshLambertMaterial({ 
                color: this.getObjectColor(type),
                transparent: true,
                opacity: 0.8
            });
            
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.position.set(x, y, 0.02);
            button.userData = { 
                type: 'menuButton', 
                objectType: type,
                originalColor: this.getObjectColor(type),
                originalOpacity: 0.8
            };
            
            this.menuButtons.push(button);
            menuGroup.add(button);
        });

        // Delete mode button
        const deleteButton = new THREE.Mesh(
            new THREE.PlaneGeometry(1.2, 0.3),
            new THREE.MeshLambertMaterial({ 
                color: 0xFF0000, 
                transparent: true, 
                opacity: 0.8 
            })
        );
        deleteButton.position.set(0, -0.6, 0.02);
        deleteButton.userData = { 
            type: 'deleteButton',
            originalColor: 0xFF0000,
            originalOpacity: 0.8
        };
        this.menuButtons.push(deleteButton);
        menuGroup.add(deleteButton);

        this.menu = menuGroup;
        this.scene.add(menuGroup);
    }

    getObjectColor(type) {
        const colors = {
            cube: 0xFF6B6B,
            sphere: 0x4ECDC4,
            cylinder: 0x45B7D1,
            cone: 0xF39C12,
            torus: 0x9B59B6,
            tetrahedron: 0x2ECC71
        };
        return colors[type] || 0xFFFFFF;
    }

    async setupVR() {
        // Only setup VR if WebXR is supported
        if (!this.webXRSupported) {
            console.log('WebXR not supported, using desktop fallback');
            return;
        }

        try {
            // Enable XR on renderer
            this.renderer.xr.enabled = true;

            // Create VR button only if VR sessions are supported
            if (this.vrSessionAvailable) {
                const vrButton = VRButton.createButton(this.renderer, {
                    onUnsupported: () => {
                        console.log('VR not supported');
                        this.showVRError('VR headset not detected or not supported');
                    }
                });
                document.body.appendChild(vrButton);
                console.log('VR button created and added to DOM');
            } else {
                console.log('VR sessions not available, no VR button created');
            }

            // Setup controllers
            await this.setupControllers();
            
        } catch (error) {
            console.error('VR setup failed:', error);
            this.showVRError('Failed to initialize VR: ' + error.message);
        }
    }

    async setupControllers() {
        if (!this.renderer.xr) return;

        try {
            // Controller 1
            const controller1 = this.renderer.xr.getController(0);
            controller1.addEventListener('selectstart', (e) => this.onSelectStart(e, 0));
            controller1.addEventListener('selectend', (e) => this.onSelectEnd(e, 0));
            controller1.addEventListener('connected', (e) => this.onControllerConnected(e, 0));
            controller1.addEventListener('disconnected', () => this.onControllerDisconnected(0));
            this.controllers.push(controller1);
            this.scene.add(controller1);

            // Controller 2
            const controller2 = this.renderer.xr.getController(1);
            controller2.addEventListener('selectstart', (e) => this.onSelectStart(e, 1));
            controller2.addEventListener('selectend', (e) => this.onSelectEnd(e, 1));
            controller2.addEventListener('connected', (e) => this.onControllerConnected(e, 1));
            controller2.addEventListener('disconnected', () => this.onControllerDisconnected(1));
            this.controllers.push(controller2);
            this.scene.add(controller2);

            // Add visual ray indicators
            this.controllers.forEach(controller => {
                const line = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(0, 0, -1)
                ]);
                const rayLine = new THREE.Line(line, new THREE.LineBasicMaterial({ 
                    color: 0x00FFFF,
                    linewidth: 2
                }));
                rayLine.scale.z = 2;
                controller.add(rayLine);
            });

            // Add controller grips for better visual feedback
            const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
            const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
            this.scene.add(controllerGrip1);
            this.scene.add(controllerGrip2);
            
        } catch (error) {
            console.warn('Controller setup failed:', error);
        }
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Main directional light
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        this.scene.add(directionalLight);

        // Fill light
        const pointLight = new THREE.PointLight(0xFFFFFF, 0.4, 100);
        pointLight.position.set(0, 3, 0);
        pointLight.castShadow = true;
        this.scene.add(pointLight);

        // Menu lighting
        const menuLight = new THREE.SpotLight(0xFFFFFF, 0.8);
        menuLight.position.set(0, 3, -2);
        menuLight.target = this.menu;
        menuLight.angle = Math.PI / 6;
        menuLight.penumbra = 0.1;
        this.scene.add(menuLight);
    }

    onControllerConnected(event, index) {
        console.log(`Controller ${index} connected:`, event.data);
        this.inputMethod = 'vr-controllers';
        this.updateUI();
        
        // Show VR instructions
        document.getElementById('desktop-instructions').classList.add('hidden');
        document.getElementById('vr-instructions').classList.remove('hidden');
    }

    onControllerDisconnected(index) {
        console.log(`Controller ${index} disconnected`);
        if (this.grabbedController === index) {
            this.onSelectEnd(null, index);
        }
    }

    onSelectStart(event, controllerIndex) {
        const controller = this.controllers[controllerIndex];
        if (!controller) return;

        const intersections = this.getIntersections(controller);
        if (intersections.length > 0) {
            const intersection = intersections[0];
            const object = intersection.object;
            this.handleObjectInteraction(object, controller, controllerIndex);
        }
    }

    onSelectEnd(event, controllerIndex) {
        if (this.grabbedController === controllerIndex) {
            this.releaseObject();
        }
    }

    getIntersections(controller) {
        const raycaster = new THREE.Raycaster();
        const tempMatrix = new THREE.Matrix4();
        
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

        const intersectableObjects = [
            ...this.objects,
            ...this.menuButtons
        ];

        return raycaster.intersectObjects(intersectableObjects);
    }

    handleMouseInteraction(event) {
        // Update mouse position
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // Update raycaster
        this.mouseRaycaster.setFromCamera(this.mouse, this.camera);

        // Find intersections
        const intersectableObjects = [
            ...this.objects,
            ...this.menuButtons
        ];

        const intersects = this.mouseRaycaster.intersectObjects(intersectableObjects);

        if (intersects.length > 0) {
            const object = intersects[0].object;
            this.handleObjectInteraction(object, null, null);
        }
    }

    handleObjectInteraction(object, controller, controllerIndex) {
        // Handle menu interactions
        if (object.userData.type === 'menuButton') {
            this.highlightButton(object);
            this.createObject(object.userData.objectType);
            return;
        }

        if (object.userData.type === 'deleteButton') {
            this.highlightButton(object);
            this.isDeleteMode = !this.isDeleteMode;
            this.updateDeleteMode();
            return;
        }

        // Handle object interactions
        if (this.isDeleteMode && object.userData.type === 'interactable') {
            this.deleteObject(object);
            return;
        }

        if (object.userData.type === 'interactable') {
            this.grabObject(object, controller, controllerIndex);
        }
    }

    highlightButton(button) {
        // Reset all buttons to original state
        this.menuButtons.forEach(btn => {
            btn.material.color.setHex(btn.userData.originalColor);
            btn.material.opacity = btn.userData.originalOpacity;
        });

        // Highlight clicked button
        button.material.color.setHex(0xFFFFFF);
        button.material.opacity = 1.0;

        // Reset highlight after short delay
        setTimeout(() => {
            button.material.color.setHex(button.userData.originalColor);
            button.material.opacity = button.userData.originalOpacity;
        }, 300);
    }

    createObject(type) {
        let geometry;
        const material = new THREE.MeshLambertMaterial({ 
            color: this.getObjectColor(type)
        });

        // Create geometry based on type
        switch (type) {
            case 'cube':
                geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                break;
            case 'sphere':
                geometry = new THREE.SphereGeometry(0.25, 16, 12);
                break;
            case 'cylinder':
                geometry = new THREE.CylinderGeometry(0.25, 0.25, 0.5, 16);
                break;
            case 'cone':
                geometry = new THREE.ConeGeometry(0.25, 0.5, 16);
                break;
            case 'torus':
                geometry = new THREE.TorusGeometry(0.25, 0.1, 8, 16);
                break;
            case 'tetrahedron':
                geometry = new THREE.TetrahedronGeometry(0.3);
                break;
            default:
                geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        }

        const object = new THREE.Mesh(geometry, material);
        
        // Random position on platform
        object.position.set(
            (Math.random() - 0.5) * 3,
            1 + Math.random() * 0.5,
            (Math.random() - 0.5) * 3
        );
        
        // Enable shadows
        object.castShadow = true;
        object.receiveShadow = true;
        
        // Set user data
        object.userData = { 
            type: 'interactable',
            objectType: type,
            id: Date.now(),
            created: new Date()
        };

        this.objects.push(object);
        this.scene.add(object);
        
        console.log(`Created ${type} object. Total objects: ${this.objects.length}`);
        this.updateUI();
    }

    deleteObject(object) {
        const index = this.objects.indexOf(object);
        if (index > -1) {
            this.objects.splice(index, 1);
            this.scene.remove(object);
            
            // Dispose of geometry and material to free memory
            object.geometry.dispose();
            object.material.dispose();
            
            console.log(`Deleted object. Total objects: ${this.objects.length}`);
            this.updateUI();
        }
    }

    grabObject(object, controller, controllerIndex) {
        this.grabbedObject = object;
        this.grabbedController = controllerIndex;
        
        if (controller) {
            // Calculate grab offset for VR
            const controllerPosition = new THREE.Vector3();
            controllerPosition.setFromMatrixPosition(controller.matrixWorld);
            this.grabOffset.copy(object.position).sub(controllerPosition);
        }
        
        // Store initial rotation
        this.grabRotationOffset.copy(object.quaternion);
        
        // Visual feedback
        object.material.emissive.setHex(0x444444);
        
        console.log('Object grabbed:', object.userData.objectType);
    }

    releaseObject() {
        if (this.grabbedObject) {
            this.grabbedObject.material.emissive.setHex(0x000000);
            console.log('Object released:', this.grabbedObject.userData.objectType);
            this.grabbedObject = null;
            this.grabbedController = null;
        }
    }

    updateGrabbedObject() {
        if (this.grabbedObject && this.grabbedController !== null && this.controllers[this.grabbedController]) {
            const controller = this.controllers[this.grabbedController];
            
            // Update position
            const controllerPosition = new THREE.Vector3();
            controllerPosition.setFromMatrixPosition(controller.matrixWorld);
            this.grabbedObject.position.copy(controllerPosition).add(this.grabOffset);
            
            // Update rotation based on controller rotation
            const controllerQuaternion = new THREE.Quaternion();
            controllerQuaternion.setFromRotationMatrix(controller.matrixWorld);
            this.grabbedObject.quaternion.copy(controllerQuaternion);
            
            // Keep object above ground
            if (this.grabbedObject.position.y < 0.25) {
                this.grabbedObject.position.y = 0.25;
            }
        }
    }

    updateDeleteMode() {
        const deleteButton = this.menuButtons.find(btn => 
            btn.userData.type === 'deleteButton'
        );
        
        if (deleteButton) {
            const newColor = this.isDeleteMode ? 0x00FF00 : 0xFF0000;
            deleteButton.material.color.setHex(newColor);
            deleteButton.userData.originalColor = newColor;
        }

        // Update desktop button
        const toggleDeleteBtn = document.getElementById('toggle-delete');
        if (toggleDeleteBtn) {
            if (this.isDeleteMode) {
                toggleDeleteBtn.textContent = '🗑️ Delete Mode: ON';
                toggleDeleteBtn.classList.add('delete-active');
            } else {
                toggleDeleteBtn.textContent = '🗑️ Delete Mode: OFF';
                toggleDeleteBtn.classList.remove('delete-active');
            }
        }
        
        console.log(`Delete mode: ${this.isDeleteMode ? 'ON' : 'OFF'}`);
        this.updateUI();
    }

    updateUI() {
        const count = this.objects.length;
        
        // Update object counts
        document.getElementById('object-count').textContent = `Objects: ${count}`;
        const vrCount = document.getElementById('vr-object-count');
        if (vrCount) vrCount.textContent = `Objects: ${count}`;
        
        // Update input method
        document.getElementById('input-method').textContent = `Input: ${this.inputMethod}`;
        document.getElementById('input-method').className = 
            `status ${this.inputMethod.includes('vr') ? 'status--success' : 'status--info'}`;
        
        // Update VR mode indicator
        const mode = this.isDeleteMode ? 'Delete' : 'Create';
        const vrMode = document.getElementById('vr-mode-indicator');
        if (vrMode) vrMode.textContent = `Mode: ${mode}`;
    }

    showVRError(message) {
        console.error('VR Error:', message);
        // Could add UI notification here
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Mouse interaction for desktop
        this.renderer.domElement.addEventListener('click', (e) => this.handleMouseInteraction(e));

        // Desktop creation buttons
        const createButtons = document.querySelectorAll('.create-btn');
        createButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                if (type) {
                    this.createObject(type);
                    console.log(`Desktop button clicked: ${type}`);
                }
            });
        });

        // Delete toggle button
        const deleteToggle = document.getElementById('toggle-delete');
        if (deleteToggle) {
            deleteToggle.addEventListener('click', () => {
                this.isDeleteMode = !this.isDeleteMode;
                this.updateDeleteMode();
            });
        }

        // Close buttons for dialogs
        const closeError = document.getElementById('close-error');
        if (closeError) {
            closeError.addEventListener('click', () => {
                document.getElementById('error-panel').classList.add('hidden');
            });
        }

        const closeTroubleshoot = document.getElementById('close-troubleshoot');
        if (closeTroubleshoot) {
            closeTroubleshoot.addEventListener('click', () => {
                document.getElementById('troubleshooting').classList.add('hidden');
            });
        }

        // VR session events
        if (this.renderer.xr) {
            this.renderer.xr.addEventListener('sessionstart', () => {
                console.log('VR session started');
                document.body.classList.add('vr-mode');
                document.getElementById('vr-overlay').classList.remove('hidden');
                this.inputMethod = 'vr-session';
                this.updateUI();
            });

            this.renderer.xr.addEventListener('sessionend', () => {
                console.log('VR session ended');
                document.body.classList.remove('vr-mode');
                document.getElementById('vr-overlay').classList.add('hidden');
                this.inputMethod = 'desktop';
                this.updateUI();
                
                // Show desktop instructions again
                document.getElementById('vr-instructions').classList.add('hidden');
                document.getElementById('desktop-instructions').classList.remove('hidden');
            });
        }

        // Retry WebXR button
        const retryButton = document.getElementById('retry-webxr');
        if (retryButton) {
            retryButton.addEventListener('click', async () => {
                console.log('Retrying WebXR detection...');
                retryButton.disabled = true;
                retryButton.textContent = '🔄 Checking...';
                
                try {
                    await this.checkWebXRCompatibility();
                    this.updateCompatibilityUI();
                    await this.setupVR();
                    console.log('WebXR retry completed');
                } catch (error) {
                    console.error('WebXR retry failed:', error);
                }
                
                setTimeout(() => {
                    retryButton.disabled = false;
                    retryButton.textContent = '🔄 Retry WebXR Detection';
                }, 2000);
            });
        }

        // Keyboard controls for desktop
        document.addEventListener('keydown', (event) => this.onKeyDown(event));
    }

    onKeyDown(event) {
        if (this.inputMethod.includes('vr')) return; // Skip keyboard in VR mode
        
        switch (event.code) {
            case 'KeyC':
                this.createObject('cube');
                break;
            case 'KeyS':
                this.createObject('sphere');
                break;
            case 'KeyT':
                this.createObject('torus');
                break;
            case 'KeyD':
                this.isDeleteMode = !this.isDeleteMode;
                this.updateDeleteMode();
                break;
            case 'Escape':
                if (this.grabbedObject) {
                    this.releaseObject();
                }
                break;
        }
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        this.renderer.setAnimationLoop(() => {
            // Update controls (desktop mode)
            if (this.controls && !this.renderer.xr.isPresenting) {
                this.controls.update();
            }
            
            // Update grabbed object
            this.updateGrabbedObject();
            
            // Render
            this.renderer.render(this.scene, this.camera);
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing VR Object Creator...');
    try {
        new VRObjectCreator();
    } catch (error) {
        console.error('Failed to initialize VR Object Creator:', error);
        
        // Show error in UI
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.innerHTML = `
                <div class="loading-content">
                    <div style="color: var(--color-error); font-size: var(--font-size-xl); margin-bottom: var(--space-16);">
                        ❌ Application Failed to Load
                    </div>
                    <div style="font-size: var(--font-size-md); margin-bottom: var(--space-16);">
                        ${error.message}
                    </div>
                    <button onclick="location.reload()" class="btn btn--primary">
                        🔄 Reload Page
                    </button>
                </div>
            `;
        }
    }
});

// Handle page visibility changes for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden - reducing performance');
    } else {
        console.log('Page visible - resuming full performance');
    }
});