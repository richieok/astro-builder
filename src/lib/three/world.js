import { Vector3 } from 'three';
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createControls } from './controls.js';
import { createHemisphereLight, createAmbientLight } from './lights.js';
import { createLoop } from './systems/loop.js';
import { createAxesGizmo } from './helpers/axesGizmo.js';
import { createScaleGrid } from './helpers/scaleGrid.js';
import { createBodiesView } from './bodiesView.js';

const VIEW_DIRECTIONS = {
	front: new Vector3(0, 0, 1),
	right: new Vector3(1, 0, 0),
	top: new Vector3(0, 1, 0)
};

export function createWorld(container) {
	const width = container.clientWidth;
	const height = container.clientHeight;

	const scene = createScene();
	const camera = createCamera({ width, height });
	camera.position.set(8, 6, 12);

	const renderer = createRenderer({ width, height });
	container.appendChild(renderer.domElement);

	const controls = createControls(camera, renderer.domElement);

	const grid = createScaleGrid();
	scene.add(grid.object);
	let gridSpacing = null;
	let onGridSpacing = null;

	const hemisphereLight = createHemisphereLight();
	hemisphereLight.visible = false;
	scene.add(hemisphereLight);

	const ambientLight = createAmbientLight();
	scene.add(ambientLight);

	const bodiesView = createBodiesView(scene);

	const loop = createLoop({ renderer, scene, camera, controls });

	// Clip planes follow the camera's distance from its target, so bodies
	// drawn at true scale (thousands of scene units across) don't get sliced
	// by a fixed far plane, and close-ups don't hit the near plane. The
	// near/far ratio stays at 1e6, which a 24-bit depth buffer handles.
	loop.updatables.push({
		update() {
			const distance = camera.position.distanceTo(controls.target);
			const near = distance * 1e-3;
			if (Math.abs(near - camera.near) > near * 0.01) {
				camera.near = near;
				camera.far = distance * 1e3;
				camera.updateProjectionMatrix();
			}
		}
	});

	// Moves the camera and orbit target along with the followed body. On a
	// new selection the target snaps onto the body; after that it only
	// tracks the body's movement, so a user pan stays as an offset.
	let followId = null;
	let followPrev = null;
	const _shift = new Vector3();
	loop.updatables.push({
		update() {
			const mesh = followId && bodiesView.getMesh(followId);
			if (!mesh) {
				followPrev = null;
				return;
			}
			if (followPrev) {
				_shift.copy(mesh.position).sub(followPrev);
			} else {
				followPrev = new Vector3();
				_shift.copy(mesh.position).sub(controls.target);
			}
			followPrev.copy(mesh.position);
			controls.target.add(_shift);
			camera.position.add(_shift);
		}
	});

	loop.updatables.push({
		update() {
			const spacing = grid.update(controls.target, camera.position.distanceTo(controls.target));
			if (spacing !== gridSpacing) {
				gridSpacing = spacing;
				onGridSpacing?.(spacing);
			}
		}
	});

	const axesGizmo = createAxesGizmo(camera, controls);
	loop.overlays.push(axesGizmo);

	loop.start();

	function onResize() {
		const w = container.clientWidth;
		const h = container.clientHeight;
		camera.aspect = w / h;
		camera.updateProjectionMatrix();
		renderer.setSize(w, h);
	}
	const resizeObserver = new ResizeObserver(onResize);
	resizeObserver.observe(container);

	function dispose() {
		loop.stop();
		resizeObserver.disconnect();
		axesGizmo.dispose();
		grid.dispose();
		bodiesView.dispose();
		controls.dispose();
		renderer.dispose();
		renderer.domElement.remove();
	}

	return {
		scene,
		camera,
		renderer,
		controls,
		dispose,
		// Called with the minor grid spacing (metres) whenever it changes.
		onGridSpacing(callback) {
			onGridSpacing = callback;
			if (gridSpacing !== null) callback(gridSpacing);
		},
		setGridScale(metresPerUnit) {
			grid.setScale(metresPerUnit);
		},
		syncBodies(bodies, selectedId, metresPerUnit) {
			bodiesView.sync(bodies, selectedId, metresPerUnit);
		},
		addUpdatable(updatable) {
			loop.updatables.push(updatable);
		},
		setView(name) {
			const direction = VIEW_DIRECTIONS[name];
			if (!direction) return;
			const distance = camera.position.distanceTo(controls.target);
			camera.position.copy(controls.target).addScaledVector(direction, distance);
			camera.lookAt(controls.target);
		},
		setFollow(id) {
			if (id !== followId) followPrev = null;
			followId = id;
		},
		setGridVisible(visible) {
			grid.object.visible = visible;
		},
		setAxesGizmoVisible(visible) {
			axesGizmo.setVisible(visible);
		},
		setVelocityArrowsVisible(visible) {
			bodiesView.setVelocityArrowsVisible(visible);
		},
		setAxisVelocityArrowsVisible(visible) {
			bodiesView.setAxisVelocityArrowsVisible(visible);
		},
		setAmbientLightVisible(visible) {
			ambientLight.visible = visible;
		},
		setHemisphereLightVisible(visible) {
			hemisphereLight.visible = visible;
		},
		setAmbientIntensity(value) {
			ambientLight.intensity = value;
		}
	};
}
