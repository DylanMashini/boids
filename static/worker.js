importScripts("./pkg/boids_wasm.js");
const { animate } = wasm_bindgen;

console.log("within webworker");

let settings = {
	maxSpeed: 0.5,
	maxForce: 0.03,
	neighbohoodSize: 20,
	boidCount: 1000,
	boxSize: 200,
	randomHome: true,
	colorSeperation: false,
	sphere: false,
	highlight: false,
};

self.addEventListener("message", function handleMessageFromMain(msg) {
	console.log("received message from main:", msg);

	let sharedMemory = msg.data;
	let floatBuffer = new Float64Array(sharedMemory, 0, settings.boidCount * 9);
	let intBuffer = new Int8Array(sharedMemory, floatBuffer.byteLength);
	wasm_bindgen("./pkg/boids_wasm_bg.wasm").then(() => {
		while (true) {
			let values = animate(
				floatBuffer,
				settings.maxSpeed,
				settings.maxForce,
				settings.neighbohoodSize,
				settings.colorSeperation,
				settings.highlight
			);
			floatBuffer.set(values);
			if (intBuffer[0] < 100) {
				intBuffer[0]++;
			} else {
				intBuffer[0] = 0;
			}
		}
		// console.log(
		// 	`x: ${floatBuffer[0]} y: ${floatBuffer[1]} z: ${floatBuffer[2]}`
		// );
	});
});

/*
f32ArrayBuffer structure:
[posx,posy,posz,velx,vely,velz,homex,homey,homez]
indexes 0-8 are for boid 0
indexes 9-17 are for boid 1
...
*/
