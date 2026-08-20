import {
	AxesHelper,
	CanvasTexture,
	OrthographicCamera,
	Scene,
	Sprite,
	SpriteMaterial,
	Vector2
} from 'three';

function createAxisLabel(text, color) {
	const canvas = document.createElement('canvas');
	canvas.width = 64;
	canvas.height = 64;
	const ctx = canvas.getContext('2d');
	ctx.font = 'bold 40px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = color;
	ctx.fillText(text, 32, 34);

	const texture = new CanvasTexture(canvas);
	const material = new SpriteMaterial({ map: texture, depthTest: false });
	const sprite = new Sprite(material);
	sprite.scale.setScalar(0.4);
	return sprite;
}

export function createAxesGizmo(camera, controls, { size = 100, padding = 10 } = {}) {
	const scene = new Scene();

	const axes = new AxesHelper(0.85);
	scene.add(axes);

	const labelX = createAxisLabel('X', '#ff4444');
	labelX.position.set(1.05, 0, 0);
	const labelY = createAxisLabel('Y', '#44cc44');
	labelY.position.set(0, 1.05, 0);
	const labelZ = createAxisLabel('Z', '#4488ff');
	labelZ.position.set(0, 0, 1.05);
	scene.add(labelX, labelY, labelZ);

	const frustum = 1.3;
	const gizmoCamera = new OrthographicCamera(-frustum, frustum, frustum, -frustum, 0.1, 10);

	const rendererSize = new Vector2();

	let visible = true;

	function render(renderer) {
		if (!visible) return;
		// Mirror the main camera's orientation around the controls target.
		gizmoCamera.position
			.copy(camera.position)
			.sub(controls.target)
			.normalize()
			.multiplyScalar(3);
		gizmoCamera.up.copy(camera.up);
		gizmoCamera.lookAt(scene.position);

		renderer.getSize(rendererSize);
		const prevAutoClear = renderer.autoClear;
		renderer.autoClear = false;
		renderer.clearDepth();
		renderer.setScissorTest(true);
		renderer.setScissor(padding, padding, size, size);
		renderer.setViewport(padding, padding, size, size);
		renderer.render(scene, gizmoCamera);
		renderer.setScissorTest(false);
		renderer.setViewport(0, 0, rendererSize.x, rendererSize.y);
		renderer.autoClear = prevAutoClear;
	}

	function dispose() {
		axes.dispose();
		for (const label of [labelX, labelY, labelZ]) {
			label.material.map.dispose();
			label.material.dispose();
		}
	}

	function setVisible(value) {
		visible = value;
	}

	return { render, dispose, setVisible };
}
