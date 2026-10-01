import { Group, GridHelper } from 'three';

const DIVISIONS = 100;
const MINOR_COLOR = 0x222222;
const MAJOR_COLOR = 0x444444;
// Camera-to-target distance (scene units) at which a grid square is drawn
// 1–10 units wide; roughly the starting camera distance.
const REF_DISTANCE = 15;

// Picks the minor grid spacing: the power of ten (in metres) whose square
// is drawn 1–10 scene units wide at the reference camera distance. Scaling
// by camera distance keeps the on-screen square size in the same range
// whether you zoom with the slider (metresPerUnit) or the wheel (distance).
// `fade` (0–1) is how far through the decade we are — minor lines are
// faint just after a step (dense) and solid just before the next one.
export function gridSpacing(metresPerUnit, distance = REF_DISTANCE) {
	const effective = (metresPerUnit * distance) / REF_DISTANCE;
	const spacing = 10 ** (Math.floor(Math.log10(effective)) + 1);
	return {
		spacing,
		minorSize: spacing / metresPerUnit,
		fade: Math.log10(spacing / effective)
	};
}

function createLayer(color) {
	const grid = new GridHelper(DIVISIONS, DIVISIONS, color, color);
	grid.material.transparent = true;
	grid.material.depthWrite = false;
	return grid;
}

// Two layers of real-distance grid lines: minor (spacing) and major
// (10 x spacing). At a decade step the major lines become the minor ones,
// and new major lines land on existing ones, so there's no visible jump.
export function createScaleGrid() {
	const group = new Group();
	group.name = 'Grid';
	const minor = createLayer(MINOR_COLOR);
	const major = createLayer(MAJOR_COLOR);
	group.add(minor, major);

	let metresPerUnit = 1;

	return {
		object: group,
		setScale(value) {
			metresPerUnit = value;
		},
		// Rescales the layers for the current zoom and camera distance, and
		// keeps the finite grid under the camera target, snapped to the
		// major spacing so the lines stay on fixed world distances.
		// Returns the minor spacing in metres.
		update(target, distance) {
			const { spacing, minorSize, fade } = gridSpacing(metresPerUnit, distance);
			minor.scale.setScalar(minorSize);
			major.scale.setScalar(minorSize * 10);
			minor.material.opacity = fade;
			const step = minorSize * 10;
			group.position.set(Math.round(target.x / step) * step, 0, Math.round(target.z / step) * step);
			return spacing;
		},
		dispose() {
			for (const layer of [minor, major]) {
				layer.geometry.dispose();
				layer.material.dispose();
			}
		}
	};
}
