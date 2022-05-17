import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { VRButton } from "three/examples/jsm/webxr/VRButton";

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
		[boxgeo, boxmat, box] = changeBox(boxgeo, boxmat, box, scene);
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
			changeBox(boxgeo, boxmat, box, scene);

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

class boid extends THREE.Mesh {
	rot: THREE.Vector3;
	vel: THREE.Vector3;
	closeCount: number;
	home: THREE.Vector3;
	randomHome: boolean;
	group: number;
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
		this.closeCount = 0;
		this.home = this.updateHome();
		scene.add(this);
	}
	updateBoid() {
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
	//combine three rules into one method for performance
	calcBoid(boids: boid[]) {
		//set inital values for rules + counts to average out the boids
		const seperationSum = new THREE.Vector3(0, 0, 0);
		const allignmentSum = new THREE.Vector3(0, 0, 0);
		const cohesionSum = new THREE.Vector3(0, 0, 0);

		let seperationCount = 0;
		let allignmentCount = 0;
		let cohesionCount = 0;
		let boidArr: boid[] = [];
		if (!settings.colorSeperation) {
			boidArr = boids;
		} else {
			//fix performance
			boidArr = boids.filter(boid => boid.group == this.group);
		}
		for (let i = 0; i < boidArr.length; i++) {
			//get distance of boid at i from current boid
			const distance = this.position.distanceTo(boidArr[i].position);
			if (distance > 0) {
				//get sum of velocity of all neighbors in a given distance for allignment
				if (distance < settings.neighbohoodSize) {
					allignmentSum.add(boidArr[i].vel);
					allignmentCount++;
				}
				//sum up all POSITIONS of all neighbors in a given distance for cohesion
				if (distance < settings.neighbohoodSize) {
					cohesionSum.add(boidArr[i].position);
					cohesionCount++;
				}
				//do seperation rule
				if (distance < settings.neighbohoodSize) {
					const vecDir = new THREE.Vector3().subVectors(
						this.position,
						boidArr[i].position
					);
					vecDir.normalize();
					vecDir.divideScalar(distance);
					seperationSum.add(vecDir);
					seperationCount++;
				}
			}
		}
		//calculate alignment force
		if (allignmentCount > 0) {
			allignmentSum.divideScalar(allignmentCount);
			allignmentSum.setLength(settings.maxSpeed);
			allignmentSum.sub(this.vel);
			allignmentSum.clampLength(0, settings.maxForce);
		} else {
			allignmentSum.set(0, 0, 0);
		}
		//calculate cohesion force
		if (cohesionCount > 0) {
			cohesionSum.divideScalar(cohesionCount);
			cohesionSum.copy(
				this.steerTo(cohesionSum, settings.maxSpeed, settings.maxForce)
			);
		}
		//calculate seperation force
		if (seperationCount > 0) {
			seperationSum.divideScalar(seperationCount);
		}
		if (seperationSum.length() > 0) {
			seperationSum.setLength(settings.maxSpeed);
			seperationSum.sub(this.vel);
			seperationSum.clampLength(0, settings.maxForce);
		}
		return [allignmentSum, cohesionSum, seperationSum];
	}
	steerTo(target: any, maxSpeed: any, maxForce: any) {
		const targetVec = new THREE.Vector3().subVectors(target, this.position);

		targetVec.setLength(maxSpeed);

		const steer = new THREE.Vector3().subVectors(this.vel, targetVec);
		steer.clampLength(0, maxForce);
		return steer;
	}
	move(boids: boid[]) {
		//move rotation to be closer to avg rotation
		// this.geo.translate(0, 0.1, 0);
		//apply distance rule to velocity
		const maxSpeed = 0.5;

		const [allignment, seperation, cohesion] = this.calcBoid(boids);
		const acceleration = new THREE.Vector3(0, 0, 0);
		acceleration.add(seperation);
		acceleration.add(allignment);
		acceleration.add(cohesion);
		// if (this.position.length() > settings.boxSize - 30) {
		const homeForce = this.steerTo(this.home, maxSpeed, 0.03).divideScalar(
			7
		);
		acceleration.sub(homeForce);
		// }
		this.vel.add(acceleration).clampLength(0, maxSpeed);
		this.updateBoid();
	}
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
	75,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
const renderer = new THREE.WebGLRenderer({
	canvas: document.querySelector("#canvas") as HTMLCanvasElement,
});
document.body.appendChild(VRButton.createButton(renderer));
renderer.xr.enabled = true;

scene.background = new THREE.Color(0xffffff);
let boxgeo: any = new THREE.BoxGeometry(
	settings.boxSize,
	settings.boxSize,
	settings.boxSize
);
let boxmat = new THREE.MeshBasicMaterial({ color: 0x000000 });
boxmat.transparent = true;
boxmat.opacity = 0.1;
let box = new THREE.Mesh(boxgeo, boxmat);
//function to create a new box on setting change
const changeBox = (
	boxgeo: THREE.BoxGeometry,
	boxmat: THREE.MeshBasicMaterial,
	box: THREE.Mesh,
	scene: THREE.Scene
): [
	THREE.BoxGeometry,
	THREE.MeshBasicMaterial,
	THREE.Mesh<any, THREE.MeshBasicMaterial>
] => {
	boxgeo.dispose();
	//create a new geometry with the new size
	const newGeo = new THREE.BoxGeometry(
		settings.boxSize,
		settings.boxSize,
		settings.boxSize
	);
	const newMesh = new THREE.Mesh(newGeo, boxmat);
	//remove the old box
	scene.remove(box);
	//add the new box
	scene.add(newMesh);
	//return the new box constants
	return [newGeo, boxmat, newMesh];
};
scene.add(box);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(settings.boxSize + 15);
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

//initialize boids
const boids = new Array<boid>();
for (let i = 0; i < settings.boidCount; i++) {
	const bird = new boid(scene);
	boids.push(bird);
}

// const animate = () => {
// 	requestAnimationFrame(animate);
// 	renderer.render(scene, camera);
// 	boids.forEach(boid => {
// 		boid.move(boids);
// 	});
// };
// animate();
renderer.setAnimationLoop(function () {
	renderer.render(scene, camera);
	boids.forEach(boid => {
		boid.move(boids);
	});
});
