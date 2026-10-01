import { G, SECONDS_PER_DAY } from './constants.js';

// Longest physics step in simulated seconds. A frame's worth of simulated
// time (delta * timeScale) is split into steps no longer than this, so a
// fast time scale doesn't make the integrator fly off.
const MAX_STEP = 300;
const MAX_STEPS_PER_FRAME = 2000;

// Pairwise Newtonian gravity over the bodies store, semi-implicit Euler,
// in SI units (m, kg, s). Mutates store body positions/velocities; the
// page's sync effect carries the result to the meshes.
export function createNBodySimulation(store, { softening = 1e3 } = {}) {
	let running = false;
	// simulated seconds per real second
	let timeScale = SECONDS_PER_DAY;
	let initial = [];

	function snapshotInitial() {
		initial = store.bodies.map((b) => ({
			id: b.id,
			position: { ...b.position },
			velocity: { ...b.velocity }
		}));
	}

	// Keep `initial` in sync with the store whenever it changes while the
	// simulation isn't running, so Reset always restores the setup the user
	// last configured. Physics only mutates the store while running, so
	// this effect ignores changes made in that state — otherwise Reset
	// would have nothing to undo a run back to.
	$effect.root(() => {
		$effect(() => {
			$state.snapshot(store.bodies);
			if (!running) snapshotInitial();
		});
	});

	return {
		get running() {
			return running;
		},
		setTimeScale(value) {
			timeScale = value;
		},
		start() {
			running = true;
		},
		pause() {
			running = false;
		},
		reset() {
			running = false;
			for (const saved of initial) {
				store.update(saved.id, {
					position: { ...saved.position },
					velocity: { ...saved.velocity }
				});
			}
		},
		update(delta) {
			if (!running) return;
			const simDelta = delta * timeScale;
			const steps = Math.min(MAX_STEPS_PER_FRAME, Math.max(1, Math.ceil(simDelta / MAX_STEP)));
			const dt = simDelta / steps;
			for (let n = 0; n < steps; n++) step(dt);
		}
	};

	function step(delta) {
		const bodies = store.bodies;
		const soft2 = softening * softening;
		for (let i = 0; i < bodies.length; i++) {
			const a = bodies[i];
			let ax = 0;
			let ay = 0;
			let az = 0;
			for (let j = 0; j < bodies.length; j++) {
				if (i === j) continue;
				const b = bodies[j];
				const dx = b.position.x - a.position.x;
				const dy = b.position.y - a.position.y;
				const dz = b.position.z - a.position.z;
				const r2 = dx * dx + dy * dy + dz * dz + soft2;
				const invR = 1 / Math.sqrt(r2);
				const s = (G * b.mass) * invR * invR * invR;
				ax += dx * s;
				ay += dy * s;
				az += dz * s;
			}
			a.velocity.x += ax * delta;
			a.velocity.y += ay * delta;
			a.velocity.z += az * delta;
		}
		for (const body of bodies) {
			body.position.x += body.velocity.x * delta;
			body.position.y += body.velocity.y * delta;
			body.position.z += body.velocity.z * delta;
		}
	}
}
