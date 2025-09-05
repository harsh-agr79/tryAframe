// VR Object Creator Application
class VRObjectCreator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controllers = [];
        this.hands = [];
        this.raycasters = [];
        this.objects = [];
        this.menu = null;
        this.selectedObject = null;
        this.isDeleteMode = false;
        this.objectCount = 0;
        this.inputMethod = 'mouse';
        
        // Room and platform references
        this.room = null;
        this.platform = null;
        this.tables = [];
        
        // Interaction state
        this.grabbedObject = null;
        this.grabbedController = null;
        this.grabOffset = new THREE.Vector3();
        this.grabRotationOffset = new THREE.Quaternion();
        
        // Mouse interaction
        this.mouse = new THREE.Vector2();
        this.mouseRaycaster = new THREE.Raycaster();
        this.controls = null;
        
        this.init();
    }

    init() {
        this.createScene();
        this.createRoom();
        this.createPlatform();
        this.createTables();
        this.createMenu();
        this.setupVR();
        this.setupLights();
        this.setupEventListeners();
        this.animate();
        this.updateUI();
    }

    createScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x404040);

        // Camera
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 1.6, 3);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // Add orbit controls for desktop testing
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 1.6, 0);
        this.controls.update();
    }

    createRoom() {
        const roomGroup = new THREE.Group();
        
        // Room dimensions from data
        const width = 10, height = 4, depth = 10;
        
        // Materials
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const ceilingMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(width, depth);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        roomGroup.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(floorGeometry, ceilingMaterial);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = height;
        roomGroup.add(ceiling);

        // Walls
        const wallGeometry = new THREE.PlaneGeometry(width, height);
        
        // Back wall
        const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
        backWall.position.set(0, height / 2, -depth / 2);
        roomGroup.add(backWall);

        // Front wall
        const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
        frontWall.position.set(0, height / 2, depth / 2);
        frontWall.rotation.y = Math.PI;
        roomGroup.add(frontWall);

        // Left wall
        const leftWallGeometry = new THREE.PlaneGeometry(depth, height);
        const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        leftWall.position.set(-width / 2, height / 2, 0);
        leftWall.rotation.y = Math.PI / 2;
        roomGroup.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
        rightWall.position.set(width / 2, height / 2, 0);
        rightWall.rotation.y = -Math.PI / 2;
        roomGroup.add(rightWall);

        this.room = roomGroup;
        this.scene.add(roomGroup);
    }

    createPlatform() {
        const platformGeometry = new THREE.BoxGeometry(4, 0.2, 4);
        const platformMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
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
                const leg = new THREE.Mesh(legGeometry, legMaterial);
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
            new THREE.PlaneGeometry(4, 1.5),
            new THREE.MeshLambertMaterial({ color: 0x333333, transparent: true, opacity: 0.8 })
        );
        menuGroup.add(menuBg);

        // Menu title
        const titleGeometry = new THREE.PlaneGeometry(2, 0.3);
        const titleMaterial = new THREE.MeshLambertMaterial({ color: 0x00FFFF });
        const title = new THREE.Mesh(titleGeometry, titleMaterial);
        title.position.set(0, 0.5, 0.01);
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
            const y = 0.1 - row * (buttonHeight + 0.1);

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
            new THREE.PlaneGeometry(1, 0.3),
            new THREE.MeshLambertMaterial({ color: 0xFF0000, transparent: true, opacity: 0.8 })
        );
        deleteButton.position.set(0, -0.5, 0.02);
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

    setupVR() {
        // Check WebXR support
        if ('xr' in navigator) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    const vrButton = THREE.VRButton.createButton(this.renderer);
                    document.body.appendChild(vrButton);
                    document.getElementById('xr-status').textContent = 'XR Ready: Supported';
                    document.getElementById('xr-status').className = 'status status--success';
                    this.inputMethod = 'vr-ready';
                } else {
                    document.getElementById('xr-status').textContent = 'XR Ready: VR Not Supported';
                    document.getElementById('xr-status').className = 'status status--warning';
                }
            }).catch(() => {
                document.getElementById('xr-status').textContent = 'XR Ready: Check Failed';
                document.getElementById('xr-status').className = 'status status--error';
            });
        } else {
            document.getElementById('xr-status').textContent = 'XR Ready: Not Available';
            document.getElementById('xr-status').className = 'status status--error';
        }

        // Setup controllers
        this.setupControllers();
        this.setupHandTracking();
    }

    setupControllers() {
        // Controller 1
        const controller1 = this.renderer.xr.getController(0);
        controller1.addEventListener('selectstart', (event) => this.onSelectStart(event, 0));
        controller1.addEventListener('selectend', (event) => this.onSelectEnd(event, 0));
        controller1.addEventListener('connected', (event) => this.onControllerConnected(event, 0));
        controller1.addEventListener('disconnected', () => this.onControllerDisconnected(0));
        this.controllers.push(controller1);

        // Controller 2
        const controller2 = this.renderer.xr.getController(1);
        controller2.addEventListener('selectstart', (event) => this.onSelectStart(event, 1));
        controller2.addEventListener('selectend', (event) => this.onSelectEnd(event, 1));
        controller2.addEventListener('connected', (event) => this.onControllerConnected(event, 1));
        controller2.addEventListener('disconnected', () => this.onControllerDisconnected(1));
        this.controllers.push(controller2);

        // Add controllers to scene
        this.controllers.forEach(controller => {
            this.scene.add(controller);
            
            // Add raycaster line
            const line = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(0, 0, -1)
            ]);
            const rayLine = new THREE.Line(line, new THREE.LineBasicMaterial({ color: 0x00FFFF }));
            rayLine.scale.z = 0.5;
            controller.add(rayLine);
        });

        // Add controller grips
        const controllerGrip1 = this.renderer.xr.getControllerGrip(0);
        const controllerGrip2 = this.renderer.xr.getControllerGrip(1);
        this.scene.add(controllerGrip1);
        this.scene.add(controllerGrip2);
    }

    setupHandTracking() {
        // Hand tracking setup would go here
        // This is more complex and requires additional libraries
        // For now, we'll focus on controller support
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        this.scene.add(directionalLight);

        // Point light for better object visibility
        const pointLight = new THREE.PointLight(0xFFFFFF, 0.5, 100);
        pointLight.position.set(0, 3, 0);
        this.scene.add(pointLight);
    }

    onControllerConnected(event, index) {
        console.log(`Controller ${index} connected:`, event.data.gamepad);
        this.inputMethod = 'controllers';
        this.updateUI();
    }

    onControllerDisconnected(index) {
        console.log(`Controller ${index} disconnected`);
        if (this.grabbedController === index) {
            this.onSelectEnd(null, index);
        }
    }

    onSelectStart(event, controllerIndex) {
        const controller = this.controllers[controllerIndex];
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
        }, 200);
    }

    createObject(type) {
        let geometry;
        const material = new THREE.MeshLambertMaterial({ 
            color: this.getObjectColor(type)
        });

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
        object.position.set(
            (Math.random() - 0.5) * 3,
            1 + Math.random() * 0.5,
            (Math.random() - 0.5) * 3
        );
        object.castShadow = true;
        object.receiveShadow = true;
        object.userData = { 
            type: 'interactable',
            objectType: type,
            id: this.objects.length
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
            console.log(`Deleted object. Total objects: ${this.objects.length}`);
            this.updateUI();
        }
    }

    grabObject(object, controller, controllerIndex) {
        this.grabbedObject = object;
        this.grabbedController = controllerIndex;
        
        if (controller) {
            // Calculate grab offset
            const controllerPosition = new THREE.Vector3();
            controllerPosition.setFromMatrixPosition(controller.matrixWorld);
            this.grabOffset.copy(object.position).sub(controllerPosition);
        }
        
        // Store initial rotation
        this.grabRotationOffset.copy(object.quaternion);
        
        // Visual feedback
        object.material.emissive.setHex(0x444444);
    }

    releaseObject() {
        if (this.grabbedObject) {
            this.grabbedObject.material.emissive.setHex(0x000000);
            this.grabbedObject = null;
            this.grabbedController = null;
        }
    }

    updateDeleteMode() {
        const deleteButton = this.menuButtons.find(btn => 
            btn.userData.type === 'deleteButton'
        );
        
        if (deleteButton) {
            deleteButton.material.color.setHex(this.isDeleteMode ? 0x00FF00 : 0xFF0000);
            deleteButton.userData.originalColor = this.isDeleteMode ? 0x00FF00 : 0xFF0000;
        }
        
        console.log(`Delete mode: ${this.isDeleteMode ? 'ON' : 'OFF'}`);
        this.updateUI();
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

    updateUI() {
        // Update object count
        const count = this.objects.length;
        document.getElementById('object-count').textContent = `Objects: ${count}`;
        document.getElementById('vr-object-count').textContent = `Objects: ${count}`;
        
        // Update input method
        document.getElementById('input-method').textContent = `Input: ${this.inputMethod}`;
        
        // Update VR mode indicator
        const mode = this.isDeleteMode ? 'Delete' : 'Create';
        document.getElementById('vr-mode').textContent = `Mode: ${mode}`;
    }

    showError(message) {
        document.getElementById('error-text').textContent = message;
        document.getElementById('error-message').classList.remove('hidden');
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Mouse interaction for desktop testing
        this.renderer.domElement.addEventListener('click', this.handleMouseInteraction.bind(this));

        // VR session events
        this.renderer.xr.addEventListener('sessionstart', () => {
            document.body.classList.add('vr-mode');
            document.getElementById('vr-overlay').classList.remove('hidden');
            this.inputMethod = 'vr-controllers';
            this.updateUI();
        });

        this.renderer.xr.addEventListener('sessionend', () => {
            document.body.classList.remove('vr-mode');
            document.getElementById('vr-overlay').classList.add('hidden');
            this.inputMethod = 'mouse';
            this.updateUI();
        });
    }

    animate() {
        this.renderer.setAnimationLoop(() => {
            this.updateGrabbedObject();
            this.renderer.render(this.scene, this.camera);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new VRObjectCreator();
});

// Handle page visibility for performance
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause or reduce performance when tab is hidden
    } else {
        // Resume full performance when tab is visible
    }
});