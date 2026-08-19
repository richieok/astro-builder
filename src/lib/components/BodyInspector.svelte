<script>
    import { bodiesStore } from "$lib/stores/bodies.svelte.js";

    const body = $derived(bodiesStore.selected);
</script>

<div class="inspector">
    {#if body}
        {#key body.id}
            <label>
                Name
                <input type="text" bind:value={body.name} />
            </label>
            <label>
                Mass
                <input type="number" min="0" step="any" bind:value={body.mass} />
            </label>
            <fieldset>
                <legend>Position</legend>
                <label>
                    X
                    <input type="number" step="0.1" bind:value={body.position.x} />
                </label>
                <label>
                    Y
                    <input type="number" step="0.1" bind:value={body.position.y} />
                </label>
                <label>
                    Z
                    <input type="number" step="0.1" bind:value={body.position.z} />
                </label>
            </fieldset>
            <fieldset>
                <legend>Velocity</legend>
                <label>
                    X
                    <input type="number" step="0.1" bind:value={body.velocity.x} />
                </label>
                <label>
                    Y
                    <input type="number" step="0.1" bind:value={body.velocity.y} />
                </label>
                <label>
                    Z
                    <input type="number" step="0.1" bind:value={body.velocity.z} />
                </label>
            </fieldset>
            <label>
                Radius
                <input type="number" min="0.1" step="0.1" bind:value={body.radius} />
            </label>
            <label class="slider">
                <input type="range" min="0.1" max="5" step="0.1" bind:value={body.radius} />
            </label>
            <label>
                Color
                <input type="color" bind:value={body.color} />
            </label>
            <button class="delete" onclick={() => bodiesStore.remove(body.id)}>
                Delete body
            </button>
        {/key}
    {:else}
        <p class="hint">Select a body</p>
    {/if}
</div>

<style>
    .inspector {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding: 1rem 1.25rem;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        border-radius: 0.5rem;
        font: 0.875rem/1.2 system-ui, sans-serif;
        backdrop-filter: blur(4px);
    }
    .hint {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
    }
    label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        white-space: nowrap;
    }
    input[type="text"],
    input[type="number"] {
        width: 6rem;
        padding: 0.2rem 0.35rem;
        background: rgba(255, 255, 255, 0.1);
        color: inherit;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 0.25rem;
        font: inherit;
    }
    input[type="color"] {
        width: 3rem;
        height: 1.5rem;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 0.25rem;
        background: none;
        cursor: pointer;
    }
    .slider input {
        width: 100%;
    }
    fieldset {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        margin: 0;
        padding: 0.5rem 0.6rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.25rem;
    }
    legend {
        padding: 0 0.25rem;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.75rem;
    }
    .delete {
        margin-top: 0.25rem;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 80, 80, 0.2);
        color: inherit;
        border: 1px solid rgba(255, 120, 120, 0.4);
        border-radius: 0.25rem;
        font: inherit;
        cursor: pointer;
    }
    .delete:hover {
        background: rgba(255, 80, 80, 0.35);
    }
</style>
