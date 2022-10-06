// @ts-ignore
import createWorker from "./worker.ts?worker";

export default function init(boid_count: number, settings: object) {
  let concurency = window.navigator.hardwareConcurrency || 4;
  if (boid_count / concurency < 100) {
    concurency = Math.floor(boid_count / 100);
  }
  let buffer = new SharedArrayBuffer(boid_count * 8 * 9 + 8);
  let jobsPerWorker = Math.floor(boid_count / concurency);
  let extraJobs = boid_count % concurency;
  let lastIndex = 0;
  for (let i = 0; i < concurency; i++) {
    let threadBoids: number;
    if (extraJobs > 0) {
      threadBoids = jobsPerWorker + 1;
      extraJobs -= 1;
    } else {
      threadBoids = jobsPerWorker;
    }
    const worker: Worker = createWorker();

    worker.postMessage(buffer);
    worker.postMessage(settings);
    worker.postMessage({
      index_start: lastIndex,
      index_end: lastIndex + threadBoids,
      boid_count,
      numThreads: concurency,
    });
    lastIndex += threadBoids;
  }
  return { buffer, count: concurency };
}
