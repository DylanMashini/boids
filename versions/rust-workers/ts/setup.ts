import * as THREE from "three";
import { VRButton } from "three/examples/jsm/webxr/VRButton.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { boid } from "./boid";
export default function setup(settings: any): {
	scene: THREE.Scene;
	renderer: THREE.WebGLRenderer;
	camera: THREE.PerspectiveCamera;
	// boids: boid[];
	boids: null;
} {
	const scene = new THREE.Scene();
	const camera = new THREE.PerspectiveCamera(
		75,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	let pixelRatio = window.devicePixelRatio;
	let AA = true;
	if (pixelRatio > 1) {
		AA = false;
	}
	const renderer = new THREE.WebGLRenderer({
		canvas: document.querySelector("#canvas") as HTMLCanvasElement,
		antialias: AA,
		powerPreference: "high-performance",
	});
	document.body.appendChild(VRButton.createButton(renderer));
	renderer.xr.enabled = true;

	scene.background = new THREE.Color(0xffffff);
	camera.position.setZ(settings.boxSize + 15);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	const controls = new OrbitControls(camera, renderer.domElement);
	controls.update();
	// const boids = new Array<boid>();
	// for (let i = 0; i < settings.boidCount; i++) {
	// 	const bird = new boid(scene, settings);
	// 	boids.push(bird);
	// }
	return { scene, renderer, camera, boids: null };
}
