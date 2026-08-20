import { Vector3, GridHelper } from 'three';
import { createScene } from './scene.js';
import { createCamera } from './camera.js';
import { createRenderer } from './renderer.js';
import { createControls } from './controls.js';
import { createHemisphereLight, createAmbientLight } from './lights.js';
import { createLoop } from './systems/loop.js';
import { createAxesGizmo } from './helpers/axesGizmo.js';
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

	const grid = new GridHelper(50, 50, 0x444444, 0x222222);
	grid.name = 'Grid';
	scene.add(grid);

	const hemisphereLight = createHemisphereLight();
	hemisphereLight.visible = false;
	scene.add(hemisphereLight);

	const ambientLight = createAmbientLight();
	scene.add(ambientLight);

	const bodiesView = createBodiesView(scene);

	const loop = createLoop({ renderer, scene, camera, controls });

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
		syncBodies(bodies, selectedId) {
			bodiesView.sync(bodies, selectedId);
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
		setGridVisible(visible) {
			grid.visible = visible;
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
