importScripts("./pkg/boids_wasm.js");
const { animate } = wasm_bindgen;

let settings;
let sharedMemory;
let floatBuffer;
let metaBuffer;
const run = () => {
	wasm_bindgen("./pkg/boids_wasm_bg.wasm").then(() => {
		setInterval(() => {
			let values = animate(
				floatBuffer,
				settings.maxSpeed,
				settings.maxForce,
				settings.neighbohoodSize,
				settings.colorSeperation,
				settings.highlight
			);
			floatBuffer.set(values);
			if (metaBuffer[0] < 100) {
				metaBuffer[0]++;
			} else {
				metaBuffer[0] = 0;
			}
			if (metaBuffer[1] == 69) {
				close();
			}
		}, 0);
	});
};
self.addEventListener("message", function handleMessageFromMain(msg) {
	//will recive two messages, first will be a settings, second will be a buffer
	if (msg.data.byteLength) {
		//message is buffer
		sharedMemory = msg.data;
		floatBuffer = new Float64Array(
			sharedMemory,
			0,
			(sharedMemory.byteLength - 4) / 8
		);
		metaBuffer = new Int16Array(sharedMemory, sharedMemory.byteLength - 4);
		metaBuffer[0] = floatBuffer.length / 9;
		if (settings) {
			run();
		}
	} else {
		//message is settings
		settings = msg.data;
		if (sharedMemory) {
			run();
		}
	}
});

/*
f32ArrayBuffer structure:
[posx,posy,posz,velx,vely,velz,homex,homey,homez]
indexes 0-8 are for boid 0
indexes 9-17 are for boid 1
...
*/
