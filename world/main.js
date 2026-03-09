import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

// SCENE SETUP
const canvas = document.querySelector('#c');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);


// TEXTURES SETUP
const loadingElem = document.querySelector('#loading');
const progressBarElem = loadingElem.querySelector('.progressbar');

const loadManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadManager);
const cubes = [];

const geometry = new THREE.BoxGeometry(1, 1, 1);

loadManager.onLoad = () => {
    loadingElem.style.display = 'none';
};

loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
    const progress = itemsLoaded / itemsTotal;
    progressBarElem.style.transform = `scaleX(${progress})`;
};

function loadColorTexture(path) {
    const texture = loader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

const materials = [
    new THREE.MeshBasicMaterial({ map: loadColorTexture('../textures/flower-1.jpg') }),
    new THREE.MeshBasicMaterial({ map: loadColorTexture('../textures/flower-2.jpg') }),
    new THREE.MeshBasicMaterial({ map: loadColorTexture('../textures/flower-3.jpg') }),
    new THREE.MeshBasicMaterial({ map: loadColorTexture('../textures/flower-4.jpg') }),
    new THREE.MeshBasicMaterial({ map: loadColorTexture('../textures/flower-5.jpg') }),
    new THREE.MeshBasicMaterial({ map: loadColorTexture('../textures/flower-6.jpg') }),
];


// GEOMETRY SETUP



function animate(time) {
    for (const cube of cubes) {
        cube.rotation.x = time / 2000;
        cube.rotation.y = time / 1000;
    }
    renderer.render(scene, camera);
}


class DegRadHelper {
    constructor(obj, prop) {
        this.obj = obj;
        this.prop = prop;
    }
    get value() {
        return THREE.MathUtils.radToDeg(this.obj[this.prop]);
    }
    set value(v) {
        this.obj[this.prop] = THREE.MathUtils.degToRad(v);
    }
}

class StringToNumberHelper {
    constructor(obj, prop) {
        this.obj = obj;
        this.prop = prop;
    }
    get value() {
        return this.obj[this.prop];
    }
    set value(v) {
        this.obj[this.prop] = parseFloat(v);
    }
}

const wrapModes = {
    'ClampToEdgeWrapping': THREE.ClampToEdgeWrapping,
    'RepeatWrapping': THREE.RepeatWrapping,
    'MirroredRepeatWrapping': THREE.MirroredRepeatWrapping,
};

function updateTexture() {
    texture.needsUpdate = true;
}

const texture = loader.load('../textures/wall.jpg');
const material = new THREE.MeshBasicMaterial({
    map: texture,
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
cubes.push(cube);

const gui = new GUI();
gui.add(new StringToNumberHelper(texture, 'wrapS'), 'value', wrapModes)
    .name('texture.wrapS')
    .onChange(updateTexture);
gui.add(new StringToNumberHelper(texture, 'wrapT'), 'value', wrapModes)
    .name('texture.wrapT')
    .onChange(updateTexture);
gui.add(texture.repeat, 'x', 0, 5, .01).name('texture.repeat.x');
gui.add(texture.repeat, 'y', 0, 5, .01).name('texture.repeat.y');
gui.add(texture.offset, 'x', -2, 2, .01).name('texture.offset.x');
gui.add(texture.offset, 'y', -2, 2, .01).name('texture.offset.y');
gui.add(texture.center, 'x', -.5, 1.5, .01).name('texture.center.x');
gui.add(texture.center, 'y', -.5, 1.5, .01).name('texture.center.y');
gui.add(new DegRadHelper(texture, 'rotation'), 'value', -360, 360)
    .name('texture.rotation');