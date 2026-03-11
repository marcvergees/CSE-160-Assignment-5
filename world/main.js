import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { ColorGUIHelper } from "../helpers/ColorGUIHelper.js";
import { MinMaxGUIHelper } from "../helpers/MinMaxGUIHelper.js";
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
var g_controls;
let g_landing_animation = null;
let g_takeoff_animation = null; // New state for Takeoff
let isDarkMode = false;
let isTowerView = false;
let originalCameraPos = new THREE.Vector3(0, 10, 20);
var stats;

// Constants
const planeSize = 250;

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


    const runwayGeo = new THREE.BoxGeometry(40, 0.5, 200);
    const runwayMat = new THREE.MeshPhongMaterial({ color: 'rgb(33, 33, 33)' });
    const runway = new THREE.Mesh(runwayGeo, runwayMat);
    runway.position.set(0, 0, 0);
    g_scene.add(runway);

    // --- Realistic Runway Markings ---
    const whiteLineMat = new THREE.MeshPhongMaterial({ color: '#FFFFFF' });

    // 1. Edge lines (Solid lines on the boundaries)
    const edgeLineGeo = new THREE.BoxGeometry(0.5, 0.1, 198);
    const leftEdge = new THREE.Mesh(edgeLineGeo, whiteLineMat);
    leftEdge.position.set(-18.5, 0.26, 0);
    g_scene.add(leftEdge);

    const rightEdge = new THREE.Mesh(edgeLineGeo, whiteLineMat);
    rightEdge.position.set(18.5, 0.26, 0);
    g_scene.add(rightEdge);

    // 2. Center dashed line
    const centerLineGeo = new THREE.BoxGeometry(0.5, 0.1, 4);
    for (let z = -60; z <= 60; z += 12) {
        const line = new THREE.Mesh(centerLineGeo, whiteLineMat);
        line.position.set(0, 0.26, z);
        g_scene.add(line);
    }

    // 3. Threshold markings (Piano keys at the start/end)
    const thresholdGeo = new THREE.BoxGeometry(1.2, 0.1, 10);
    for (let x = -14; x <= 14; x += 3.5) {
        if (Math.abs(x) < 2) continue; // Gap in the exact center

        const northStripe = new THREE.Mesh(thresholdGeo, whiteLineMat);
        northStripe.position.set(x, 0.26, -92);
        g_scene.add(northStripe);

        const southStripe = new THREE.Mesh(thresholdGeo, whiteLineMat);
        southStripe.position.set(x, 0.26, 92);
        g_scene.add(southStripe);
    }

    // 4. Aiming point markers (Large solid blocks)
    const aimPointGeo = new THREE.BoxGeometry(4, 0.1, 15);
    const aimPoints = [
        { x: -8, z: -75 }, { x: 8, z: -75 }, // North side aiming points
        { x: -8, z: 75 }, { x: 8, z: 75 }    // South side aiming points
    ];
    aimPoints.forEach(pos => {
        const aimMesh = new THREE.Mesh(aimPointGeo, whiteLineMat);
        aimMesh.position.set(pos.x, 0.26, pos.z);
        g_scene.add(aimMesh);
    });

    // 5. Touchdown zone markings (Pairs of multiple bars)
    const tdZoneGeo = new THREE.BoxGeometry(1.2, 0.1, 6);
    const tdZPositions = [
        { z: -60, count: 3 }, { z: -45, count: 2 }, { z: -30, count: 1 },
        { z: 60, count: 3 }, { z: 45, count: 2 }, { z: 30, count: 1 }
    ];

    tdZPositions.forEach(zone => {
        for (let c = 0; c < zone.count; c++) {
            // Left blocks
            const tdL = new THREE.Mesh(tdZoneGeo, whiteLineMat);
            tdL.position.set(-6 - (c * 2), 0.26, zone.z);
            g_scene.add(tdL);

            // Right blocks
            const tdR = new THREE.Mesh(tdZoneGeo, whiteLineMat);
            tdR.position.set(6 + (c * 2), 0.26, zone.z);
            g_scene.add(tdR);
        }
    });
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

    g_texture = g_loader.load('../textures/3561.jpg');
    const material = new THREE.MeshPhongMaterial({
        map: g_texture,
    });
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(25, 5, 0);
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

function load_obj(mtl_route, obj_route, position = [0, 0, 0], scale = 1, rotation = { x: 0, y: 0, z: 0 }, callback = null) {
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
            if (callback) callback(root);
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
        // { position: [0, 0, 0], scale: 0.3, rotation: { x: 0, y: Math.PI / 10, z: 0 } },
    ];
    airplanes.forEach((plane) => {
        load_obj('../models/airplane/airplane_.mtl', '../models/airplane/airplane_.obj', plane.position, plane.scale, plane.rotation);
    });
}

function ui() {

    function updateCamera() {
        g_camera.updateProjectionMatrix();
    }

    function makeXYZGUI(gui, vector3, name, onChangeFn) {
        const folder = gui.addFolder(name);
        folder.add(vector3, 'x', -100, 100).onChange(onChangeFn);
        folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
        folder.add(vector3, 'z', -100, 100).onChange(onChangeFn);
        folder.open();
    }

    function updateLight() {
        g_light_directional.target.updateMatrixWorld();
        g_light_directional_helper.update();
        g_light_point.updateMatrixWorld();
        g_light_point_helper.update();
    }


    const gui = new GUI();
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
    pointLightFolder.add(g_light_point, 'intensity', 0, 250, 1);
    makeXYZGUI(pointLightFolder, g_light_point.position, 'position', updateLight);

    const ambientLightFolder = gui.addFolder('Ambient Light');
    ambientLightFolder.addColor(new ColorGUIHelper(g_light_ambient, 'color'), 'value').name('color');
    ambientLightFolder.add(g_light_ambient, 'intensity', 0, 5, 0.01);
}

function animate() {
    stats.begin();

    if (g_landing_animation) {
        if (g_landing_animation.waitingForTaxi) {
            // Plane is waiting for user input, do nothing and let scene render
        } else if (g_landing_animation.phase === 'taxi') {
            // Phase 3: Taxi to destination
            const now = performance.now();
            const elapsed = now - g_landing_animation.taxiStartTime;
            const t = Math.min(elapsed / g_landing_animation.taxiDuration, 1);

            g_landing_animation.mesh.position.lerpVectors(
                g_landing_animation.taxiStartPos,
                g_landing_animation.taxiEndPos,
                t
            );

            g_landing_animation.mesh.quaternion.slerpQuaternions(
                g_landing_animation.taxiStartRot,
                g_landing_animation.taxiEndRot,
                t
            );

            if (t >= 1) {
                console.log("Plane parked successfully.");
                g_landing_animation = null; // Animation complete
                document.getElementById('land-button').disabled = false;
                document.getElementById('land-button').style.opacity = '1';
                document.getElementById('land-button').style.cursor = 'pointer';

                document.getElementById('takeoff-button').disabled = false;
                document.getElementById('takeoff-button').style.opacity = '1';
                document.getElementById('takeoff-button').style.cursor = 'pointer';
            }
        } else {
            const now = performance.now();
            const elapsed = now - g_landing_animation.startTime;
            const t = elapsed / g_landing_animation.duration; // t goes from 0 to 2

            g_landing_animation.mesh.position.lerpVectors(
                t > 1 ? g_landing_animation.mid : g_landing_animation.start,
                t > 1 ? g_landing_animation.end : g_landing_animation.mid,
                t > 1 ? Math.sqrt(t - 1) : Math.sqrt(t)
            );

            if (t >= 2 && !g_landing_animation.waitingForTaxi) {
                // Trigger taxi menu
                g_landing_animation.waitingForTaxi = true;
                const taxiMenu = document.getElementById('taxi-menu');
                if (taxiMenu) {
                    taxiMenu.style.display = 'block';
                }
            }
        }
    }

    if (g_takeoff_animation) {
        const now = performance.now();

        if (g_takeoff_animation.phase === 'taxi_to_runway') {
            const elapsed = now - g_takeoff_animation.startTime;
            const t = Math.min(elapsed / g_takeoff_animation.duration, 1);

            g_takeoff_animation.mesh.position.lerpVectors(
                g_takeoff_animation.startPos,
                g_takeoff_animation.endPos,
                t
            );
            g_takeoff_animation.mesh.quaternion.slerpQuaternions(
                g_takeoff_animation.startRot,
                g_takeoff_animation.endRot,
                t
            );

            if (t >= 1) {
                // Transition to Sliding
                g_takeoff_animation.phase = 'sliding';
                g_takeoff_animation.startTime = performance.now();
                g_takeoff_animation.duration = 2000; // Shorter sliding duration so it takes off earlier
                g_takeoff_animation.startPos = g_takeoff_animation.mesh.position.clone();
                g_takeoff_animation.endPos = new THREE.Vector3(0, 0, 0); // End slide at midpoint of runway instead of the very end

                // Rotate to face down the runway (approx Positive Z)
                g_takeoff_animation.startRot = g_takeoff_animation.mesh.quaternion.clone();
                g_takeoff_animation.endRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
                console.log("Plane taxi complete, starting runway slide...");
            }
        } else if (g_takeoff_animation.phase === 'sliding') {
            const elapsed = now - g_takeoff_animation.startTime;
            let t = Math.min(elapsed / g_takeoff_animation.duration, 1);

            // Quadratic easing for acceleration down the runway
            const easedT = t * t;

            g_takeoff_animation.mesh.position.lerpVectors(
                g_takeoff_animation.startPos,
                g_takeoff_animation.endPos,
                easedT
            );
            // Complete any remaining rotation in the first small fraction of sliding
            g_takeoff_animation.mesh.quaternion.slerpQuaternions(
                g_takeoff_animation.startRot,
                g_takeoff_animation.endRot,
                Math.min(t * 5, 1)
            );

            if (t >= 1) {
                // Transition to Ascent
                g_takeoff_animation.phase = 'ascent';
                g_takeoff_animation.startTime = performance.now();
                g_takeoff_animation.duration = 4000;
                g_takeoff_animation.startPos = g_takeoff_animation.mesh.position.clone();
                g_takeoff_animation.endPos = new THREE.Vector3(0, 100, 300); // Fly up and away in Positive Z

                // Pitch up for takeoff
                g_takeoff_animation.startRot = g_takeoff_animation.mesh.quaternion.clone();
                g_takeoff_animation.endRot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 8, 0, 0));
                console.log("V1... Rotate... Takeoff!");
            }
        } else if (g_takeoff_animation.phase === 'ascent') {
            const elapsed = now - g_takeoff_animation.startTime;
            const t = Math.min(elapsed / g_takeoff_animation.duration, 1);

            g_takeoff_animation.mesh.position.lerpVectors(
                g_takeoff_animation.startPos,
                g_takeoff_animation.endPos,
                t
            );
            // Smoothly pitch up during the first half of ascent
            g_takeoff_animation.mesh.quaternion.slerpQuaternions(
                g_takeoff_animation.startRot,
                g_takeoff_animation.endRot,
                Math.min(t * 2, 1)
            );

            if (t >= 1) {
                console.log("Plane has left the airspace.");
                g_scene.remove(g_takeoff_animation.mesh);
                g_takeoff_animation = null; // Animation complete

                // Re-enable buttons
                const landBtn = document.getElementById('land-button');
                landBtn.disabled = false;
                landBtn.style.opacity = '1';
                landBtn.style.cursor = 'pointer';

                const takeoffBtn = document.getElementById('takeoff-button');
                takeoffBtn.disabled = false;
                takeoffBtn.style.opacity = '1';
                takeoffBtn.style.cursor = 'pointer';
            }
        }
    }

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

function land_plane() {
    if (g_landing_animation || g_takeoff_animation) return;

    // Disable button styling
    const landButton = document.getElementById('land-button');
    landButton.disabled = true;
    landButton.style.opacity = '0.5';
    landButton.style.cursor = 'not-allowed';

    const takeoffButton = document.getElementById('takeoff-button');
    takeoffButton.disabled = true;
    takeoffButton.style.opacity = '0.5';
    takeoffButton.style.cursor = 'not-allowed';

    const startPos = [0, 100, -300];
    const midPos = [0, 0, 0];
    const endPos = [0, 0, 100];
    const duration = 5000;

    load_obj('../models/airplane/airplane_.mtl', '../models/airplane/airplane_.obj', startPos, 0.3, { x: 0, y: Math.PI / 10, z: 0 }, (plane) => {
        g_landing_animation = {
            mesh: plane,
            start: new THREE.Vector3(...startPos),
            mid: new THREE.Vector3(...midPos),
            end: new THREE.Vector3(...endPos),
            startTime: performance.now(),
            duration: duration,
            waitingForTaxi: false,
            phase: 'landing'
        };
    });
}

function addActionstoUI() {
    document.getElementById('start-button').addEventListener('click', () => {
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

    document.getElementById('theme-toggle').addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        const btn = document.getElementById('theme-toggle');
        if (isDarkMode) {
            btn.innerText = "Toggle Light Mode";
            // Dark mode lighting
            g_light_ambient.color.setHex(0x222244);
            g_light_ambient.intensity = 0.5;

            g_light_directional.color.setHex(0x111133);
            g_light_directional.intensity = 0.5;

            g_light_point.color.setHex(0xffaa55); // Warm, street-light glow
            g_light_point.intensity = 150;
        } else {
            btn.innerText = "Toggle Dark Mode";
            // Light mode lighting
            g_light_ambient.color.setHex(0xFFFFFF);
            g_light_ambient.intensity = 1;

            g_light_directional.color.setHex(0xFFFFFF);
            g_light_directional.intensity = 1;

            g_light_point.color.setHex(0xFFFFFF);
            g_light_point.intensity = 150;
        }
    });

    document.getElementById('tower-view-toggle').addEventListener('click', () => {
        isTowerView = !isTowerView;
        const btn = document.getElementById('tower-view-toggle');

        if (isTowerView) {
            btn.innerText = "Toggle Normal View";
            // Save current position as potential "original" if it's not already tower
            originalCameraPos.copy(g_camera.position);

            // Move to tower top: (-50, 31.5, -100)
            g_camera.position.set(-50, 40, -100);
            g_controls.target.set(0, 0, 0); // Focus on runway/center
            g_controls.update();
        } else {
            btn.innerText = "Toggle Tower View";
            // Restore to (0, 10, 20) looking at (0,0,0) as requested
            g_camera.position.set(0, 10, 20);
            g_controls.target.set(0, 0, 0);
            g_controls.update();
        }
    });

    document.getElementById("land-button").addEventListener('click', land_plane);

    // Taxi Menu Logic
    document.querySelectorAll('#taxi-options .flight-card').forEach(item => {
        item.addEventListener('click', event => {
            const target = event.target.getAttribute('data-target');
            document.getElementById('taxi-menu').style.display = 'none';

            if (!g_landing_animation) return;

            let finalPos, finalRotationY;

            // Define destination coordinates based on my_objs locations and terminal positions
            switch (target) {
                case 'terminal-1':
                    finalPos = [-100, 0, -40]; // Left wing terminal area
                    finalRotationY = Math.PI * 3 / 5;
                    break;
                case 'terminal-2':
                    finalPos = [-80, 0, 0]; // Left wing terminal area
                    finalRotationY = Math.PI * 3 / 5;
                    break;
                case 'terminal-3':
                    finalPos = [-100, 0, 40]; // Left wing terminal area
                    finalRotationY = Math.PI * 3 / 5;
                    break;
                case 'hangar':
                    finalPos = [80, 0, 80]; // Inside hangar (assuming hangar 2)
                    finalRotationY = Math.PI * 3 / 5;
                    break;
            }

            g_landing_animation.phase = 'taxi';
            g_landing_animation.waitingForTaxi = false;
            g_landing_animation.taxiStartPos = g_landing_animation.mesh.position.clone();
            g_landing_animation.taxiEndPos = new THREE.Vector3(...finalPos);

            // Setup quaternion for initial and final rotation
            g_landing_animation.taxiStartRot = g_landing_animation.mesh.quaternion.clone();

            // Create target Euler then convert to Quaternion
            const currentEuler = g_landing_animation.mesh.rotation.clone();
            const targetEuler = new THREE.Euler(currentEuler.x, finalRotationY, currentEuler.z);
            g_landing_animation.taxiEndRot = new THREE.Quaternion().setFromEuler(targetEuler);

            g_landing_animation.taxiStartTime = performance.now();
            g_landing_animation.taxiDuration = 4000; // 4 seconds for taxiing
        });
    });

    // Takeoff UI Logic
    document.getElementById("takeoff-button").addEventListener('click', () => {
        if (g_landing_animation || g_takeoff_animation) return;

        // Disable button styling
        const landButton = document.getElementById('land-button');
        landButton.disabled = true;
        landButton.style.opacity = '0.5';
        landButton.style.cursor = 'not-allowed';

        const takeoffButton = document.getElementById('takeoff-button');
        takeoffButton.disabled = true;
        takeoffButton.style.opacity = '0.5';
        takeoffButton.style.cursor = 'not-allowed';

        document.getElementById('takeoff-origin-menu').style.display = 'block';
    });

    document.querySelectorAll('#takeoff-origin-options .flight-card').forEach(item => {
        item.addEventListener('click', event => {
            const origin = event.target.getAttribute('data-origin');
            document.getElementById('takeoff-origin-menu').style.display = 'none';

            let startPos, startRotationY = Math.PI / 10;

            // Define origin coordinates 
            switch (origin) {
                case 'terminal-1':
                    startPos = [-100, 0, -40];
                    break;
                case 'terminal-2':
                    startPos = [-100, 0, 0];
                    break;
                case 'terminal-3':
                    startPos = [-100, 0, 40];
                    break;
                case 'hangar':
                    startPos = [80, 0, 80];
                    break;
            }

            // Spawn plane for takeoff
            load_obj('../models/airplane/airplane_.mtl', '../models/airplane/airplane_.obj', startPos, 0.3, { x: 0, y: startRotationY, z: 0 }, (plane) => {
                const runwayStartPos = new THREE.Vector3(0, 0, -100);

                // Create target Euler then convert to Quaternion for facing the runway
                const currentEuler = plane.rotation.clone();
                const targetEuler = new THREE.Euler(currentEuler.x, 0, currentEuler.z); // Facing generally towards Positive Z

                g_takeoff_animation = {
                    mesh: plane,
                    phase: 'taxi_to_runway',
                    startPos: plane.position.clone(),
                    endPos: runwayStartPos,
                    startRot: plane.quaternion.clone(),
                    endRot: new THREE.Quaternion().setFromEuler(targetEuler),
                    startTime: performance.now(),
                    duration: 4000
                };
            });
        });
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
