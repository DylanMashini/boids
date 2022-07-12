use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Clone, Debug, Copy)]
#[wasm_bindgen]
pub struct Vector3 {
    pub x: f64,
    pub y: f64,
    pub z: f64,
}

#[wasm_bindgen]
impl Vector3 {
    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64, z: f64) -> Vector3 {
        Vector3 { x: x, y: y, z: z }
    }
    pub fn distance_to(&self, v: &Vector3) -> f64 {
        return f64::sqrt(self.distance_to_squared(v));
    }
    pub fn distance_to_squared(&self, v: &Vector3) -> f64 {
        let dx = self.x - v.x;
        let dy = self.y - v.y;
        let dz = self.z - v.z;
        return dx * dx + dy * dy + dz * dz;
    }
    pub fn get_distance(a: &Vector3, b: &Vector3) -> f64 {
        return a.distance_to(b);
    }
    pub fn add(&mut self, v: &Vector3) {
        self.x += v.x;
        self.y += v.y;
        self.z += v.z;
    }
    pub fn add_scalar(&mut self, s: f64) {
        self.x += s;
        self.y += s;
        self.z += s;
    }
    pub fn sub(&mut self, v: &Vector3) {
        self.x -= v.x;
        self.y -= v.y;
        self.z -= v.z;
    }
    pub fn sub_scalar(&mut self, s: f64) {
        self.x -= s;
        self.y -= s;
        self.z -= s;
    }
    pub fn set(&mut self, x: f64, y: f64, z: f64) {
        self.x = x;
        self.y = y;
        self.z = z;
    }
    pub fn multiply(&mut self, v: &Vector3) {
        self.x *= v.x;
        self.y *= v.y;
        self.z *= v.z;
    }
    pub fn multiply_scalar(&mut self, s: f64) {
        self.x *= s;
        self.y *= s;
        self.z *= s;
    }
    pub fn divide(&mut self, v: &Vector3) {
        self.x /= v.x;
        self.y /= v.y;
        self.z /= v.z;
    }
    pub fn divide_scalar(&mut self, s: f64) {
        self.multiply_scalar(1.0 / s);
    }
    pub fn clamp(&mut self, min: Vector3, max: Vector3) {
        self.x = f64::max(min.x, f64::min(max.x, self.x));
        self.y = f64::max(min.y, f64::min(max.y, self.y));
        self.z = f64::max(min.z, f64::min(max.z, self.z));
    }
    pub fn clamp_length(&mut self, min_val: f64, max_val: f64) {
        let length = self.length();
        if length != 0.0 {
            self.divide_scalar(length);
            self.multiply_scalar(f64::max(min_val, f64::min(max_val, length)));
        } else {
            self.multiply_scalar(f64::max(min_val, f64::min(max_val, length)))
        }
    }
    pub fn length(&mut self) -> f64 {
        return (self.x * self.x + self.y * self.y + self.z * self.z).sqrt();
    }
    pub fn sub_vectors(&mut self, a: &Vector3, b: &Vector3) {
        self.x = a.x - b.x;
        self.y = a.y - b.y;
        self.z = a.z - b.z;
    }
    pub fn normalize(&mut self) {
        let len = self.length();
        if len != 0.0 {
            self.divide_scalar(len);
        }
    }
    pub fn set_length(&mut self, length: f64) {
        self.normalize();
        self.multiply_scalar(length);
    }
    pub fn copy(&mut self, v: Vector3) {
        self.x = v.x;
        self.y = v.y;
        self.z = v.z;
    }
    pub fn dot(&self, v: &Vector3) -> f64 {
        return self.x * v.x + self.y * v.y + self.z * v.z;
    }
}
