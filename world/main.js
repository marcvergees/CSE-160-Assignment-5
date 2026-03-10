import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { ColorGUIHelper } from "../helpers/ColorGUIHelper.js";
import { DegRadHelper } from "../helpers/DegRadHelper.js";
import { MinMaxGUIHelper } from "../helpers/MinMaxGUIHelper.js";
import { StringToNumberHelper } from "../helpers/StringToNumberHelper.js";
import { Stats } from "../lib/stats.js";

// Global Variables
var g_canvas;
var g_scene;
var g_camera;
var g_renderer;
var g_loader;
var g_light_directional;
var g_light_directional_helper;
var g_light_point;
var g_light_point_helper;
var g_light_ambient;
var g_texture;
var g_bgTexture;
var g_controls;
var stats;

// Constants
const planeSize = 200;


function threejs_setup() {
    g_canvas = document.querySelector('#c');
    g_scene = new THREE.Scene();
    g_camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    g_camera.position.set(0, 10, 20);

    g_renderer = new THREE.WebGLRenderer({ antialias: true, canvas: g_canvas, alpha: true });
    g_renderer.setSize(window.innerWidth, window.innerHeight);
    g_renderer.setAnimationLoop(animate);
}

function create_controls() {
    g_controls = new OrbitControls(g_camera, g_canvas);
    g_controls.target.set(0, 5, 0);
    g_controls.update();
}

function texture_loader() {
    const loadingElem = document.querySelector('#loading');
    const progressBarElem = loadingElem.querySelector('.progressbar');

    const loadManager = new THREE.LoadingManager();
    g_loader = new THREE.TextureLoader(loadManager);

    const g_texture2 = g_loader.load(
        '../textures/highway.jpg',
        () => {
            g_texture2.mapping = THREE.EquirectangularReflectionMapping;
            g_texture2.colorSpace = THREE.SRGBColorSpace;
            g_scene.background = g_texture2;
        });

    loadManager.onLoad = () => {
        loadingElem.style.display = 'none';
    };

    loadManager.onProgress = (_urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal;
        progressBarElem.style.transform = `scaleX(${progress})`;
    };
}

function floor() {
    const texture_floor = g_loader.load('../textures/checker.png');
    texture_floor.wrapS = THREE.RepeatWrapping;
    texture_floor.wrapT = THREE.RepeatWrapping;
    texture_floor.magFilter = THREE.NearestFilter;
    texture_floor.colorSpace = THREE.SRGBColorSpace;
    const repeats = planeSize / 2;
    texture_floor.repeat.set(repeats, repeats);
    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
        map: texture_floor,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -.5;
    g_scene.add(mesh);
}

function basic_figures() {
    const cubeSize = 4;
    const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
    const mesh_cube = new THREE.Mesh(cubeGeo, cubeMat);
    mesh_cube.position.set(cubeSize + 1, cubeSize / 2, 0);
    g_scene.add(mesh_cube);

    const sphereRadius = 3;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });
    const mesh_sphere = new THREE.Mesh(sphereGeo, sphereMat);
    mesh_sphere.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
    g_scene.add(mesh_sphere);

    g_texture = g_loader.load('../textures/wall.jpg');
    const material = new THREE.MeshBasicMaterial({
        map: g_texture,
    });
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const cube = new THREE.Mesh(geometry, material);
    g_scene.add(cube);
}

function directional_light() {
    const color = 0xFFFFFF;
    const intensity = 1;
    g_light_directional = new THREE.DirectionalLight(color, intensity);
    g_light_directional.position.set(0, 10, 0);
    g_light_directional.target.position.set(-5, 0, 0);
    g_scene.add(g_light_directional);
    g_scene.add(g_light_directional.target);

    g_light_directional_helper = new THREE.DirectionalLightHelper(g_light_directional);
    g_scene.add(g_light_directional_helper);
}

function point_light() {
    const color = 0xFFFFFF;
    const intensity = 150;
    g_light_point = new THREE.PointLight(color, intensity);
    g_light_point.position.set(0, 10, 0);
    g_scene.add(g_light_point);

    g_light_point_helper = new THREE.PointLightHelper(g_light_point);
    g_scene.add(g_light_point_helper);
}

function ambient_light() {
    const color = 0xFFFFFF;
    const intensity = 1;
    g_light_ambient = new THREE.AmbientLight(color, intensity);
    g_scene.add(g_light_ambient);
}

function lighting() {
    ambient_light();
    directional_light();
    point_light();
}

function my_objs() {
    const mtlLoader = new MTLLoader();
    const airplane_positions = [
        [-100, 0, -100],
        [-100, 0, -80],
        [-100, 0, -60],
        [-100, 0, -40],
        [-100, 0, -20],
        [-100, 0, 0],
        [-100, 0, 20],
        [-100, 0, 40],
        [-100, 0, 60],
        [-100, 0, 80],
        [-100, 0, 100],
        [100, 0, -100],
        [100, 0, -80],
        [100, 0, -60],
        [100, 0, -40],
        [100, 0, -20],
        [100, 0, 0],
        [100, 0, 20],
        [100, 0, 40],
        [100, 0, 60],
        [100, 0, 80],
        [100, 0, 100],
        [0, 0, 0],
    ];
    airplane_positions.forEach((position) => {
        mtlLoader.load('../models/airplane/airplane_.mtl', (mtl) => {
            mtl.preload();
            const objLoader = new OBJLoader();
            objLoader.setMaterials(mtl);
            objLoader.load('../models/airplane/airplane_.obj', (root) => {
                root.rotation.y = Math.PI * 3 / 5;
                root.position.set(...position);
                root.scale.set(0.3, 0.3, 0.3);
                g_scene.add(root);
            });
        });
    });

}

function ui() {
    function updateTexture() {
        if (g_texture) g_texture.needsUpdate = true;
    }

    function updateCamera() {
        g_camera.updateProjectionMatrix();
    }

    function makeXYZGUI(gui, vector3, name, onChangeFn) {
        const folder = gui.addFolder(name);
        folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
        folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
        folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
        folder.open();
    }

    function updateLight() {
        g_light_directional.target.updateMatrixWorld();
        g_light_directional_helper.update();
        g_light_point.updateMatrixWorld();
        g_light_point_helper.update();
    }

    const wrapModes = {
        'ClampToEdgeWrapping': THREE.ClampToEdgeWrapping,
        'RepeatWrapping': THREE.RepeatWrapping,
        'MirroredRepeatWrapping': THREE.MirroredRepeatWrapping,
    };

    const gui = new GUI();
    // Texture UI Configuration
    // gui.add(new StringToNumberHelper(g_texture, 'wrapS'), 'value', wrapModes)
    //     .name('texture.wrapS')
    //     .onChange(updateTexture);
    // gui.add(new StringToNumberHelper(g_texture, 'wrapT'), 'value', wrapModes)
    //     .name('texture.wrapT')
    //     .onChange(updateTexture);
    // gui.add(g_texture.repeat, 'x', 0, 5, .01).name('texture.repeat.x');
    // gui.add(g_texture.repeat, 'y', 0, 5, .01).name('texture.repeat.y');
    // gui.add(g_texture.offset, 'x', -2, 2, .01).name('texture.offset.x');
    // gui.add(g_texture.offset, 'y', -2, 2, .01).name('texture.offset.y');
    // gui.add(g_texture.center, 'x', -.5, 1.5, .01).name('texture.center.x');
    // gui.add(g_texture.center, 'y', -.5, 1.5, .01).name('texture.center.y');
    // gui.add(new DegRadHelper(g_texture, 'rotation'), 'value', -360, 360)
    //     .name('texture.rotation');
    gui.add(g_camera, 'fov', 1, 180).onChange(updateCamera);
    const minMaxGUIHelper = new MinMaxGUIHelper(g_camera, 'near', 'far', 0.1);
    gui.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
    gui.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);

    const dirLightFolder = gui.addFolder('Directional Light');
    dirLightFolder.addColor(new ColorGUIHelper(g_light_directional, 'color'), 'value').name('color');
    dirLightFolder.add(g_light_directional, 'intensity', 0, 5, 0.01);
    makeXYZGUI(dirLightFolder, g_light_directional.position, 'position', updateLight);
    makeXYZGUI(dirLightFolder, g_light_directional.target.position, 'target', updateLight);

    const pointLightFolder = gui.addFolder('Point Light');
    pointLightFolder.addColor(new ColorGUIHelper(g_light_point, 'color'), 'value').name('color');
    pointLightFolder.add(g_light_point, 'intensity', 0, 150, 1);
    makeXYZGUI(pointLightFolder, g_light_point.position, 'position', updateLight);

    const ambientLightFolder = gui.addFolder('Ambient Light');
    ambientLightFolder.addColor(new ColorGUIHelper(g_light_ambient, 'color'), 'value').name('color');
    ambientLightFolder.add(g_light_ambient, 'intensity', 0, 5, 0.01);
}

function animate() {
    stats.begin();
    g_renderer.render(g_scene, g_camera);
    stats.end();
}

function createStats() {
    stats = new Stats();
    stats.dom.style.left = "auto";
    stats.dom.style.right = "0";
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
}

function main() {
    threejs_setup();            // Inizialiton of global variables: canvas, camera & renderer
    create_controls();          // Creates orbit controls
    texture_loader();           // Texture loading manager and progress bar at the beginning
    createStats();

    // Render scene
    floor();
    basic_figures();
    lighting();
    my_objs();
    ui();
}


main();