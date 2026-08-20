import * as THREE from 'three';
import { createBodyMesh, disposeBodyMesh } from './objects/bodyMesh.js';
import {
	createVelocityLabel,
	disposeVelocityLabel,
	setVelocityLabelSize,
	updateVelocityLabel
} from './objects/velocityLabel.js';

const SELECTED_EMISSIVE = 0x666666;
const ARROW_COLOR = 0xffcc44;
const MIN_SPEED = 1e-4;
const LABEL_GAP = 0.25; // world units above the body's surface
const LABEL_MIN_HEIGHT = 0.6;

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
		group.remove(entry.label);
		disposeBodyMesh(entry.mesh);
		entry.arrow.dispose();
		disposeVelocityLabel(entry.label);
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
					const label = createVelocityLabel();
					label.name = `${body.name} velocity readout`;
					group.add(mesh);
					group.add(arrow);
					group.add(label);
					entry = { mesh, arrow, label, lastVelocityText: null };
					entries.set(body.id, entry);
				}
				const { mesh, arrow, label } = entry;
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

				setVelocityLabelSize(label, Math.max(body.radius * 1.2, LABEL_MIN_HEIGHT));
				label.position.set(
					mesh.position.x,
					mesh.position.y + body.radius + LABEL_GAP + label.scale.y / 2,
					mesh.position.z
				);
				const components = [
					body.velocity.x.toFixed(2),
					body.velocity.y.toFixed(2),
					body.velocity.z.toFixed(2)
				];
				const velocityText = components.join('|');
				if (entry.lastVelocityText !== velocityText) {
					updateVelocityLabel(label, components);
					entry.lastVelocityText = velocityText;
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
