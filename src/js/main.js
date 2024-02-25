// Importing required modules from Three.js and lil-gui
import {
  AmbientLight,
  ArrowHelper,
  BoxGeometry,
  BufferAttribute,
  Clock,
  CubeTextureLoader,
  Mesh,
  MeshNormalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Scene,
  SphereGeometry,
  TextureLoader,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { GUI } from 'lil-gui';

/**
 * CANVAS & SIZES
 */
const canvas = document.querySelector('canvas.webgl');
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

/**
 * SCENE SETUP
 */
const scene = new Scene();
const origin = new Vector3(0, 0, 0);
const arrowLength = 2.2;

// Function to create arrows for coordinate axes
const createArrow = (direction, color) => {
  const arrow = new ArrowHelper(direction.normalize(), origin, arrowLength, color);
  arrow.visible = false;
  scene.add(arrow);
};

// Define unit vectors for each coordinate axis
const xAxis = new Vector3(1, 0, 0);
const yAxis = new Vector3(0, 1, 0);
const zAxis = new Vector3(0, 0, 1);

// Create arrows for each coordinate axis
createArrow(xAxis, 0xee4266);
createArrow(yAxis, 0xbfea7c);
createArrow(zAxis, 0x40a2e3);

/**
 * TEXTURES
 */
const textureLoader = new TextureLoader();
const cubeTextureLoader = new CubeTextureLoader();

// Load environment map and text texture
const environmentMap = cubeTextureLoader.load([
  '/textures/environmentMaps/0/px.jpg',
  '/textures/environmentMaps/0/nx.jpg',
  '/textures/environmentMaps/0/py.jpg',
  '/textures/environmentMaps/0/ny.jpg',
  '/textures/environmentMaps/0/pz.jpg',
  '/textures/environmentMaps/0/nz.jpg',
]);
const textTexture = textureLoader.load('/textures/matcaps/3.png');

/**
 * LIGHTS
 */
const ambientLight = new AmbientLight(0xffffff, 0.5);
const pointLight = new PointLight(0xffffff, 40);
pointLight.position.set(2, 3, 4);
scene.add(ambientLight, pointLight);

/**
 * FONTS & GEOMETRIES
 */
const rotationConfig = {
  cube: { enabled: true, speed: 1 },
  donut: { enabled: true, speed: 0.5 },
  text: { enabled: true, speed: 0.5 },
};

const textOptions = {
  metalness: 1,
  roughness: 0,
};

// Function to create materials with specified properties
const createMaterial = (standard = false) => {
  const material = standard ? new MeshStandardMaterial() : new MeshNormalMaterial();
  material.metalness = textOptions.metalness;
  material.roughness = textOptions.roughness;
  if (standard) material.envMap = environmentMap;
  return material;
};

// Function to create multiple random meshes with specified properties
const createRandomMeshes = (name, geometry, material, threshold) => {
  for (let i = 0; i < threshold; i++) {
    const mesh = new Mesh(geometry, material);
    let scale = Math.min(Math.random(), 0.6);

    mesh.name = name;
    mesh.scale.set(scale, scale, scale);

    // Randomize position and rotation of the meshes
    mesh.position.set(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    scene.add(mesh);
  }
};

// Create materials for text and standard meshes
const textMaterial = createMaterial(true);
const standardMaterial = createMaterial();

// Define geometries for torus, sphere, and box
const torusGeometry = new TorusGeometry(0.3, 0.2, 20, 45);
const sphereGeometry = new SphereGeometry(0.5, 16, 16);
const boxGeometry = new BoxGeometry(0.5, 0.5, 0.5);

// Load font for text geometry
const fontLoader = new FontLoader();
fontLoader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
  // Create text geometry with specified parameters
  const textGeometry = new TextGeometry('HoneyBear', {
    font,
    size: 0.5,
    height: 0.2,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 4,
  });
  textGeometry.center();
  textGeometry.setAttribute('uv2', new BufferAttribute(textGeometry.attributes.uv.array, 2));

  // Create text mesh and add to the scene
  const textMesh = new Mesh(textGeometry, textMaterial);
  textMesh.name = 'text';
  scene.add(textMesh);

  // Create random meshes for donuts, spheres, and cubes
  createRandomMeshes('donut', torusGeometry, standardMaterial, 100);
  createRandomMeshes('sphere', sphereGeometry, standardMaterial, 100);
  createRandomMeshes('cube', boxGeometry, standardMaterial, 100);
});

/**
 * CAMERA & CONTROLS
 */
const camera = new PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
camera.position.z = 3;
scene.add(camera);

// Initialize OrbitControls for camera movement
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;

/**
 * RENDERER
 */
const renderer = new WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * TICK (ANIMATION LOOP)
 */
const clock = new Clock();

// Function to rotate an object based on axis and speed
const rotateObject = (object, axis) => {
  if (rotationConfig[axis].enabled) {
    object.rotation.x =
      (axis === 'text' ? Math.sin : (value) => -value)(
        clock.getElapsedTime() * rotationConfig[axis].speed
      ) * rotationConfig[axis].speed;
    object.rotation.y =
      (axis === 'text' ? Math.sin : (value) => -value)(
        clock.getElapsedTime() * rotationConfig[axis].speed
      ) * rotationConfig[axis].speed;
  } else {
    object.rotation.x = 0;
    object.rotation.y = 0;
  }
};

// Function to update rotation for all objects in the scene
const updateRotation = () => {
  scene.traverse((object) => {
    if (object.name === 'cube') rotateObject(object, 'cube');
    if (object.name === 'donut') rotateObject(object, 'donut');
    if (object.name === 'text') {
      object.material.metalness = textOptions.metalness;
      object.material.roughness = textOptions.roughness;
      rotateObject(object, 'text');
    }
  });
};

// Animation loop
const animate = () => {
  updateRotation();
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

/**
 * WINDOW EVENT LISTENERS
 */
// Event listener for window resize
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(sizes.width, sizes.height);
});

// Event listener for fullscreen toggle on 'f' key press
window.addEventListener('keydown', (event) => {
  if (event.key === 'f') {
    if (!document.fullscreenElement) {
      canvas.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }
});

/**
 * DEBUG UI SETUP
 */
const debugParameters = {
  toggleGizmo() {
    // Toggle visibility of coordinate arrows
    scene.traverse((object) => {
      if (object instanceof ArrowHelper) object.visible = !object.visible;
    });
  },
  addMoreDonuts() {
    // Add 100 more donuts to the scene
    createRandomMeshes('donut', torusGeometry, standardMaterial, 100);
  },
  addMoreCubes() {
    // Add 100 more cubes to the scene
    createRandomMeshes('cube', boxGeometry, standardMaterial, 100);
  },
  addMoreSpheres() {
    // Add 100 more spheres to the scene
    createRandomMeshes('sphere', sphereGeometry, standardMaterial, 100);
  },
};

// Initialize GUI for debugging and parameter adjustment
const gui = new GUI({ name: 'Controls' });

// Add GUI controls for rotation animation and speed adjustments
gui.add(rotationConfig.text, 'enabled').name('Animate Text');
gui.add(rotationConfig.cube, 'enabled').name('Animate Cubes');
gui.add(rotationConfig.donut, 'enabled').name('Animate Donuts');
gui.add(rotationConfig.text, 'speed').name('Text Animation Threshold').min(0).max(2).step(0.01);
gui.add(rotationConfig.cube, 'speed').name('Cube Animation Speed').min(0).max(10).step(0.01);
gui.add(rotationConfig.donut, 'speed').name('Donut Animation Speed').min(0).max(10).step(0.01);

// Add GUI controls for adjusting text material properties
gui.add(textOptions, 'metalness').name('Text Metalness').min(0).max(1).step(0.01);
gui.add(textOptions, 'roughness').name('Text Roughness').min(0).max(1).step(0.01);

// Add GUI controls for toggling gizmo visibility and adding more meshes
gui.add(debugParameters, 'toggleGizmo').name('Toggle Gizmo');
gui.add(debugParameters, 'addMoreDonuts').name('Add 100 Donuts');
gui.add(debugParameters, 'addMoreCubes').name('Add 100 Cubes');
gui.add(debugParameters, 'addMoreSpheres').name('Add 100 Spheres');

// Start the animation loop
animate();
