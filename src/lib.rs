use wasm_bindgen::prelude::*;
extern crate web_sys;
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

#[derive(Clone)]
#[wasm_bindgen]
pub struct Settings {
    maxSpeed: f64,
    maxForce: f64,
    neighbohoodSize: f64,
    colorSeperation: bool,
    highlight: bool,
}
impl Settings {
    fn new(
        maxSpeed: f64,
        maxForce: f64,
        neighbohoodSize: f64,
        colorSeperation: bool,
        highlight: bool,
    ) -> Settings {
        Settings {
            maxSpeed: maxSpeed,
            maxForce: maxForce,
            neighbohoodSize: neighbohoodSize,
            colorSeperation: colorSeperation,
            highlight: highlight,
        }
    }
}

#[wasm_bindgen]
pub fn animate(BoidsObj: &JsValue) -> JsValue {
    //tempararily use default settings
    let settings = Settings::new(0.5, 0.03, 20.0, false, true);
    //convert JsValue to Vec<Vector3>
    //this is vector of Vector3 of boid positions
    let Boids: Vec<Boid> = BoidsObj.into_serde().unwrap();
    let mut nearBoids: Vec<Boid> = vec![];
    let mut highlightVectors: Vec<i16> = vec![];

    for (i, boid) in Boids.iter().enumerate() {
        let mut vel = Vector3::new(0.0, 0.0, 0.0);
        let mut seperationSum = Vector3::new(0.0, 0.0, 0.0);
        let mut seperationCount = 0.0;
        let mut alignmentSum = Vector3::new(0.0, 0.0, 0.0);
        let mut alignmentCount = 0.0;
        let mut cohesionSum = Vector3::new(0.0, 0.0, 0.0);
        let mut cohesionCount = 0.0;
        let mut boidVector = Vector3::new(boid.pos.x, boid.pos.y, boid.pos.z);
        if i == 0 && settings.highlight {
            highlightVectors.push(i as i16);
        }
        for (i2, boid2) in Boids.iter().enumerate() {
            if !(boid.pos.x == boid2.pos.x
                && boid.pos.y == boid2.pos.y
                && boid.pos.z == boid2.pos.z)
            {
                //boids are uniqe
                let distance = Vector3::get_distance(
                    &boidVector,
                    &Vector3::new(boid2.pos.x, boid2.pos.y, boid2.pos.z),
                );
                if distance > 0.0 {
                    if distance < settings.neighbohoodSize {
                        //highlight if nececary
                        if (i == 0 && settings.highlight) {
                            highlightVectors.push(i2 as i16);
                        }
                        //set boid2Vector
                        let boid2Vector: Vector3 =
                            Vector3::new(boid2.pos.x, boid2.pos.y, boid2.pos.z);
                        let boid2Vel: Vector3 = Vector3::new(boid2.vel.x, boid2.vel.y, boid2.vel.z);
                        //add boid to the allignmentsum
                        alignmentSum.add(&boid2Vel);
                        alignmentCount += 1.0;
                        //add to cohesion sum
                        cohesionSum.add(&boid2Vector);
                        cohesionCount += 1.0;
                        //do seperation rule
                        let mut vecDir = Vector3::new(0.0, 0.0, 0.0);
                        vecDir.sub_vectors(&boidVector, &boid2Vector);
                        vecDir.normalize();
                        vecDir.divide_scalar(distance);
                        seperationSum.add(&vecDir);
                        seperationCount += 1.0;
                    }
                }
            }
        }
        //finalises alignmentSum Vector
        if alignmentCount > 0.0 {
            alignmentSum.divide_scalar(alignmentCount);
            alignmentSum.set_length(settings.maxSpeed);
            alignmentSum.sub(&boid.vel);
            alignmentSum.clamp_length(0.0, settings.maxForce);
        } else {
            alignmentSum.set(0.0, 0.0, 0.0);
        }
        if cohesionCount > 0.0 {
            cohesionSum.divide_scalar(cohesionCount);
            cohesionSum.copy(boid.steer_to(&cohesionSum, settings.maxSpeed, settings.maxForce));
        }
        if seperationCount > 0.0 {
            seperationSum.divide_scalar(seperationCount);
        }
        if seperationSum.length() > 0.0 {
            seperationSum.set_length(settings.maxSpeed);
            seperationSum.sub(&boid.vel);
            seperationSum.clamp_length(0.0, settings.maxForce);
        }
        let mut finalBoid = boid.clone();

        let mut acceleration = Vector3::new(0.0, 0.0, 0.0);
        acceleration.add(&seperationSum);
        acceleration.add(&alignmentSum);
        acceleration.add(&cohesionSum);

        //dynamic home based on js input
        let mut homeForce = boid.steer_to(&boid.home, settings.maxSpeed, settings.maxForce);
        //basic homing
        // let mut homeForce = boid.steer_to(&Vector3::new(0.0, 0.0, 0.0), settings.maxSpeed, 0.03);
        homeForce.multiply_scalar(1.3);
        acceleration.sub(&homeForce);
        finalBoid.vel.add(&acceleration);
        finalBoid.vel.clamp_length(0.0, settings.maxSpeed);
        if (highlightVectors.contains(&(i as i16))) {
            finalBoid.highlight = true;
        } else {
            finalBoid.highlight = false
        }
        nearBoids.push(finalBoid);
    }
    return JsValue::from_serde(&nearBoids).unwrap();
}
