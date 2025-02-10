import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Three.js Scene Setup
let scene, camera, renderer, particles;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let scrollProgress = 0;
let isMobile = window.innerWidth <= 768;

// Initialize Three.js scene
function init() {
    try {
        // Scene setup
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        document.getElementById('canvas-container').appendChild(renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        // Load image and create texture
        const loader = new THREE.TextureLoader();
        loader.load('images/eye.jpg', 
            // onLoad callback
            function(texture) {
                createParticles(texture);
            },
            // onProgress callback
            undefined,
            // onError callback
            function(err) {
                console.error('Error loading texture:', err);
            }
        );

        // Position camera
        camera.position.z = 5;

        // Event Listeners
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('scroll', onScroll);
        window.addEventListener('resize', onWindowResize);
        
        // Device orientation for mobile
        if (isMobile && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', onDeviceOrientation);
        }
    } catch (error) {
        console.error('Error in init:', error);
    }
}

function createParticles(texture) {
    try {
        // Create particle geometry
        const width = isMobile ? 50 : 100;
        const height = isMobile ? 50 : 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(width * height * 3);
        const uvs = new Float32Array(width * height * 2);

        for (let i = 0; i < width * height; i++) {
            const x = (i % width) / width;
            const y = Math.floor(i / width) / height;
            
            // Positions
            positions[i * 3] = x * 2 - 1;
            positions[i * 3 + 1] = y * 2 - 1;
            positions[i * 3 + 2] = 0;
            
            // UVs
            uvs[i * 2] = x;
            uvs[i * 2 + 1] = y;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        // Create custom shader material
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: texture },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uSnapStrength: { value: isMobile ? 0.05 : 0.1 }
            },
            vertexShader: `
                uniform vec2 uMouse;
                uniform float uTime;
                uniform vec2 uResolution;
                uniform float uSnapStrength;
                varying vec2 vUv;

                void main() {
                    vUv = uv;
                    vec3 pos = position;

                    // Displace vertices based on mouse position
                    float dist = distance(uv, uMouse);
                    float proximity = 1.0 - smoothstep(0.0, 0.5, dist);
                    float distThreshold = ${isMobile ? '0.3' : '0.2'};
                    float distortion = sin(dist * 10.0 - uTime * 0.5) * 0.1 * smoothstep(distThreshold, 0.0, dist);
                    pos.z += distortion * proximity;

                    // Snap back to original position when mouse is far
                    pos.z += (1.0 - proximity) * uSnapStrength;

                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    gl_PointSize = ${isMobile ? '2.0' : '3.0'};
                }
            `,
            fragmentShader: `
                uniform sampler2D uTexture;
                varying vec2 vUv;

                void main() {
                    vec4 texel = texture2D(uTexture, vUv);
                    gl_FragColor = texel;
                }
            `,
            transparent: true,
            depthWrite: false,
            depthTest: true
        });

        // Create particle mesh
        particles = new THREE.Points(geometry, material);
        scene.add(particles);

    } catch (error) {
        console.error('Error in createParticles:', error);
    }
}

function onMouseMove(event) {
    if (isMobile) return;
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onTouchMove(event) {
    event.preventDefault();
    const touch = event.touches[0];
    mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
}

function onDeviceOrientation(event) {
    if (event.beta && event.gamma) {
        mouseX = Math.min(Math.max(event.gamma / 45, -1), 1);
        mouseY = Math.min(Math.max(event.beta / 45, -1), 1);
    }
}

function onScroll() {
    const scrollMax = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = window.scrollY / scrollMax;
}

function onWindowResize() {
    isMobile = window.innerWidth <= 768;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (particles) {
        particles.material.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
}

function animate(time) {
    requestAnimationFrame(animate);

    if (particles && particles.material.uniforms) {
        // Update shader uniforms
        particles.material.uniforms.uTime.value = time * 0.001;
        particles.material.uniforms.uMouse.value.set((mouseX + 1) / 2, (mouseY + 1) / 2);
        particles.material.uniforms.uSnapStrength.value = isMobile ? 0.05 : 0.1;
    }

    renderer.render(scene, camera);
}

// Menu functionality
function initializeMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const menu = document.getElementById('menu');

    if (!menuBtn || !menu) {
        console.error('Menu elements not found');
        return;
    }

    const spans = menuBtn.getElementsByTagName('span');

    // Add transition styles to spans
    Array.from(spans).forEach(span => {
        span.style.transition = 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out';
    });

    menuBtn.addEventListener('click', function() {
        menu.classList.toggle('active');
        this.classList.toggle('active');
        
        if (menu.classList.contains('active')) {
            // Animate to X
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.id = 'menu-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(0, 0, 0, 0.5)';
            overlay.style.zIndex = '998';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(overlay);
            
            // Trigger overlay fade in
            setTimeout(() => overlay.style.opacity = '1', 0);
            
            // Close menu when clicking overlay
            overlay.addEventListener('click', function() {
                menu.classList.remove('active');
                menuBtn.classList.remove('active');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            });
        } else {
            // Reset to hamburger
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
            
            // Remove overlay
            const overlay = document.getElementById('menu-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        }
    });

    // Close menu when clicking menu items
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menu.classList.remove('active');
            menuBtn.classList.remove('active');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
            
            const overlay = document.getElementById('menu-overlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        });
    });
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
        // Close menu after clicking
        document.getElementById('menu').classList.remove('active');
    });
});

// Wait for DOM to be fully loaded before initializing
function initializeApp() {
    try {
        initializeMenu();
        init(); // Initialize Three.js scene
        animate();
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
}

// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp);
