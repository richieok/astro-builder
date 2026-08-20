import { browser } from '$app/environment';

const STORAGE_KEY = 'astro-builder:overlays';

const DEFAULTS = {
	grid: true,
	axesGizmo: true,
	velocityArrows: true,
	axisVelocityArrows: true
};

function loadSaved() {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function createOverlaysStore() {
	const overlays = $state({ ...DEFAULTS, ...loadSaved() });

	if (browser) {
		$effect.root(() => {
			$effect(() => {
				try {
					localStorage.setItem(STORAGE_KEY, JSON.stringify($state.snapshot(overlays)));
				} catch {
					// storage full or unavailable — keep the app usable
				}
			});
		});
	}

	return overlays;
}

export const overlaysStore = createOverlaysStore();
