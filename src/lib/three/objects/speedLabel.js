import { CanvasTexture, Sprite, SpriteMaterial } from 'three';

const CANVAS_WIDTH = 160;
const CANVAS_HEIGHT = 64;
const TEXT_COLOR = '#ffcc44';

export const LABEL_ASPECT = CANVAS_WIDTH / CANVAS_HEIGHT;

export function createSpeedLabel() {
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

export function setSpeedLabelSize(sprite, height) {
	sprite.scale.set(height * LABEL_ASPECT, height, 1);
}

export function updateSpeedLabel(sprite, text) {
	const { ctx, canvas, texture } = sprite.userData;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.font = 'bold 36px sans-serif';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
	ctx.shadowBlur = 6;
	ctx.fillStyle = TEXT_COLOR;
	ctx.fillText(text, canvas.width / 2, canvas.height / 2);
	texture.needsUpdate = true;
}

export function disposeSpeedLabel(sprite) {
	sprite.userData.texture.dispose();
	sprite.material.dispose();
}
