use wasm_bindgen::prelude::*;
use web_sys::Worker;

// Struct that gets passed with serde to tell worker what boids it needs to manage
#[derive(Serialize, Deserialize)]
struct ThreadScope {
    index_start: i16,
    index_end: i16,
    boid_count: i16,
}

//declare startup function that spawns webworker
#[wasm_bindgen]
pub fn initialize(
    boid_count: i16,
    settings: &JsValue,
    mut hardware_concurrency_max: f64,
) -> js_sys::SharedArrayBuffer {
    console_error_panic_hook::set_once();
    //if there is less than 100 boids per thread
    if (boid_count) / (hardware_concurrency_max as i16) < 100 {
        //set threads to max ammount with 100 boids per thread
        hardware_concurrency_max = (((boid_count) as f32 / 100.0) as i16) as f64; //using as i16 rounds number down
        // If there's less than 100 boids, create 1 thread
        if hardware_concurrency_max == 0.0 {
            hardware_concurrency_max = 1.0;
        }
    }
    let mut count = 0; //used to iterate through all threads
    let mut workers: Vec<Worker> = vec![];
    let buffer: js_sys::SharedArrayBuffer =
        js_sys::SharedArrayBuffer::new((boid_count as u32 * 8 * 9) + 4); //creates buffer with len of boid_count floatArr + 4 bytes for metadata
    let jobs_per_worker = (boid_count) as i16 / hardware_concurrency_max as i16; // does not include boids that don't evenly divide
    let mut extra_jobs = (boid_count) as i16 % hardware_concurrency_max as i16; //less than hardware_concurrency_max
    let mut last_index = 0;
    while hardware_concurrency_max > count as f64 {
        let thread_boids;
        if extra_jobs > 0 {
            thread_boids = jobs_per_worker + 1;
            extra_jobs -= 1;
        } else {
            thread_boids = jobs_per_worker;
        };
        workers.push(Worker::new("./worker.js").unwrap()); //creates thread and panics if thread creation fails
        workers[count as usize].post_message(&buffer).unwrap(); // sends thread buffer
        workers[count as usize].post_message(&settings).unwrap(); //sends thread settings object from main thread
                                                                
        let info = ThreadScope {
            index_start: last_index,
            index_end: last_index + thread_boids,
            boid_count,
        };
        workers[count as usize]
            .post_message(&JsValue::from_serde(&info).unwrap())
            .unwrap(); //sends json as post message with fields: indexStart, indexEnd, boidCount
        last_index += thread_boids;
        count += 1;
    }
    return buffer; // return the buffer with boid position
}

