<script>
    import { bodiesStore } from "$lib/stores/bodies.svelte.js";
    import { projectStore } from "$lib/stores/project.svelte.js";

    let projects = $state([]);
    let openName = $state("");
    let status = $state("");
    let busy = $state(false);

    async function refreshProjects() {
        try {
            const res = await fetch("/api/projects");
            if (!res.ok) return;
            projects = await res.json();
        } catch {
            // offline or server unavailable — leave the list as-is
        }
    }

    refreshProjects();

    async function saveAs() {
        const name = window.prompt("Save project as:", projectStore.name ?? "");
        if (!name || !name.trim()) return;
        await doSave(name.trim());
    }

    async function save() {
        if (!projectStore.name) return saveAs();
        // Re-saving the project you already have open is the expected
        // meaning of "Save" — no need to reconfirm the overwrite.
        await doSave(projectStore.name, { overwrite: true });
    }

    async function doSave(name, { overwrite = false } = {}) {
        busy = true;
        status = "";
        try {
            const res = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, overwrite, ...bodiesStore.serialize() })
            });
            if (res.status === 409) {
                if (window.confirm(`A project named "${name}" already exists. Overwrite it?`)) {
                    await doSave(name, { overwrite: true });
                }
                return;
            }
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error ?? "Save failed");
            }
            const result = await res.json();
            projectStore.name = result.name;
            openName = result.name;
            status = `Saved "${result.name}"`;
            await refreshProjects();
        } catch (err) {
            status = err.message ?? "Save failed";
        } finally {
            busy = false;
        }
    }

    async function open() {
        if (!openName) return;
        busy = true;
        status = "";
        try {
            const res = await fetch(`/api/projects/${encodeURIComponent(openName)}`);
            if (!res.ok) throw new Error("Open failed");
            const data = await res.json();
            bodiesStore.load(data);
            projectStore.name = openName;
            status = `Opened "${openName}"`;
        } catch (err) {
            status = err.message ?? "Open failed";
        } finally {
            busy = false;
        }
    }
</script>

<div class="project-panel">
    <div class="buttons">
        <button onclick={save} disabled={busy}>Save</button>
        <button onclick={saveAs} disabled={busy}>Save As…</button>
    </div>
    <label>
        Open
        <select bind:value={openName} onchange={open} disabled={busy || projects.length === 0}>
            <option value="" disabled>
                {projects.length === 0 ? "No saved projects" : "Choose a project…"}
            </option>
            {#each projects as project (project.name)}
                <option value={project.name}>{project.name}</option>
            {/each}
        </select>
    </label>
    {#if status}
        <p class="status">{status}</p>
    {/if}
</div>

<style>
    .project-panel {
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
    .buttons {
        display: flex;
        gap: 0.5rem;
    }
    button {
        flex: 1;
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
    .status {
        margin: 0;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.75rem;
    }
</style>
