import { env } from '$env/dynamic/private';
import fs from 'node:fs/promises';
import path from 'node:path';

// Outside Docker, ../projects (relative to the project root) lands next to
// this checkout, e.g. ~/Developer/astro-builder/projects. Inside Docker,
// PROJECTS_DIR is set explicitly and paired with a bind mount to the same
// host folder — see compose.yml / compose.prod.yml.
const PROJECTS_DIR = env.PROJECTS_DIR
	? path.resolve(env.PROJECTS_DIR)
	: path.resolve(process.cwd(), '..', 'projects');

const NAME_RE = /^[A-Za-z0-9 _-]{1,80}$/;

export function isValidName(name) {
	return typeof name === 'string' && NAME_RE.test(name.trim());
}

function fileFor(name) {
	return path.join(PROJECTS_DIR, `${name.trim()}.json`);
}

export async function listProjects() {
	await fs.mkdir(PROJECTS_DIR, { recursive: true });
	const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true });
	const projects = [];
	for (const entry of entries) {
		if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
		const stat = await fs.stat(path.join(PROJECTS_DIR, entry.name));
		projects.push({ name: entry.name.slice(0, -5), updatedAt: stat.mtime.toISOString() });
	}
	projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
	return projects;
}

export async function readProject(name) {
	if (!isValidName(name)) throw new Error('Invalid project name');
	const raw = await fs.readFile(fileFor(name), 'utf-8');
	return JSON.parse(raw);
}

export async function projectExists(name) {
	if (!isValidName(name)) return false;
	try {
		await fs.access(fileFor(name));
		return true;
	} catch {
		return false;
	}
}

export async function writeProject(name, data) {
	if (!isValidName(name)) throw new Error('Invalid project name');
	await fs.mkdir(PROJECTS_DIR, { recursive: true });
	await fs.writeFile(fileFor(name), JSON.stringify(data, null, 2), 'utf-8');
}
