import * as THREE from 'three';

export function createCamera({ width, height, fov = 75, near = 0.1, far = 2000 } = {}) {
	const camera = new THREE.PerspectiveCamera(fov, width / height, near, far);
	camera.position.z = 2;
	return camera;
}
