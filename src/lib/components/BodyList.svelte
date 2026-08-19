<script>
    import { bodiesStore } from "$lib/stores/bodies.svelte.js";
</script>

<div class="list">
    <button class="add" onclick={() => bodiesStore.add()}>＋ Add body</button>

    {#if bodiesStore.bodies.length === 0}
        <p class="empty">No bodies yet — add one</p>
    {:else}
        {#each bodiesStore.bodies as body (body.id)}
            <div
                class="row"
                class:selected={body.id === bodiesStore.selectedId}
                role="button"
                tabindex="0"
                onclick={() => bodiesStore.select(body.id)}
                onkeydown={(e) => e.key === "Enter" && bodiesStore.select(body.id)}
            >
                <span class="dot" style="background: {body.color}"></span>
                <span class="name">{body.name}</span>
                <span class="mass">{body.mass}</span>
                <button
                    class="delete"
                    aria-label="Delete {body.name}"
                    onclick={(e) => {
                        e.stopPropagation();
                        bodiesStore.remove(body.id);
                    }}
                >
                    ×
                </button>
            </div>
        {/each}
    {/if}
</div>

<style>
    .list {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.75rem;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        border-radius: 0.5rem;
        font: 0.875rem/1.2 system-ui, sans-serif;
        backdrop-filter: blur(4px);
    }
    .add {
        padding: 0.35rem 0.5rem;
        margin-bottom: 0.25rem;
        background: rgba(255, 255, 255, 0.15);
        color: inherit;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 0.25rem;
        font: inherit;
        cursor: pointer;
    }
    .add:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    .empty {
        margin: 0;
        padding: 0.3rem 0.5rem;
        color: rgba(255, 255, 255, 0.6);
    }
    .row {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.3rem 0.5rem;
        border-radius: 0.25rem;
        cursor: pointer;
        white-space: nowrap;
    }
    .row:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    .row.selected {
        background: rgba(255, 255, 255, 0.2);
    }
    .dot {
        width: 0.5rem;
        height: 0.5rem;
        flex: none;
        border-radius: 50%;
    }
    .name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .mass {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.75rem;
    }
    .delete {
        flex: none;
        width: 1.2rem;
        border: none;
        background: none;
        padding: 0;
        color: rgba(255, 255, 255, 0.5);
        font: inherit;
        cursor: pointer;
    }
    .delete:hover {
        color: #f66;
    }
</style>
