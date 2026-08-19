import * as THREE from 'three';
import { createBodyMesh, disposeBodyMesh } from './objects/bodyMesh.js';

const SELECTED_EMISSIVE = 0x666666;
const ARROW_COLOR = 0xffcc44;
const MIN_SPEED = 1e-4;

const _velocity = new THREE.Vector3();

export function createBodiesView(scene) {
	const group = new THREE.Group();
	group.name = 'Bodies';
	scene.add(group);

	const entries = new Map();

	function removeEntry(id) {
		const entry = entries.get(id);
		if (!entry) return;
		group.remove(entry.mesh);
		group.remove(entry.arrow);
		disposeBodyMesh(entry.mesh);
		entry.arrow.dispose();
		entries.delete(id);
	}

	return {
		sync(bodies, selectedId) {
			const ids = new Set(bodies.map((b) => b.id));
			for (const id of [...entries.keys()]) {
				if (!ids.has(id)) removeEntry(id);
			}
			for (const body of bodies) {
				let entry = entries.get(body.id);
				if (!entry) {
					const mesh = createBodyMesh(body);
					const arrow = new THREE.ArrowHelper(
						new THREE.Vector3(1, 0, 0),
						new THREE.Vector3(),
						1,
						ARROW_COLOR
					);
					arrow.name = `${body.name} velocity`;
					group.add(mesh);
					group.add(arrow);
					entry = { mesh, arrow };
					entries.set(body.id, entry);
				}
				const { mesh, arrow } = entry;
				mesh.name = body.name;
				mesh.position.set(body.position.x, body.position.y, body.position.z);
				mesh.scale.setScalar(body.radius);
				mesh.material.color.set(body.color);
				mesh.material.emissive.set(body.id === selectedId ? SELECTED_EMISSIVE : 0x000000);

				_velocity.set(body.velocity.x, body.velocity.y, body.velocity.z);
				const speed = _velocity.length();
				if (speed > MIN_SPEED) {
					arrow.visible = true;
					arrow.position.copy(mesh.position);
					arrow.setDirection(_velocity.divideScalar(speed));
					// arrow starts at the surface, length scales with speed
					arrow.setLength(body.radius + speed, 0.2, 0.1);
				} else {
					arrow.visible = false;
				}
			}
		},
		getMesh(id) {
			return entries.get(id)?.mesh;
		},
		dispose() {
			for (const id of [...entries.keys()]) {
				removeEntry(id);
			}
			scene.remove(group);
		}
	};
}
