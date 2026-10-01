// Maps real (SI) quantities to scene units for display. Positions use one
// linear scale (metres per scene unit) so geometry stays true at any zoom;
// the physics always runs on the real values.

// Smallest drawn body radius in scene units, so bodies stay visible when
// the view is zoomed far out and their true size would be sub-pixel.
const MIN_RADIUS = 0.1;
const SPEED_REF = 10;
const SPEED_K = 0.5;

// Slider range for log10(metres per scene unit): ~1e-11 m (atomic) up to
// 1e13 m (past the outer solar system).
export const MIN_SCALE_EXP = -11;
export const MAX_SCALE_EXP = 13;
export const DEFAULT_SCALE_EXP = 7.6; // ~4e7 m/unit: Earth–Moon fits the view

export function toScenePosition(position, metresPerUnit, out) {
	return out.set(position.x, position.y, position.z).divideScalar(metresPerUnit);
}

export function toSceneRadius(metres, metresPerUnit) {
	return Math.max(MIN_RADIUS, metres / metresPerUnit);
}

// Arrow length encodes speed, not distance, so it is log-scaled
// independently of the view zoom.
export function toArrowLength(speed) {
	return SPEED_K * Math.log10(1 + speed / SPEED_REF);
}

const LENGTH_UNITS = [
	['pm', 1e-12],
	['nm', 1e-9],
	['µm', 1e-6],
	['mm', 1e-3],
	['m', 1],
	['km', 1e3],
	['AU', 1.495978707e11],
	['ly', 9.4607304725808e15]
];

export function formatLength(metres) {
	let [unit, size] = LENGTH_UNITS[0];
	for (const candidate of LENGTH_UNITS) {
		if (metres >= candidate[1]) [unit, size] = candidate;
	}
	const value = (metres / size).toLocaleString('en-US', { maximumSignificantDigits: 2 });
	return `${value} ${unit}`;
}
