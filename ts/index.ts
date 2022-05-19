import * as THREE from "three";
import * as Stats from "stats.js";
import setup from "./setup";
import changeBox from "./changeBox";

const { startup } = wasm_bindgen;

let threads: SharedArrayBuffer[] = [];
let floatThreads: Float64Array[] = [];
let meta: Int16Array[] = []; //[0] is the frame, [1] is the number of boids
let sharedMemory = new SharedArrayBuffer(
	new Float64Array(9000).byteLength + new Int8Array(1).byteLength
);
let f64Array = new Float64Array(sharedMemory, 0, 9000);
let counter = new Int8Array(sharedMemory, f64Array.byteLength);
//list of colors to randomly choose
const colorList = [0x8ce68c, 0xabf1bc, 0xaee7f8, 0x87cdf6];

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
//get html form
const form = document.querySelector("form")!;
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
				for (let i = 0; i < boidsToRemove; i++) {
					//remove one item from array + dispose of all THREE.js classes
					boids[0].geometry.dispose();
					scene.remove(boids[0]);
					boids.shift();
				}
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
				//push a new boid to the array for each boidToAdd
				for (let i = 0; i < boidsToAdd; i++) {
					boids.push(new boid(scene));
				}
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
			boxgeo = new THREE.SphereGeometry(settings.boxSize, 32, 32);
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
});

export class boid extends THREE.Mesh {
	rot: THREE.Vector3;
	vel: THREE.Vector3;
	home: THREE.Vector3;
	randomHome: boolean;
	group: number;
	highlight: boolean;
	constructor(scene: THREE.Scene) {
		const geo = new THREE.ConeGeometry(0.5, 2, 32, 32);
		const group = Math.floor(Math.random() * colorList.length);
		const mat = new THREE.MeshBasicMaterial({
			color: colorList[group],
		});
		super(geo, mat);
		this.rot = new THREE.Vector3(
			(Math.PI / Math.random()) * 2,
			(Math.PI / Math.random()) * 2,
			(Math.PI / Math.random()) * 2
		);
		this.randomHome = false;
		this.group = group;
		this.position.x = this.randomPosition("x");
		this.position.y = this.randomPosition("y");
		this.position.z = this.randomPosition("z");
		this.rotation.set(this.rot.x, this.rot.y, this.rot.z);
		this.vel = new THREE.Vector3(0, 0, 0);
		this.home = this.updateHome();
		this.highlight = false;
		scene.add(this);
	}
	updateBoid() {
		if (this.highlight) {
			// @ts-ignore
			this.material.color.setHex(0xff0000);
		} else {
			// @ts-ignore
			this.material.color.setHex(colorList[this.group]);
		}
		if (this.vel.x == 0) {
			// console.log(this.vel);
		}
		//update the position with the velocity
		// this.position.add(this.vel);
		//set the rotation
		this.quaternion.setFromUnitVectors(
			new THREE.Vector3(0, 1, 0),
			this.vel.clone().normalize()
		);
		//update home position
		this.updateHome();
	}
	randomPosition(axis: String) {
		//create multiplier to allow negative values
		const neg = Math.random() > 0.5 ? -1 : 1;
		switch (axis) {
			case "x":
				return Math.random() * neg * (settings.boxSize / 2);
			case "y":
				return Math.random() * neg * (settings.boxSize / 2);
			case "z":
				return Math.random() * neg * (settings.boxSize / 2);
		}
		return 0;
	}
	updateHome() {
		//makes sure that home already exists
		if (this.home) {
			if (this.randomHome == settings.randomHome) {
				return this.home;
			}
		}
		const home = new THREE.Vector3(0, 0, 0);
		if (settings.randomHome) {
			this.randomHome = true;
			const neg = Math.random() > 0.5 ? -1 : 1;
			home.set(
				Math.random() * neg * (settings.boxSize / 4),
				Math.random() * neg * (settings.boxSize / 4),
				Math.random() * neg * (settings.boxSize / 4)
			);
		} else {
			this.randomHome = false;
		}
		return home;
	}
}

const { scene, renderer, camera, boids } = setup(settings);
//add boids to sharedBufferArray
for (let i = 0; i < settings.boidCount; i++) {
	f64Array[i * 9] = boids[i].position.x;
	f64Array[i * 9 + 1] = boids[i].position.y;
	f64Array[i * 9 + 2] = boids[i].position.z;
	f64Array[i * 9 + 3] = boids[i].vel.x;
	f64Array[i * 9 + 4] = boids[i].vel.y;
	f64Array[i * 9 + 5] = boids[i].vel.z;
	f64Array[i * 9 + 6] = boids[i].home.x;
	f64Array[i * 9 + 7] = boids[i].home.y;
	f64Array[i * 9 + 8] = boids[i].home.z;
}

let boxgeo: any = new THREE.BoxGeometry(
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
const startThreads = (boidCount: number) => {
	//check if threads exist
	if (floatThreads.length > 0) {
		//set them to float64Array of 69s
		for (let i = 0; i < meta.length; i++) {
			meta[i][0] = 69;
			meta[i][1] = 69;
		}
		threads = [];
		floatThreads = [];
		meta = [];
	}
	//create threads
	threads = startup(boidCount, settings);
	threads.forEach((thread, i) => {
		floatThreads.push(
			new Float64Array(thread, 0, (thread.byteLength - 4) / 8) //-4 to remove the 4 byte metadata
		);
		meta.push(new Int16Array(thread, thread.byteLength - 4));
	});
	console.log(meta);
};
//animation loop
wasm_bindgen("./pkg/boids_wasm_bg.wasm").then(() => {
	startThreads(settings.boidCount);
	//spawn webworker
	console.log(counter[0]);
	//create previous tick val
	let prevTick: number;
	let stats = new Stats();
	document.body.appendChild(stats.dom);
	let nextIndex = 0;
	floatThreads.forEach((buf, i) => {
		//buf is a float64Array of boid data
		let beginIndex = nextIndex;
		while (nextIndex - beginIndex < buf.length / 9) {
			let index = nextIndex - beginIndex;
			let boid = boids[nextIndex];
			buf[index * 9] = boid.position.x;
			buf[index * 9 + 1] = boid.position.y;
			buf[index * 9 + 2] = boid.position.z;
			buf[index * 9 + 6] = boid.home.x;
			buf[index * 9 + 7] = boid.home.y;
			buf[index * 9 + 8] = boid.home.z;
			nextIndex++;
		}
		renderer.render(scene, camera);
	});
	renderer.setAnimationLoop(function () {
		stats.begin();
		let nextIndex = 0;
		floatThreads.forEach((buf, i) => {
			//buf is a float64Array of boid data
			let beginIndex = nextIndex;
			while (nextIndex - beginIndex < buf.length / 9) {
				let index = nextIndex - beginIndex;
				let boid = boids[nextIndex];
				boid.position.x = buf[index * 9];
				boid.position.y = buf[index * 9 + 1];
				boid.position.z = buf[index * 9 + 2];
				boid.vel.x = buf[index * 9 + 3];
				boid.vel.y = buf[index * 9 + 4];
				boid.vel.z = buf[index * 9 + 5];
				boids[nextIndex].updateBoid();
				nextIndex++;
			}
			renderer.render(scene, camera);
		});
		stats.end();
	});
});
