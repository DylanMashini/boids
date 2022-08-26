importScripts("./pkg/boids_wasm.js");
//@ts-ignore
const { animate } = wasm_bindgen;

let settings: any;
let sharedMemory: any;
let floatBuffer: Float64Array;
let metaBuffer: any;
let indexes: number[];
let boidsInfo: any;

const run = () => {
	//@ts-ignore
	wasm_bindgen("./pkg/boids_wasm_bg.wasm").then(() => {
		setInterval(() => {
			let values = animate(
				floatBuffer,
				boidsInfo.index_start,
				boidsInfo.index_end,
				settings.maxSpeed,
				settings.maxForce,
				settings.neighbohoodSize,
				settings.colorSeperation,
				settings.highlight
			);
			floatBuffer.set(values, boidsInfo.index_start * 9);
			// if (metaBuffer[0] < 100) {
			// 	metaBuffer[0]++;
			// } else {
			// 	metaBuffer[0] = 0;
			// } //not used anymore, may implement in future if needed
			if (metaBuffer[1] == 69) {
				console.log("Terminating WebWorker");
				close();
			}
		}, 20);
	});
};
self.addEventListener("message", function handleMessageFromMain(msg) {
	console.log("recived msg", msg);
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
		if (settings && boidsInfo) {
			run();
		}
	} else {
		//message is settings or info on portioned boids
		if (msg.data.index_start != undefined || msg.data.index_start != null) {
			//message is info on portioned boids
			boidsInfo = msg.data;
			if (sharedMemory && settings) {
				run();
			}
		} else {
			settings = msg.data;
			if (sharedMemory && boidsInfo) {
				run();
			}
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
