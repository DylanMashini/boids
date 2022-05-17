import * as THREE from "three";
import * as Stats from "stats.js";
import setup from "./setup";
const wasm = import("../pkg/wasm_testing");
import changeBox from "./changeBox";
//list of colors to randomly choose
const colorList = [0x8ce68c, 0xabf1bc, 0xaee7f8, 0x87cdf6];

//set default settings
let settings = {
	maxSpeed: 0.5,
	maxForce: 0.03,
	neighbohoodSize: 6,
	boidCount: 1000,
	boxSize: 200,
	randomHome: true,
	colorSeperation: false,
	sphere: false,
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
			console.log(this.vel);
		}
		//update the position with the velocity
		this.position.add(this.vel);
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

//animation loop
wasm.then(module => {
	const stats = new Stats();
	stats.showPanel(0);
	document.body.appendChild(stats.dom);
	renderer.setAnimationLoop(function () {
		stats.begin();
		renderer.render(scene, camera);
		let updatedBoids = module.animate(
			boids.map(boid => {
				return {
					vel: { x: boid.vel.x, y: boid.vel.y, z: boid.vel.z },
					pos: {
						x: boid.position.x,
						y: boid.position.y,
						z: boid.position.z,
					},
					home: { x: 0, y: 0, z: 0 },
					quaternion: {
						_x: boid.quaternion.x,
						_y: boid.quaternion.y,
						_z: boid.quaternion.z,
						_w: boid.quaternion.w,
					},
					highlight: boid.highlight,
				};
			})
		);
		boids.forEach((boid, i) => {
			boids[i].vel.set(
				updatedBoids[i].vel.x,
				updatedBoids[i].vel.y,
				updatedBoids[i].vel.z
			);
			boids[i].highlight = updatedBoids[i].highlight;
			boids[i].updateBoid();
		});
		stats.end();
	});
});
