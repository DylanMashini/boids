use wasm_bindgen::prelude::*;
extern crate console_error_panic_hook;
//import webworker and console from web_sys
use web_sys::console;
// import Vector3
#[path = "./Vector3.rs"]
pub mod vector3_module;
use vector3_module::Vector3;
// import Boid
#[path = "./Boid.rs"]
pub mod boid_module;
use boid_module::Boid;
#[macro_use]
extern crate serde_derive;
//use initilization function from initialize.rs
mod initialize;

#[derive(Clone)]
#[wasm_bindgen]
pub struct Settings {
    max_speed: f64,
    max_force: f64,
    neighbohood_size: f64,
    _color_seperation: bool,
    highlight: bool,
}
impl Settings {
    fn new(
        max_speed: f64,
        max_force: f64,
        neighbohood_size: f64,
        color_seperation: bool,
        highlight: bool,
    ) -> Settings {
        Settings {
            max_speed,
            max_force,
            neighbohood_size,
            _color_seperation: color_seperation,
            highlight,
        }
    }
}

#[wasm_bindgen]
pub fn animate(
    boids_obj: &[f64],
    min_index: u16,
    max_index: u16,
    max_speed: f64,
    max_force: f64,
    neighbohood_size: f64,
    color_seperation: bool,
    highlight: bool,
) -> Vec<f64> {
    console_error_panic_hook::set_once();
    //tempararily use default settings
    let settings = Settings::new(
        max_speed,
        max_force,
        neighbohood_size,
        color_seperation,
        highlight,
    );
    let boids: Vec<Boid> = Boid::new_from_f64_array(boids_obj); // Creates Vec<Boid> for all boids
    let assigned_boids = boids.clone()[min_index as usize..max_index as usize].to_vec(); //creates Vec<Boid> for boids in thread
    let mut near_boids: Vec<Boid> = vec![];
    let mut highlight_vectors: Vec<i16> = vec![];
    for (i, boid) in assigned_boids.iter().enumerate() {
        let mut seperation_sum = Vector3::new(0.0, 0.0, 0.0);
        let mut seperation_count = 0.0;
        let mut alignment_sum = Vector3::new(0.0, 0.0, 0.0);
        let mut alignment_count = 0.0;
        let mut cohesion_sum = Vector3::new(0.0, 0.0, 0.0);
        let mut cohesion_count = 0.0;
        let boid_vector = Vector3::new(boid.pos.x, boid.pos.y, boid.pos.z);
        if i == 0 && settings.highlight {
            highlight_vectors.push(i as i16);
        }
        for (i2, boid2) in boids.iter().enumerate() {
            if !(boid.pos.x == boid2.pos.x
                && boid.pos.y == boid2.pos.y
                && boid.pos.z == boid2.pos.z)
            {
                //boids are uniqe
                let distance = Vector3::get_distance(
                    &boid_vector,
                    &Vector3::new(boid2.pos.x, boid2.pos.y, boid2.pos.z),
                );
                if distance > 0.0 {
                    if distance < settings.neighbohood_size {
                        //highlight if nececary
                        if i == 0 && settings.highlight {
                            highlight_vectors.push(i2 as i16);
                        }
                        //set boid2_vector
                        let boid2_vector: Vector3 =
                            Vector3::new(boid2.pos.x, boid2.pos.y, boid2.pos.z);
                        let boid2_vel: Vector3 =
                            Vector3::new(boid2.vel.x, boid2.vel.y, boid2.vel.z);
                        //add boid to the allignmentsum
                        alignment_sum.add(&boid2_vel);
                        alignment_count += 1.0;
                        //add to cohesion sum
                        cohesion_sum.add(&boid2_vector);
                        cohesion_count += 1.0;
                        //do seperation rule
                        let mut vec_dir = Vector3::new(0.0, 0.0, 0.0);
                        vec_dir.sub_vectors(&boid_vector, &boid2_vector);
                        vec_dir.normalize();
                        vec_dir.divide_scalar(distance);
                        seperation_sum.add(&vec_dir);
                        seperation_count += 1.0;
                    }
                }
            }
        }
        //finalises alignmentSum Vector
        if alignment_count > 0.0 {
            alignment_sum.divide_scalar(alignment_count);
            alignment_sum.set_length(settings.max_speed);
            alignment_sum.sub(&boid.vel);
            alignment_sum.clamp_length(0.0, settings.max_force);
        } else {
            alignment_sum.set(0.0, 0.0, 0.0);
        }
        if cohesion_count > 0.0 {
            cohesion_sum.divide_scalar(cohesion_count);
            cohesion_sum.copy(boid.steer_to(&cohesion_sum, settings.max_speed, settings.max_force));
        }
        if seperation_count > 0.0 {
            seperation_sum.divide_scalar(seperation_count);
        }
        if seperation_sum.length() > 0.0 {
            seperation_sum.set_length(settings.max_speed);
            seperation_sum.sub(&boid.vel);
            seperation_sum.clamp_length(0.0, settings.max_force);
        }
        let mut final_boid = boid.clone();

        let mut acceleration = Vector3::new(0.0, 0.0, 0.0);
        acceleration.add(&seperation_sum);
        acceleration.add(&alignment_sum);
        acceleration.add(&cohesion_sum);

        //dynamic home based on js input
        let mut home_force = boid.steer_to(&boid.home, settings.max_speed, settings.max_force);
        //basic homing
        // let mut home_force = boid.steer_to(&Vector3::new(0.0, 0.0, 0.0), settings.maxSpeed, 0.03);
        home_force.multiply_scalar(1 as f64 / 7 as f64); // was 1.3
        acceleration.sub(&home_force);
        final_boid.vel.add(&acceleration);
        final_boid.vel.clamp_length(0.0, settings.max_speed);
        if highlight_vectors.contains(&(i as i16)) {
            final_boid.highlight = true;
        } else {
            final_boid.highlight = false
        }
        final_boid.pos.add(&final_boid.vel);
        near_boids.push(final_boid);
    }
    let final_boids = Boid::to_f64_arr(near_boids);
    if final_boids.len() as u32 != (max_index as u32 - min_index as u32) * 9 {
        console::log_1(
            &format!(
                "boids length not equal {} != {}",
                final_boids.len(),
                (max_index as u32 - min_index as u32) * 9,
            )
            .into(),
        );
        panic!("boids length not equal");
    }
    // return final_boids; //list of our assigned boids
    return final_boids;
}
