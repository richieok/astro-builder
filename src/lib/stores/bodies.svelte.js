import { browser } from '$app/environment';
import { G, EARTH_MASS, EARTH_RADIUS, MOON_DISTANCE } from '$lib/three/physics/constants.js';

const DEFAULT_COLOR = '#4f9cf0';
const STORAGE_KEY = 'astro-builder:model';

const UNITS = 'si';

// Models saved before the sim moved to SI units were in G=1 units. They map
// onto SI exactly (same orbits) by picking a length and mass unit and
// deriving the time unit that keeps G = 1: T = sqrt(L^3 / (G * M)).
const LEGACY_LENGTH = 1e9; // m
const LEGACY_MASS = 1e24; // kg
const LEGACY_SPEED = LEGACY_LENGTH / Math.sqrt(LEGACY_LENGTH ** 3 / (G * LEGACY_MASS)); // m/s

function migrateLegacy(model) {
	const scale = (v, k) => {
		v.x *= k;
		v.y *= k;
		v.z *= k;
	};
	for (const body of model.bodies) {
		body.mass *= LEGACY_MASS;
		body.radius *= LEGACY_LENGTH;
		scale(body.position, LEGACY_LENGTH);
		scale(body.velocity, LEGACY_SPEED);
	}
}

function normalizeModel(model) {
	if (!model || !Array.isArray(model.bodies)) return null;
	// migrate models saved before velocity existed
	for (const body of model.bodies) {
		body.velocity ??= { x: 0, y: 0, z: 0 };
	}
	if (model.units !== UNITS) {
		migrateLegacy(model);
		model.units = UNITS;
	}
	return model;
}

function loadSaved() {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		return normalizeModel(JSON.parse(raw));
	} catch {
		return null;
	}
}

function createBodiesStore() {
	const saved = loadSaved();

	let bodies = $state(saved?.bodies ?? []);
	let selectedId = $state(saved?.selectedId ?? null);
	const selected = $derived(bodies.find((b) => b.id === selectedId) ?? null);
	let counter = saved?.counter ?? 0;

	if (browser) {
		let pending = null;
		let saveTimer = null;
		$effect.root(() => {
			$effect(() => {
				// $state.snapshot reads every nested property, so any deep
				// change (position.x, color, ...) re-runs the save; the write
				// is debounced so the running simulation doesn't hit
				// localStorage every frame
				pending = JSON.stringify({
					units: UNITS,
					bodies: $state.snapshot(bodies),
					selectedId,
					counter
				});
				saveTimer ??= setTimeout(() => {
					saveTimer = null;
					try {
						localStorage.setItem(STORAGE_KEY, pending);
					} catch {
						// storage full or unavailable — keep the app usable
					}
				}, 300);
			});
		});
	}

	return {
		get bodies() {
			return bodies;
		},
		get selectedId() {
			return selectedId;
		},
		get selected() {
			return selected;
		},
		add(partial = {}) {
			counter += 1;
			const body = {
				id: crypto.randomUUID(),
				name: `Body ${counter}`,
				mass: EARTH_MASS,
				// offset new bodies so they don't stack invisibly at the origin
				position: { x: bodies.length * MOON_DISTANCE, y: 0, z: 0 },
				velocity: { x: 0, y: 0, z: 0 },
				radius: EARTH_RADIUS,
				color: DEFAULT_COLOR,
				...partial
			};
			bodies.push(body);
			selectedId = body.id;
			return body;
		},
		remove(id) {
			const index = bodies.findIndex((b) => b.id === id);
			if (index === -1) return;
			bodies.splice(index, 1);
			if (selectedId === id) selectedId = null;
		},
		update(id, patch) {
			const body = bodies.find((b) => b.id === id);
			if (body) Object.assign(body, patch);
		},
		select(id) {
			selectedId = id;
		},
		clear() {
			bodies = [];
			selectedId = null;
			counter = 0;
		},
		serialize() {
			return {
				units: UNITS,
				bodies: $state.snapshot(bodies),
				selectedId,
				counter
			};
		},
		load(data) {
			const model = normalizeModel(data);
			if (!model) throw new Error('Invalid project data');
			bodies = model.bodies;
			selectedId = model.selectedId ?? null;
			counter = model.counter ?? 0;
		}
	};
}

export const bodiesStore = createBodiesStore();
