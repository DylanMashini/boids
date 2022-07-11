use wasm_bindgen::prelude::*;
// import Vector3
use super::vector3_module::Vector3;

#[derive(Serialize, Deserialize, Clone, Debug, Copy)]
#[wasm_bindgen]

pub struct Boid {
    pub vel: Vector3,
    //position of boid as vector
    pub pos: Vector3,
    pub home: Vector3,
    pub highlight: bool,
}

#[wasm_bindgen]
impl Boid {
    #[wasm_bindgen(constructor)]
    pub fn new(x: Option<f64>, y: Option<f64>, z: Option<f64>, home: Option<Vector3>) -> Boid {
        let _x = x.unwrap_or(0.0);
        let _y = y.unwrap_or(0.0);
        let _z = z.unwrap_or(0.0);
        let _home = home.unwrap_or(Vector3::new(0.0, 0.0, 0.0));
        let empty_vector = Vector3::new(0.0, 0.0, 0.0);
        Boid {
            pos: Vector3 {
                x: _x,
                y: _y,
                z: _z,
            },
            vel: empty_vector,
            home: _home,
            highlight: false,
        }
    }
    pub fn steer_to(&self, target: &Vector3, max_speed: f64, max_force: f64) -> Vector3 {
        let mut target_vec = Vector3::new(0.0, 0.0, 0.0);
        target_vec.sub_vectors(target, &self.pos);
        target_vec.set_length(max_speed);
        let mut steer = Vector3::new(0.0, 0.0, 0.0);
        steer.sub_vectors(&self.vel, &target_vec);
        steer.clamp_length(0.0, max_force);
        return steer;
    }
}
