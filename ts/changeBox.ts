import * as THREE from "three";
//function to create a new box on setting change
export default function changeBox(
	boxgeo: THREE.BoxGeometry,
	boxmat: THREE.MeshBasicMaterial,
	box: THREE.Mesh,
	scene: THREE.Scene,
	settings: any
): [
	THREE.BoxGeometry,
	THREE.MeshBasicMaterial,
	THREE.Mesh<any, THREE.MeshBasicMaterial>
] {
	boxgeo.dispose();
	//create a new geometry with the new size
	const newGeo = new THREE.BoxGeometry(
		settings.boxSize,
		settings.boxSize,
		settings.boxSize
	);
	const newMesh = new THREE.Mesh(newGeo, boxmat);
	//remove the old box
	scene.remove(box);
	//add the new box
	scene.add(newMesh);
	//return the new box constants
	return [newGeo, boxmat, newMesh];
}
