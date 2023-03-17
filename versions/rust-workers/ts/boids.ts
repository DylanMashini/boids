import * as THREE from "three";

export default class Boids extends THREE.InstancedMesh {
	boidCount: number;
	settings: any;
	dummy: THREE.Object3D;
	startingPositions: THREE.Object3D[];
	constructor(scene: THREE.Scene, settings: any) {
		super(
			new THREE.ConeBufferGeometry(0.5, 2, 32, 32),
			1000
		);
		this.boidCount = settings.boidCount;
		this.settings = settings;
		this.dummy = new THREE.Object3D();
		this.startingPositions = [];
		this.randomizeColors();
		this.randomPositions();
		scene.add(this);
	}
	randomizeColors() {
		const colorList = [0x8ce68c, 0xabf1bc, 0xaee7f8, 0x87cdf6];
		for (let i = 0; i < this.boidCount; i++) {
			const group = Math.floor(Math.random() * colorList.length);
			this.setColorAt(i, new THREE.Color(colorList[group]));
		}
		this.instanceColor.needsUpdate = true;
	}
	randomPositions() {
		for (let i = 0; i < this.boidCount; i++) {
			const neg = Math.random() > 0.5 ? -1 : 1;
			let pos = new THREE.Object3D();
			pos.position.x = Math.random() * (this.settings.boxSize / 2) * neg;
			pos.position.y = Math.random() * (this.settings.boxSize / 2) * neg;
			pos.position.z = Math.random() * (this.settings.boxSize / 2) * neg;
			pos.updateMatrix();
			this.setMatrixAt(i, pos.matrix);
			this.startingPositions.push(pos)
		}
			this.instanceMatrix.needsUpdate = true;
	}
	updateBoids(floatThreads: Float64Array) {
		for (let i = 0; i < this.count; i++) {
			this.dummy.position.x = floatThreads[i * 9];
			this.dummy.position.y = floatThreads[i * 9 + 1];
			this.dummy.position.z = floatThreads[i * 9 + 2];
			this.dummy.quaternion.setFromUnitVectors(
				new THREE.Vector3(0, 1, 0),
				new THREE.Vector3(
					floatThreads[i * 9 + 3],
					floatThreads[i * 9 + 4],
					floatThreads[i * 9 + 5]
				).normalize()
			);
			this.dummy.updateMatrix();
			this.setMatrixAt(i, this.dummy.matrix);
		}
		this.instanceMatrix.needsUpdate = true;
	}
}
