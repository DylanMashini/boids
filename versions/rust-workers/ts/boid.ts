import * as THREE from "three";

export class boid extends THREE.Mesh {
	rot: THREE.Vector3;
	vel: THREE.Vector3;
	home: THREE.Vector3;
	randomHome: boolean;
	group: number;
	highlight: boolean;
	settings: any;
	colorList: number[];
	constructor(scene: THREE.Scene, settings: any) {
		const colorList = [0x8ce68c, 0xabf1bc, 0xaee7f8, 0x87cdf6];
		const geo = new THREE.ConeGeometry(0.5, 2, 32, 32);
		const group = Math.floor(Math.random() * colorList.length);
		const mat = new THREE.MeshBasicMaterial({
			color: colorList[group],
		});
		super(geo, mat);
		this.settings = settings;
		this.colorList = colorList;
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
			this.material.color.setHex(this.colorList[this.group]);
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
				return Math.random() * neg * (this.settings.boxSize / 2);
			case "y":
				return Math.random() * neg * (this.settings.boxSize / 2);
			case "z":
				return Math.random() * neg * (this.settings.boxSize / 2);
		}
		return 0;
	}
	updateHome() {
		//makes sure that home already exists
		if (this.home) {
			if (this.randomHome == this.settings.randomHome) {
				return this.home;
			}
		}
		const home = new THREE.Vector3(0, 0, 0);
		if (this.settings.randomHome) {
			this.randomHome = true;
			const neg = Math.random() > 0.5 ? -1 : 1;
			home.set(
				Math.random() * neg * (this.settings.boxSize / 4),
				Math.random() * neg * (this.settings.boxSize / 4),
				Math.random() * neg * (this.settings.boxSize / 4)
			);
		} else {
			this.randomHome = false;
		}
		return home;
	}
}
