import { error, json } from '@sveltejs/kit';
import { isValidName, readProject } from '$lib/server/projects.js';

export async function GET({ params }) {
	if (!isValidName(params.name)) error(400, 'Invalid project name');
	try {
		const data = await readProject(params.name);
		return json(data);
	} catch (err) {
		if (err.code === 'ENOENT') error(404, 'Project not found');
		throw err;
	}
}
