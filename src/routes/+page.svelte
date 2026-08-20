<script>
    import { onMount } from "svelte";
    import { createWorld } from "$lib/three/world.js";
    import { createNBodySimulation } from "$lib/three/physics/nbody.js";
    import { bodiesStore } from "$lib/stores/bodies.svelte.js";
    import { overlaysStore } from "$lib/stores/overlays.svelte.js";
    import BodyList from "$lib/components/BodyList.svelte";
    import BodyInspector from "$lib/components/BodyInspector.svelte";
    import OverlayList from "$lib/components/OverlayList.svelte";

    let container;
    let world = $state(null);

    let listVisible = $state(true);
    let listTab = $state("bodies");
    let inspectorVisible = $state(true);

    let ambientLightVisible = $state(true);
    let hemisphereLightVisible = $state(false);
    let ambientIntensity = $state(1);

    const sim = createNBodySimulation(bodiesStore);
    let simRunning = $state(false);
    let gravityG = $state(1);

    onMount(() => {
        const w = createWorld(container);
        w.addUpdatable(sim);
        world = w;
        return w.dispose;
    });

    $effect(() => {
        sim.setG(gravityG);
    });

    function toggleSim() {
        if (simRunning) {
            sim.pause();
        } else {
            sim.start();
        }
        simRunning = sim.running;
    }

    function resetSim() {
        sim.reset();
        simRunning = false;
    }

    $effect(() => {
        if (!world) return;
        world.syncBodies($state.snapshot(bodiesStore.bodies), bodiesStore.selectedId);
    });
    $effect(() => {
        world?.setAmbientLightVisible(ambientLightVisible);
    });
    $effect(() => {
        world?.setHemisphereLightVisible(hemisphereLightVisible);
    });
    $effect(() => {
        world?.setAmbientIntensity(ambientIntensity);
    });
    $effect(() => {
        world?.setGridVisible(overlaysStore.grid);
    });
    $effect(() => {
        world?.setAxesGizmoVisible(overlaysStore.axesGizmo);
    });
    $effect(() => {
        world?.setVelocityArrowsVisible(overlaysStore.velocityArrows);
    });
    $effect(() => {
        world?.setAxisVelocityArrowsVisible(overlaysStore.axisVelocityArrows);
    });

    const viewKeys = { 1: "front", 3: "right", 7: "top" };
    function handleKeydown(event) {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
        if (event.key === " ") {
            event.preventDefault();
            toggleSim();
            return;
        }
        const view = viewKeys[event.key];
        if (view) world?.setView(view);
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="ui">
    <div class="viewer" bind:this={container}></div>

    <button
        class="toggle-tab list-tab"
        onclick={() => (listVisible = !listVisible)}
    >
        {listVisible ? "‹" : "›"} Bodies
    </button>

    {#if listVisible}
        <div class="list-panel">
            <div class="tab-bar">
                <button
                    class="tab"
                    class:active={listTab === "bodies"}
                    onclick={() => (listTab = "bodies")}
                >
                    Bodies
                </button>
                <button
                    class="tab"
                    class:active={listTab === "overlays"}
                    onclick={() => (listTab = "overlays")}
                >
                    Overlays
                </button>
            </div>
            {#if listTab === "bodies"}
                <BodyList />
            {:else}
                <div class="overlays-panel">
                    <OverlayList />
                </div>
            {/if}
        </div>
    {/if}

    <button
        class="toggle-tab inspector-tab"
        onclick={() => (inspectorVisible = !inspectorVisible)}
    >
        Inspector {inspectorVisible ? "›" : "‹"}
    </button>

    {#if inspectorVisible}
        <div class="inspector-panel">
            <div class="sim-panel">
                <div class="buttons">
                    <button onclick={toggleSim}>
                        {simRunning ? "Pause" : "Play"}
                    </button>
                    <button onclick={resetSim}>Reset</button>
                </div>
                <label class="slider">
                    Gravity G {gravityG.toFixed(1)}
                    <input type="range" min="0" max="5" step="0.1" bind:value={gravityG} />
                </label>
            </div>
            <BodyInspector />
            <div class="view-panel">
                <label>
                    <input type="checkbox" bind:checked={ambientLightVisible} />
                    Ambient light
                </label>
                <label>
                    <input type="checkbox" bind:checked={hemisphereLightVisible} />
                    Hemisphere light
                </label>
                <label class="slider">
                    Intensity
                    <input type="range" min="0" max="3" step="0.1" bind:value={ambientIntensity} />
                </label>
            </div>
        </div>
    {/if}
</div>

<style>
    .ui {
        position: relative;
        display: grid;
        grid-template-rows: 1rem auto 1rem;
        height: 100vh;
        padding: 0 1rem 0;
    }
    .viewer {
        grid-row-start: 2;
        grid-row-end: 3;
    }
    .toggle-tab {
        position: absolute;
        top: 1.5rem;
        z-index: 1;
        padding: 0.35rem 0.75rem;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 0.25rem;
        font: 0.8125rem/1.2 system-ui, sans-serif;
        cursor: pointer;
        backdrop-filter: blur(4px);
    }
    .toggle-tab:hover {
        background: rgba(0, 0, 0, 0.75);
    }
    .list-tab {
        left: 1.5rem;
    }
    .inspector-tab {
        right: 1.5rem;
    }
    .list-panel {
        position: absolute;
        top: 3.25rem;
        left: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 16rem;
        max-height: calc(100vh - 4.75rem);
        overflow-y: auto;
    }
    .tab-bar {
        display: flex;
        gap: 0.25rem;
        padding: 0.25rem;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 0.5rem;
        backdrop-filter: blur(4px);
    }
    .tab {
        flex: 1;
        padding: 0.3rem 0.5rem;
        background: none;
        color: rgba(255, 255, 255, 0.6);
        border: none;
        border-radius: 0.25rem;
        font: 0.8125rem/1.2 system-ui, sans-serif;
        cursor: pointer;
    }
    .tab:hover {
        color: #fff;
    }
    .tab.active {
        background: rgba(255, 255, 255, 0.2);
        color: #fff;
    }
    .overlays-panel {
        padding: 0.75rem;
        background: rgba(0, 0, 0, 0.6);
        color: #fff;
        border-radius: 0.5rem;
        font: 0.875rem/1.2 system-ui, sans-serif;
        backdrop-filter: blur(4px);
    }
    .inspector-panel {
        position: absolute;
        top: 3.25rem;
        right: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 16rem;
        max-height: calc(100vh - 4.75rem);
        overflow-y: auto;
    }
    .sim-panel,
    .view-panel {
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
    .sim-panel .buttons {
        display: flex;
        gap: 0.5rem;
    }
    .sim-panel button {
        flex: 1;
        padding: 0.25rem 0.5rem;
        background: rgba(255, 255, 255, 0.15);
        color: inherit;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 0.25rem;
        font: inherit;
        cursor: pointer;
    }
    .sim-panel button:hover {
        background: rgba(255, 255, 255, 0.3);
    }
    .sim-panel .slider,
    .view-panel .slider {
        flex-direction: column;
        align-items: stretch;
        gap: 0.25rem;
    }
    .sim-panel label,
    .view-panel label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
    }
</style>
