import { json } from '@sveltejs/kit';
import { listProjects, writeProject, projectExists, isValidName } from '$lib/server/projects.js';

export async function GET() {
	const projects = await listProjects();
	return json(projects);
}

export async function POST({ request }) {
	const body = await request.json().catch(() => null);
	if (!body || !isValidName(body.name) || !Array.isArray(body.bodies)) {
		return json({ error: 'Invalid project' }, { status: 400 });
	}
	const { name, overwrite, ...model } = body;
	if (!overwrite && (await projectExists(name))) {
		return json({ error: 'exists' }, { status: 409 });
	}
	await writeProject(name, model);
	return json({ name: name.trim() });
}
