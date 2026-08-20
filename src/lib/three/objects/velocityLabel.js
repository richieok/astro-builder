import { CanvasTexture, Sprite, SpriteMaterial } from 'three';

const CANVAS_WIDTH = 200;
const CANVAS_HEIGHT = 150;
const ROW_HEIGHT = 48;
// Matches the axes gizmo's X/Y/Z label colors.
const AXIS_COLORS = ['#ff4444', '#44cc44', '#4488ff'];

export const LABEL_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT;

export function createVelocityLabel() {
	const canvas = document.createElement('canvas');
	canvas.width = CANVAS_WIDTH;
	canvas.height = CANVAS_HEIGHT;

	const texture = new CanvasTexture(canvas);
	const material = new SpriteMaterial({ map: texture, depthTest: false, transparent: true });
	const sprite = new Sprite(material);
	sprite.renderOrder = 1;

	sprite.userData.ctx = canvas.getContext('2d');
	sprite.userData.canvas = canvas;
	sprite.userData.texture = texture;
	return sprite;
}

export function setVelocityLabelSize(sprite, height) {
	sprite.scale.set(height * LABEL_ASPECT, height, 1);
}

export function updateVelocityLabel(sprite, components) {
	const { ctx, canvas, texture } = sprite.userData;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.font = 'bold 34px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
	ctx.shadowBlur = 6;
	for (let i = 0; i < 3; i++) {
		ctx.fillStyle = AXIS_COLORS[i];
		ctx.fillText(components[i], canvas.width / 2, ROW_HEIGHT / 2 + i * ROW_HEIGHT + 3);
	}
	texture.needsUpdate = true;
}

export function disposeVelocityLabel(sprite) {
	sprite.userData.texture.dispose();
	sprite.material.dispose();
}
