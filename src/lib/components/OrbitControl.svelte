<script>
    import { bodiesStore } from "$lib/stores/bodies.svelte.js";
    import { G } from "$lib/three/physics/constants.js";

    const body = $derived(bodiesStore.selected);
    const others = $derived(bodiesStore.bodies.filter((b) => b.id !== body?.id));

    let targetId = $state(null);
    let lastBodyId = undefined;

    function defaultTargetId() {
        if (!body) return null;
        const heaviestOther = others.reduce((max, b) => (!max || b.mass > max.mass ? b : max), null);
        if (!heaviestOther) return null;
        // If the selected body is already the heaviest thing around, it's
        // not the one that should be doing the orbiting — default to None
        // rather than a physically backwards pick.
        if (body.mass >= heaviestOther.mass) return null;
        return heaviestOther.id;
    }

    $effect(() => {
        const currentBodyId = body?.id ?? null;
        if (currentBodyId !== lastBodyId) {
            // Selection changed — recompute the default from scratch.
            lastBodyId = currentBodyId;
            targetId = defaultTargetId();
            return;
        }
        // Same selection: only step in if the chosen target disappeared
        // (e.g. deleted), so we don't stomp on a deliberate manual pick.
        if (targetId !== null && !others.some((b) => b.id === targetId)) {
            targetId = defaultTargetId();
        }
    });

    const target = $derived(others.find((b) => b.id === targetId) ?? null);

    function setOrbitalVelocity() {
        if (!body || !target) return;

        const dx = body.position.x - target.position.x;
        const dy = body.position.y - target.position.y;
        const dz = body.position.z - target.position.z;
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (r === 0) return;

        // Tangent = radius vector crossed with world "up", giving a
        // direction perpendicular to the radius (falls back to "right"
        // when the radius is nearly parallel to up, where that cross
        // product degenerates to zero).
        let tx = -dz;
        let ty = 0;
        let tz = dx;
        let tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
        if (tLen < 1e-6) {
            tx = 0;
            ty = dz;
            tz = -dy;
            tLen = Math.sqrt(tx * tx + ty * ty + tz * tz);
        }
        tx /= tLen;
        ty /= tLen;
        tz /= tLen;

        // Circular-orbit speed for the two-body case: v = sqrt(G*M/r).
        const speed = Math.sqrt((G * target.mass) / r);

        bodiesStore.update(body.id, {
            velocity: {
                x: target.velocity.x + tx * speed,
                y: target.velocity.y + ty * speed,
                z: target.velocity.z + tz * speed
            }
        });
    }
</script>

{#if body && others.length > 0}
    <div class="orbit-panel">
        <label>
            Orbit around
            <select bind:value={targetId}>
                <option value={null}>None</option>
                {#each others as other (other.id)}
                    <option value={other.id}>{other.name}</option>
                {/each}
            </select>
        </label>
        <button onclick={setOrbitalVelocity} disabled={!target}>Set orbital velocity</button>
    </div>
{/if}

<style>
    .orbit-panel {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        padding: 0.75rem;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        border-radius: 0.5rem;
        font: 0.875rem/1.2 system-ui, sans-serif;
        backdrop-filter: blur(4px);
    }
    label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }
    select {
        flex: 1;
        min-width: 0;
        padding: 0.2rem 0.35rem;
        background: rgba(255, 255, 255, 0.1);
        color: inherit;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 0.25rem;
        font: inherit;
    }
    button {
        padding: 0.35rem 0.5rem;
        background: rgba(255, 255, 255, 0.15);
        color: inherit;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 0.25rem;
        font: inherit;
        cursor: pointer;
    }
    button:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    button:disabled {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.4);
        cursor: not-allowed;
    }
</style>
