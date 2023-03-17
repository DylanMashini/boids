import * as THREE from "three";
import Stats from "stats.js";
import setup from "./setup";
import changeBox from "./changeBox";
import initWorkers from "./initWorkers";
import Boids from "./boids";

// Check if webworkers and SharedBufferArray are supported
if (typeof SharedArrayBuffer == "undefined") {
	// if they aren't than send to the version that doesn't use SharedArrayBuffer
	window.location.href = "https://boids.dylanmashini.com/no-workers";
}

let maxThreads = window.navigator.hardwareConcurrency || 4;
let sharedMemory: SharedArrayBuffer;
let floatThreads: Float64Array;
let meta: Int32Array; //[0] is for Atomic Synchronization
let threadCount: Number;

//set default settings
let settings = {
	maxSpeed: 0.5,
	maxForce: 0.03,
	neighbohoodSize: 10,
	boidCount: 1000,
	boxSize: 200,
	randomHome: true,
	colorSeperation: false,
	sphere: false,
	highlight: false,
};

const instancedMesh = new THREE.InstancedMesh(
	new THREE.ConeBufferGeometry(0.5, 2, 32, 32),
	new THREE.MeshBasicMaterial({ color: 0x8ce68c }),
	1000
);

//get html form
const form = document.querySelector("form") as HTMLFormElement;

//setup inital form values
form["maxSpeed"].value = String(settings["maxSpeed"]);
form["maxForce"].value = String(settings["maxForce"]);
form["neighbohoodSize"].value = String(settings["neighbohoodSize"]);
form["boidCount"].value = String(settings.boidCount);
form["boxSize"].value = String(settings.boxSize);
form["randomHome"].checked = settings.randomHome;
form["color"].checked = settings.colorSeperation;
form["sphere"].checked = settings.sphere;

//add callback for if the button on the form is pressed
form.addEventListener("submit", e => {
	//prevent site from reloading
	e.preventDefault();

	let restartWebWorker = false;
	if (
		settings["boidCount"] != Number(form["boidCount"].value) ||
		settings["maxSpeed"] != Number(form["maxSpeed"].value) ||
		settings["maxForce"] != Number(form["maxForce"].value) ||
		settings["neighbohoodSize"] != Number(form["neighbohoodSize"].value) ||
		settings["colorSeperation"] != form["colorSeperation"].value
	) {
		restartWebWorker = true;
	}
	//check if boidCount has changed
	if (settings["boidCount"] != Number(form["boidCount"].value)) {
		//need to add or remove boids

		//check if we need to remove or add boids
		if (settings["boidCount"] > Number(form["boidCount"].value)) {
			//need to remove boids

			const boidsToRemove =
				settings["boidCount"] - Number(form["boidCount"].value);
			if (boidsToRemove <= 0) {
				//user put in negative ammount of boids
				console.error("Cant have negative boids");
			} else {
				instancedBoids.dispose();
				let newSettings = { ...settings };
				newSettings["boidCount"] = Number(form["boidCount"].value);
				instancedBoids = new Boids(scene, newSettings);
				restartWebWorker = true;
			}
		} else {
			//need to add boids

			//calculate the ammount of boids needed
			const boidsToAdd = Number(form["boidCount"].value);
			-settings["boidCount"];
			if (boidsToAdd <= 0) {
				//user put in negative number
				console.error("Can't have negative boids");
			} else {
				let newSettings = { ...settings };
				newSettings["boidCount"] = Number(form["boidCount"].value);
				instancedBoids.dispose();
				instancedBoids = new Boids(scene, newSettings);
				restartWebWorker = true;
			}
		}
	}
	//check if box size changed
	if (settings["boxSize"] != Number(form["boxSize"].value)) {
		//box size changed

		//change box size setting first
		settings["boxSize"] = Number(form["boxSize"].value);

		//than run function that changes the box displayed
		[boxgeo, boxmat, box] = changeBox(boxgeo, boxmat, box, scene, settings);
	}

	if (settings["sphere"] != form["sphere"].checked) {
		//change shape to sphere

		if (form["sphere"].checked) {
			scene.remove(box);
			boxgeo.dispose();
			boxgeo = new THREE.SphereBufferGeometry(settings.boxSize, 32, 32);
			box = new THREE.Mesh(boxgeo, boxmat);
			scene.add(box);

			document.getElementById("containerLabel")!.innerHTML =
				"Sphere Size";
		} else {
			changeBox(boxgeo, boxmat, box, scene, settings);

			document.getElementById("containerLabel")!.innerHTML = "Box Size";
		}

		settings["sphere"] = form["sphere"].checked;
	}
	//update all other settings

	settings["maxSpeed"] = Number(form["maxSpeed"].value);

	settings["maxForce"] = Number(form["maxForce"].value);

	settings["neighbohoodSize"] = Number(form["neighbohoodSize"].value);

	settings["randomHome"] = form["randomHome"].checked;

	settings["colorSeperation"] = form["color"].checked;

	settings["boidCount"] = Number(form["boidCount"].value);
	if (restartWebWorker) {
		startThreads(settings["boidCount"], maxThreads);
	}
});

const { scene, renderer, camera, boids } = setup(settings);

let instancedBoids = new Boids(scene, settings);

let boxgeo: any = new THREE.BoxBufferGeometry(
	settings.boxSize,
	settings.boxSize,
	settings.boxSize
);
let boxmat = new THREE.MeshBasicMaterial({ color: 0x000000 });
boxmat.transparent = true;
boxmat.opacity = 0.1;
let box = new THREE.Mesh(boxgeo, boxmat);

scene.add(box);

//function to create WebWorkers
const startThreads = (boidCount: number, maxThreads: number) => {
	//check if threads exist
	if (floatThreads) {
		executionPaused = true;
		//set them to float64Array of 69s
		meta[0] = 69;
		meta[1] = 69;
		sharedMemory = undefined;
		floatThreads = undefined;
		meta = undefined;
	}

	const workerValues = initWorkers(boidCount, settings);
	sharedMemory = workerValues.buffer;
	threadCount = workerValues.count;

	floatThreads = new Float64Array(
		sharedMemory,
		0,
		(sharedMemory.byteLength - 8) / 8
	); //-8 to remove the 8 byte metadata
	meta = new Int32Array(sharedMemory, sharedMemory.byteLength - 8);
	for (let i = 0; i < boidCount; i++) {
		floatThreads[i * 9] = instancedBoids.startingPositions[i].position.x;
		floatThreads[i * 9 + 1] = instancedBoids.startingPositions[i].position.y;
		floatThreads[i * 9 + 2] = instancedBoids.startingPositions[i].position.z;
	}
	executionPaused = false;
};
let executionPaused = false;
//animation loop
// @ts-ignore
startThreads(settings.boidCount, maxThreads);
//create previous tick val
let stats = new Stats();
document.body.appendChild(stats.dom);
let newTick = 0;
// while (Atomics.load(meta, 1) != threadCount) {
// 	Atomics.wait(meta, 1, Atomics.load(meta, 1));
// }
scene.add(instancedMesh);
let dummy = new THREE.Object3D();
renderer.setAnimationLoop(function () {
	if (!executionPaused) {
		if (newTick > 1000) {
			newTick = 0;
		}
		newTick++;
		// track fps with stats module
		stats.begin();
		// notify all threads to start frame using Atomics
		Atomics.store(meta, 0, newTick);
		Atomics.notify(meta, 0);
		instancedBoids.updateBoids(floatThreads);
		renderer.render(scene, camera);
		stats.end();
	}
});
