// Pairwise Newtonian gravity over the bodies store, semi-implicit Euler.
// Mutates store body positions/velocities; the page's sync effect carries
// the result to the meshes.
export function createNBodySimulation(store, { G = 1, softening = 0.05 } = {}) {
	let running = false;
	let initial = null;

	function snapshotInitial() {
		initial = store.bodies.map((b) => ({
			id: b.id,
			position: { ...b.position },
			velocity: { ...b.velocity }
		}));
	}

	return {
		get running() {
			return running;
		},
		setG(value) {
			G = value;
		},
		start() {
			if (running) return;
			if (!initial) snapshotInitial();
			running = true;
		},
		pause() {
			running = false;
		},
		reset() {
			running = false;
			if (!initial) return;
			for (const saved of initial) {
				store.update(saved.id, {
					position: { ...saved.position },
					velocity: { ...saved.velocity }
				});
			}
			initial = null;
		},
		update(delta) {
			if (!running) return;
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
	};
}
