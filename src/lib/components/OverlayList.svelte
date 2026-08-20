<script>
    import { overlaysStore } from "$lib/stores/overlays.svelte.js";

    const toggles = [
        { key: "grid", label: "Grid" },
        { key: "axesGizmo", label: "Axes gizmo" },
        { key: "velocityArrows", label: "Velocity arrow" },
        { key: "axisVelocityArrows", label: "Axis velocity arrows" }
    ];
</script>

<div class="list">
    {#each toggles as { key, label } (key)}
        <label>
            <input type="checkbox" bind:checked={overlaysStore[key]} />
            {label}
        </label>
    {/each}
</div>

<style>
    .list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }
    label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.3rem 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        white-space: nowrap;
    }
    label:hover {
        background: rgba(255, 255, 255, 0.1);
    }
</style>
