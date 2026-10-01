import * as THREE from 'three';
import { createBodyMesh, disposeBodyMesh } from './objects/bodyMesh.js';

const SELECTED_EMISSIVE = 0x666666;
const ARROW_COLOR = 0xffcc44;
// Matches the axes gizmo's X/Y/Z colors.
const AXIS_COLORS = [0xff4444, 0x44cc44, 0x4488ff];
const AXIS_DIRECTIONS = [
	new THREE.Vector3(1, 0, 0),
	new THREE.Vector3(0, 1, 0),
	new THREE.Vector3(0, 0, 1)
];
const MIN_SPEED = 1e-4;
// Cap how far a velocity arrow can grow past the body's surface, so a
// fast-moving body (e.g. after a mass increase elsewhere skews gravity)
// doesn't produce an arrow that dwarfs the scene.
const MAX_ARROW_LENGTH = 2;

const _velocity = new THREE.Vector3();
const _direction = new THREE.Vector3();
const _axisVector = new THREE.Vector3();

// Points arrow along vector, scaled+capped by its magnitude, or hides it
// when the magnitude is negligible. Shared by the velocity arrow and the
// three per-axis arrows, whose "vector" is that axis direction scaled by
// its velocity component.
function updateArrow(arrow, position, vector, radius, headLength, headWidth) {
	const magnitude = vector.length();
	if (magnitude > MIN_SPEED) {
		arrow.visible = true;
		arrow.position.copy(position);
		arrow.setDirection(_direction.copy(vector).divideScalar(magnitude));
		arrow.setLength(radius + Math.min(magnitude, MAX_ARROW_LENGTH), headLength, headWidth);
	} else {
		arrow.visible = false;
	}
}

export function createBodiesView(scene) {
	const group = new THREE.Group();
	group.name = 'Bodies';
	scene.add(group);

	const arrowsGroup = new THREE.Group();
	arrowsGroup.name = 'Velocity arrows';
	group.add(arrowsGroup);

	const axisArrowsGroup = new THREE.Group();
	axisArrowsGroup.name = 'Axis velocity arrows';
	group.add(axisArrowsGroup);

	const entries = new Map();

	function removeEntry(id) {
		const entry = entries.get(id);
		if (!entry) return;
		group.remove(entry.mesh);
		arrowsGroup.remove(entry.arrow);
		disposeBodyMesh(entry.mesh);
		entry.arrow.dispose();
		for (const axisArrow of entry.axisArrows) {
			axisArrowsGroup.remove(axisArrow);
			axisArrow.dispose();
		}
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
					const axisArrows = AXIS_DIRECTIONS.map((direction, i) => {
						const axisArrow = new THREE.ArrowHelper(
							direction,
							new THREE.Vector3(),
							1,
							AXIS_COLORS[i]
						);
						axisArrow.name = `${body.name} velocity ${'xyz'[i]}`;
						axisArrowsGroup.add(axisArrow);
						return axisArrow;
					});
					group.add(mesh);
					arrowsGroup.add(arrow);
					entry = { mesh, arrow, axisArrows };
					entries.set(body.id, entry);
				}
				const { mesh, arrow, axisArrows } = entry;
				mesh.name = body.name;
				mesh.position.set(body.position.x, body.position.y, body.position.z);
				mesh.scale.setScalar(body.radius);
				mesh.material.color.set(body.color);
				mesh.material.emissive.set(body.id === selectedId ? SELECTED_EMISSIVE : 0x000000);

				_velocity.set(body.velocity.x, body.velocity.y, body.velocity.z);
				// arrow starts at the surface, length scales with speed (capped)
				updateArrow(arrow, mesh.position, _velocity, body.radius, 0.2, 0.1);

				const components = [_velocity.x, _velocity.y, _velocity.z];
				for (let i = 0; i < 3; i++) {
					_axisVector.copy(AXIS_DIRECTIONS[i]).multiplyScalar(components[i]);
					updateArrow(axisArrows[i], mesh.position, _axisVector, body.radius, 0.15, 0.075);
				}
			}
		},
		getMesh(id) {
			return entries.get(id)?.mesh;
		},
		setVelocityArrowsVisible(visible) {
			arrowsGroup.visible = visible;
		},
		setAxisVelocityArrowsVisible(visible) {
			axisArrowsGroup.visible = visible;
		},
		dispose() {
			for (const id of [...entries.keys()]) {
				removeEntry(id);
			}
			scene.remove(group);
		}
	};
}
