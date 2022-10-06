import init, { animate } from "rs";
let settings: any;
let sharedMemory: any;
let floatBuffer: Float64Array;
let metaBuffer: Int32Array;
let indexes: number[];
let boidsInfo: any;

const run = () => {
  //@ts-ignore
  init().then(() => {
    Atomics.add(metaBuffer, 1, 1);
    Atomics.notify(metaBuffer, 1);
    Atomics.wait(metaBuffer, 0, 0);
    let previousTick = 0;
    while (true) {
      if (Atomics.wait(metaBuffer, 0, previousTick) == "not-equal") {
        console.log("Behind by " + (metaBuffer[0] - previousTick) + " ticks");
      }
      previousTick = metaBuffer[0];
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
      if (metaBuffer[1] == 69) {
        close();
      }
    }
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
    metaBuffer = new Int32Array(sharedMemory, sharedMemory.byteLength - 8);
    console.log(metaBuffer);
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
