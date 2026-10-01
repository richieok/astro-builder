import * as THREE from 'three';
import { createStandardMaterial } from '../materials.js';

// Shared unit sphere; per-body size comes from mesh.scale so geometry never churns.
const unitSphere = new THREE.SphereGeometry(1, 32, 16);

export function createBodyMesh(body) {
	const mesh = new THREE.Mesh(unitSphere, createStandardMaterial({ color: body.color }));
	mesh.name = body.name;
	mesh.userData.bodyId = body.id;
	return mesh;
}

export function disposeBodyMesh(mesh) {
	mesh.material.dispose();
}
