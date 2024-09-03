let scene, camera, renderer, model, controls;
let transitionPlane;

function init() {
    // Create scene
    scene = new THREE.Scene();

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87CEEB); // Set a default sky blue color
    renderer.shadowMap.enabled = true;  // Enable shadow mapping
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;  // Use soft shadows
    document.getElementById('model-container').appendChild(renderer.domElement);

    // Add gradient sky background
    addSkyGradient();

    // Add ground
    addGround();

    // Add lighting
    addLighting();

    // Initialize controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.minPolarAngle = Math.PI / 6;
    controls.maxPolarAngle = Math.PI / 2.2;

    // Create transition plane
    createTransitionPlane();

    // Load initial 3D model
    loadNewModel('static/resources/realistic_hd_blue_jacaranda_940.glb');

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function createTransitionPlane() {
    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x000000, 
        transparent: true, 
        opacity: 0 
    });
    transitionPlane = new THREE.Mesh(planeGeometry, planeMaterial);
    transitionPlane.position.z = camera.position.z - 1;
    transitionPlane.renderOrder = 999;
    scene.add(transitionPlane);
}

function addSkyGradient() {
    const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }`;

    const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    varying vec3 vWorldPosition;
    void main() {
        float h = normalize( vWorldPosition + offset ).y;
        gl_FragColor = vec4( mix( bottomColor, topColor, max( h, 0.0 ) ), 1.0 );
    }`;

    const uniforms = {
        topColor: { value: new THREE.Color(0x0077FF) },
        bottomColor: { value: new THREE.Color(0xFFFFFF) },
        offset: { value: 33 }
    };

    const skyGeo = new THREE.SphereGeometry(400, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);
}

function addGround() {
    const textureLoader = new THREE.TextureLoader();
  
    // Load a single, large ground texture
    const groundTexture = textureLoader.load('static/resources/grass4.jpg', (texture) => {
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(70, 70);  // Adjust based on your texture size and desired coverage
      
        // Enable anisotropy for sharper details at angles
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    });

    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshStandardMaterial({
        map: groundTexture,
        roughness: 0.9,
        metalness: 1
    });

    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0.5;
    groundMesh.receiveShadow = true;  // Allow the ground to receive shadows

    // Apply a slight random rotation to break up repeating patterns
    groundMesh.rotation.z = Math.random() * Math.PI * 3;

    scene.add(groundMesh);

    // Add some noise to the ground to break up uniformity
    addNoiseToGround(groundMesh);
}

function addNoiseToGround(groundMesh) {
    const vertices = groundMesh.geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 2] += Math.random() * 0.3 - 0.15;  // Add slight height variation
    }
    groundMesh.geometry.attributes.position.needsUpdate = true;
    groundMesh.geometry.computeVertexNormals();
}

function addLighting() {
    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1);
    scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xFFFFFF, 3);
    sunLight.position.set(0, 5, 10);  // Adjust these values to change sun position
    sunLight.castShadow = true;  // Enable shadow casting

    // Improve shadow quality
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;

    // Adjust the orthographic camera for the shadows
    const d = 30;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;

    scene.add(sunLight);

    // Optional: Add a subtle hemisphere light for more natural lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.2);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 50, 0);
    scene.add(hemiLight);
}

function fadeIn(duration) {
    return new Promise((resolve) => {
        const startOpacity = transitionPlane.material.opacity;
        const startTime = performance.now();

        function animate() {
            const now = performance.now();
            const progress = Math.min((now - startTime) / duration, 1);
            transitionPlane.material.opacity = startOpacity + progress * (1 - startOpacity);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }

        animate();
    });
}

function fadeOut(duration) {
    return new Promise((resolve) => {
        const startOpacity = transitionPlane.material.opacity;
        const startTime = performance.now();

        function animate() {
            const now = performance.now();
            const progress = Math.min((now - startTime) / duration, 1);
            transitionPlane.material.opacity = startOpacity * (1 - progress);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }

        animate();
    });
}

async function loadNewModel(modelPath) {
    await fadeIn(300);  // Fade to black over 500ms

    // Remove the existing model from the scene
    if (model) {
        scene.remove(model);
    }

    // Store the current camera position and rotation
    const currentCameraPosition = camera.position.clone();
    const currentCameraRotation = camera.rotation.clone();

    // Load the new model
    return new Promise((resolve, reject) => {
        const loader = new THREE.GLTFLoader();
        loader.load(
            modelPath,
            function (gltf) {
                model = gltf.scene;
                scene.add(model);
                
                // Enable shadow casting for the tree
                model.traverse((node) => {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });

                // Analyze the model's dimensions
                const box = new THREE.Box3().setFromObject(model);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());

                // Position the model to appear planted
                model.position.y = size.y * 0.05; // Slightly raise the model
                model.position.x = -center.x;
                model.position.z = -center.z;

                // Update controls target
                const maxDim = Math.max(size.x, size.z);
                controls.minDistance = maxDim * 0.8;
                controls.maxDistance = maxDim * 2;
                controls.target.set(0, size.y * 0.4, 0);

                // Restore the camera position and rotation
                camera.position.copy(currentCameraPosition);
                camera.rotation.copy(currentCameraRotation);

                // Update controls
                controls.update();

                fadeOut(300).then(resolve);  // Fade back in over 500ms
            },
            function (xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            function (error) {
                console.error('An error happened', error);
                reject(error);
            }
        );
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) {
        controls.update();
    }
    renderer.render(scene, camera);
}

// Initialize the scene
init();

// Start animation loop
animate();

function showThinkingMessage() {
    document.getElementById('chatgpt-output').value = "Thinking of a recommendation...";
}
// Add event listener for the simulate button
document.getElementById('simulate').addEventListener('click', async function() {
    console.log('Button clicked');

    const temperature = parseFloat(document.getElementById('input1').value);
    const humidity = parseFloat(document.getElementById('input2').value);
    const lightIntensity = parseFloat(document.getElementById('input3').value);
    const co2Level = parseFloat(document.getElementById('input4').value);

    const data = {
        temperature: temperature,
        humidity: humidity,
        light_intensity: lightIntensity,
        co2_level: co2Level
    };

    console.log('Sending data to server for prediction:', data);

    try {
        // First, get the prediction
        const predictionResponse = await fetch('http://127.0.0.1:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!predictionResponse.ok) {
            throw new Error(`HTTP error! status: ${predictionResponse.status}`);
        }

        const predictionResult = await predictionResponse.json();
        console.log('Received prediction from server:', predictionResult);
        
        // Update prediction result
        document.getElementById('prediction-result').textContent = `Prediction: ${predictionResult.prediction}`;
        
        // Change the 3D model based on the prediction
        if (predictionResult.prediction === 'Unsustainable') {
            await loadNewModel('static/resources/realistic_hd_blue_jacaranda_4040.glb');
        } else if (predictionResult.prediction === 'Moderate') {
            await loadNewModel('static/resources/realistic_hd_blue_jacaranda_2840.glb');
        } else {
            // If 'Sustainable', load the healthy model
            await loadNewModel('static/resources/realistic_hd_blue_jacaranda_940.glb');
        }

        // Show thinking message while waiting for recommendation
        showThinkingMessage();

        // Now, get the recommendation
        const recommendationResponse = await fetch('http://127.0.0.1:5000/recommend', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({...data, prediction: predictionResult.prediction}),
        });

        if (!recommendationResponse.ok) {
            throw new Error(`HTTP error! status: ${recommendationResponse.status}`);
        }

        const recommendationResult = await recommendationResponse.json();
        
        // Display ChatGPT recommendation or error
        if (recommendationResult.recommendation) {
            document.getElementById('chatgpt-output').value = `Recommendation: ${recommendationResult.recommendation}`;
        } else if (recommendationResult.error) {
            document.getElementById('chatgpt-output').value = `Error: ${recommendationResult.error}`;
        } else {
            document.getElementById('chatgpt-output').value = 'No recommendation available.';
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('chatgpt-output').value = `An error occurred: ${error.message}`;
    }
});