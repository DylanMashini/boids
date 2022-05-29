//declare startup function that spawns webworker
#[wasm_bindgen]
pub fn initialize(
    boid_count: i16,
    settings: &JsValue,
    hardware_concurrency_max: f64,
) -> js_sys::SharedArrayBuffer {
    console_error_panic_hook::set_once();
    let mut max_threads: f64 = hardware_concurrency_max; //redeclare as mutable var because we need to modify this to limit it to 100 boids a thread
    //min of 100 boids per thread
    if (boid_count) / (max_threads as i16) < 100 {
        //goal is to have <=100 boids per thread
        max_threads = (((boid_count) as f32 / 100.0) as i16) as f64; //using as i16 rounds number down
        if max_threads == 0.0 {
            //make sure we aren't creating 0 threads
            max_threads = 1.0;
        }
    }
    let mut count = 0; //used to iterate through all threads
    let mut workers: Vec<Worker> = vec![];
    let buffer: js_sys::SharedArrayBuffer =
        js_sys::SharedArrayBuffer::new((boid_count as u32 * 8 * 9) + 4); //creates buffer with len of boid_count floatArr + 4 bytes for metadata
    let jobs_per_worker = (boid_count) as i16 / max_threads as i16; // does not include boids that don't evenly divide
    let mut extra_jobs = (boid_count) as i16 % max_threads as i16; //less than max_threads
    let mut last_index = 0;
    while max_threads > count as f64 {
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
    return buffer;
}

