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

function control_tower(x = 0, y = 0, z = 0) {
    // Materials
    const concreteMat = new THREE.MeshPhongMaterial({ color: '#888888' });
    const whiteMat = new THREE.MeshPhongMaterial({ color: '#FFFFFF' });
    const redMat = new THREE.MeshPhongMaterial({ color: '#CC0000' }); // Aviation warning color
    const glassMat = new THREE.MeshPhongMaterial({ color: '#224466' }); // Observation cab glass
    const metalMat = new THREE.MeshPhongMaterial({ color: '#444444' }); // Antennas/Technical equipment
    const radomeMat = new THREE.MeshPhongMaterial({ color: '#EEEEEE' }); // Off-white for radome

    const towerGroup = new THREE.Group();

    // 1. Foundation - Concrete
    const baseGeo = new THREE.BoxGeometry(12, 1, 12);
    const base = new THREE.Mesh(baseGeo, concreteMat);
    base.position.set(0, 0.5, 0);
    towerGroup.add(base);

    // 2. Main Shaft - Level 1 (Lower) - White
    const shaft1Geo = new THREE.BoxGeometry(7, 12, 7);
    const shaft1 = new THREE.Mesh(shaft1Geo, whiteMat);
    shaft1.position.set(0, 7, 0);
    towerGroup.add(shaft1);

    // 3. Main Shaft - Level 2 (Middle Taper Transition) - Red Stripe
    const shaft2Geo = new THREE.BoxGeometry(8, 2, 8);
    const shaft2 = new THREE.Mesh(shaft2Geo, redMat);
    shaft2.position.set(0, 14, 0);
    towerGroup.add(shaft2);

    // 4. Main Shaft - Level 3 (Upper) - White
    const shaft3Geo = new THREE.BoxGeometry(7.5, 6, 7.5);
    const shaft3 = new THREE.Mesh(shaft3Geo, whiteMat);
    shaft3.position.set(0, 18, 0);
    towerGroup.add(shaft3);

    // 5. Technical Level (Under the Cab) - Red Detail
    const techGeo = new THREE.BoxGeometry(10, 2, 10);
    const tech = new THREE.Mesh(techGeo, redMat);
    tech.position.set(0, 22, 0);
    towerGroup.add(tech);

    // 6. Observation Cab - Blue Glass Body
    const cabGeo = new THREE.BoxGeometry(14, 8, 14);
    const cab = new THREE.Mesh(cabGeo, glassMat);
    cab.position.set(0, 27, 0);
    towerGroup.add(cab);

    // 7. Roof / Sun Shield - White
    const roofGeo = new THREE.BoxGeometry(16, 1, 16);
    const roof = new THREE.Mesh(roofGeo, whiteMat);
    roof.position.set(0, 31.5, 0);
    towerGroup.add(roof);

    // 8. Radome (Secondary Radar) - Radome White
    const radomeGeo = new THREE.SphereGeometry(2.5, 32, 16);
    const radome = new THREE.Mesh(radomeGeo, radomeMat);
    radome.position.set(4, 34, 4);
    towerGroup.add(radome);

    // 9. Main Radar Antenna - Metal/Gray
    const radarBaseGeo = new THREE.BoxGeometry(3, 1, 3);
    const radarBase = new THREE.Mesh(radarBaseGeo, metalMat);
    radarBase.position.set(-4, 32.5, -4);
    towerGroup.add(radarBase);

    const radarDishGeo = new THREE.SphereGeometry(2, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const radarDish = new THREE.Mesh(radarDishGeo, metalMat);
    radarDish.position.set(-4, 34, -4);
    radarDish.rotation.x = Math.PI / 4;
    towerGroup.add(radarDish);

    // 10. Communication Antennas - Dark Metal
    const ant1Geo = new THREE.BoxGeometry(0.2, 8, 0.2);
    const ant1 = new THREE.Mesh(ant1Geo, metalMat);
    ant1.position.set(-6, 35.5, 6);
    towerGroup.add(ant1);

    const ant2Geo = new THREE.BoxGeometry(0.1, 10, 0.1);
    const ant2 = new THREE.Mesh(ant2Geo, metalMat);
    ant2.position.set(6, 36.5, -6);
    towerGroup.add(ant2);

    const ant3Geo = new THREE.BoxGeometry(0.5, 4, 0.5);
    const ant3Mat = new THREE.MeshPhongMaterial({ color: metalMat.color });
    const ant3 = new THREE.Mesh(ant3Geo, ant3Mat);
    ant3.position.set(0, 33.5, 0);
    towerGroup.add(ant3);

    towerGroup.position.set(x, y, z);
    g_scene.add(towerGroup);
}

function plane_hangar(x = 0, y = 0, z = 0) {
    // Materials
    const deltaBlueMat = new THREE.MeshPhongMaterial({ color: '#003366' });
    const deltaRedMat = new THREE.MeshPhongMaterial({ color: '#E03A3E' });
    const deltaWhiteMat = new THREE.MeshPhongMaterial({ color: '#FFFFFF' });
    const hangarWallMat = new THREE.MeshPhongMaterial({ color: '#DDDDDD' });

    const hangarGroup = new THREE.Group();

    // 1. Main Hall
    const bodyGeo = new THREE.BoxGeometry(40, 15, 30);
    const body = new THREE.Mesh(bodyGeo, hangarWallMat);
    body.position.set(0, 7.5, 0);
    hangarGroup.add(body);

    // 2. Roof - Blue with Red detail
    const roofGeo = new THREE.BoxGeometry(42, 2, 32);
    const roof = new THREE.Mesh(roofGeo, deltaBlueMat);
    roof.position.set(0, 15.5, 0);
    hangarGroup.add(roof);

    const roofRidgeGeo = new THREE.BoxGeometry(42, 0.5, 2);
    const roofRidge = new THREE.Mesh(roofRidgeGeo, deltaRedMat);
    roofRidge.position.set(0, 16.5, 0);
    hangarGroup.add(roofRidge);

    // 3. Doors - Front
    const doorGeo = new THREE.BoxGeometry(18, 12, 1);
    const doorL = new THREE.Mesh(doorGeo, deltaWhiteMat);
    doorL.position.set(-9.5, 6, 15.1);
    hangarGroup.add(doorL);

    const doorR = new THREE.Mesh(doorGeo, deltaWhiteMat);
    doorR.position.set(9.5, 6, 15.1);
    hangarGroup.add(doorR);

    // 4. Windows/Details
    const windowGeo = new THREE.BoxGeometry(38, 2, 0.5);
    const topWindows = new THREE.Mesh(windowGeo, deltaBlueMat);
    topWindows.position.set(0, 13, 15);
    hangarGroup.add(topWindows);

    // 5. Delta "Logo" 
    const logoGeo = new THREE.SphereGeometry(2, 4, 2); // Pyramid-ish
    const logo = new THREE.Mesh(logoGeo, deltaRedMat);
    logo.position.set(0, 18, 0);
    logo.rotation.y = Math.PI / 4;
    hangarGroup.add(logo);

    hangarGroup.position.set(x, y, z);
    hangarGroup.rotation.set(0, -Math.PI / 2, 0);
    g_scene.add(hangarGroup);
}

function airport_terminal(x = 0, y = 0, z = 0) {
    const terminalGroup = new THREE.Group();

    // Materials
    const wallMat = new THREE.MeshPhongMaterial({ color: '#EEEEEE' }); // Off-white concrete
    const glassMat = new THREE.MeshPhongMaterial({
        color: '#88CCFF',
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    const roofMat = new THREE.MeshPhongMaterial({ color: '#333333' }); // Dark gray roof
    const metalMat = new THREE.MeshPhongMaterial({ color: '#777777' }); // Metal supports

    // 1. Central Hall (Main Building)
    const mainHallGeo = new THREE.BoxGeometry(60, 20, 40);
    const mainHall = new THREE.Mesh(mainHallGeo, wallMat);
    mainHall.position.y = 10;
    terminalGroup.add(mainHall);

    // 2. Large Glass Facade (Front)
    const glassGeo = new THREE.PlaneGeometry(50, 15);
    const glassFront = new THREE.Mesh(glassGeo, glassMat);
    glassFront.position.set(0, 10, 20.1);
    terminalGroup.add(glassFront);

    // 3. Concourse Wings (Left & Right)
    const wingGeo = new THREE.BoxGeometry(100, 12, 20);

    const wingL = new THREE.Mesh(wingGeo, wallMat);
    wingL.position.set(-80, 6, -10);
    terminalGroup.add(wingL);

    const wingR = new THREE.Mesh(wingGeo, wallMat);
    wingR.position.set(80, 6, -10);
    terminalGroup.add(wingR);

    // 4. Glass Windows for Wings
    const wingGlassGeo = new THREE.BoxGeometry(90, 8, 20.2);
    const wingGlassL = new THREE.Mesh(wingGlassGeo, glassMat);
    wingGlassL.position.set(-80, 6, -10);
    terminalGroup.add(wingGlassL);

    const wingGlassR = new THREE.Mesh(wingGlassGeo, glassMat);
    wingGlassR.position.set(80, 6, -10);
    terminalGroup.add(wingGlassR);

    // 5. Curved Roof Detail (Main Hall)
    const roofCurveGeo = new THREE.CylinderGeometry(40, 40, 65, 32, 1, false, 0, Math.PI);
    const roofCurve = new THREE.Mesh(roofCurveGeo, roofMat);
    roofCurve.rotation.z = Math.PI / 2;
    roofCurve.rotation.y = Math.PI;
    roofCurve.position.set(0, 15, 0);
    roofCurve.scale.set(1, 0.2, 0.7);
    terminalGroup.add(roofCurve);

    // 6. Jet Bridges (Simplified)
    const createJetBridge = (posX, posZ) => {
        const bridgeGroup = new THREE.Group();

        const tubeGeo = new THREE.BoxGeometry(4, 4, 15);
        const tube = new THREE.Mesh(tubeGeo, metalMat);
        tube.position.z = 7.5;
        bridgeGroup.add(tube);

        const headGeo = new THREE.BoxGeometry(6, 6, 6);
        const head = new THREE.Mesh(headGeo, metalMat);
        head.position.z = 15;
        bridgeGroup.add(head);

        bridgeGroup.position.set(posX, 6, posZ);
        return bridgeGroup;
    };

    // Add some jet bridges to the wings
    terminalGroup.add(createJetBridge(-60, -20));
    terminalGroup.add(createJetBridge(-100, -20));
    terminalGroup.add(createJetBridge(60, -20));
    terminalGroup.add(createJetBridge(100, -20));

    terminalGroup.position.set(x, y, z);
    terminalGroup.rotation.set(0, Math.PI / 2, 0);
    g_scene.add(terminalGroup);
}

function basic_figures() {
    control_tower(-50, 0, -100);
    plane_hangar(80, 0, -80);
    plane_hangar(80, 0, 80);

    airport_terminal(-120, 0, 0);

    // const cubeSize = 4;
    // const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
    // const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
    // const mesh_cube = new THREE.Mesh(cubeGeo, cubeMat);
    // mesh_cube.position.set(cubeSize + 1, cubeSize / 2, 0);
    // g_scene.add(mesh_cube);

    // const sphereRadius = 3;
    // const sphereWidthDivisions = 32;
    // const sphereHeightDivisions = 16;
    // const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    // const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });
    // const mesh_sphere = new THREE.Mesh(sphereGeo, sphereMat);
    // mesh_sphere.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
    // g_scene.add(mesh_sphere);

    g_texture = g_loader.load('../textures/3561.jpg');
    const material = new THREE.MeshPhongMaterial({
        map: g_texture,
    });
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, 5, 0);
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

function load_obj(mtl_route, obj_route, position = [0, 0, 0], scale = 1, rotation = { x: 0, y: 0, z: 0 }) {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(mtl_route, (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load(obj_route, (root) => {
            root.position.set(...position);
            root.scale.set(scale, scale, scale);
            root.rotation.set(rotation.x, rotation.y, rotation.z);
            g_scene.add(root);
        });
    });
}

function my_objs() {
    const airplanes = [
        { position: [-100, 0, -100], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-100, 0, -80], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-100, 0, -60], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-100, 0, -40], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-80, 0, -20], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-80, 0, 0], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-80, 0, 20], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-100, 0, 40], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-100, 0, 60], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-100, 0, 80], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [-100, 0, 100], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [80, 0, -40], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [80, 0, -20], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [80, 0, 0], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [80, 0, 20], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [80, 0, 40], scale: 0.3, rotation: { x: 0, y: Math.PI * 3 / 5, z: 0 } },
        { position: [0, 0, 0], scale: 0.3, rotation: { x: 0, y: 0, z: 0 } },
    ];
    airplanes.forEach((plane) => {
        load_obj('../models/airplane/airplane_.mtl', '../models/airplane/airplane_.obj', plane.position, plane.scale, plane.rotation);
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

function addActionstoUI() {
    const startButton = document.getElementById('start-button');
    startButton.addEventListener('click', () => {
        document.getElementById('introduction').style.display = 'none';
        document.getElementById('c').style.display = 'block';
    });

    document.getElementById('arrow-icon').addEventListener('click', () => {
        console.log("Arrow clicked");
        const flights = document.getElementById('flights');
        flights.style.display = flights.style.display === 'none' ? 'block' : 'none';
        const arrowIcon = document.getElementById('arrow-icon');
        arrowIcon.style.transform = arrowIcon.style.transform === 'rotate(180deg)' ? 'rotate(0deg)' : 'rotate(180deg)';
    });
}

function main() {
    threejs_setup();            // Inizialiton of global variables: canvas, camera & renderer
    create_controls();          // Creates orbit controls
    texture_loader();           // Texture loading manager and progress bar at the beginning
    createStats();

    addActionstoUI();

    // Render scene
    floor();
    basic_figures();
    lighting();
    my_objs();
    ui();
}


main();