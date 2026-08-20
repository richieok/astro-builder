function createProjectStore() {
	let name = $state(null);

	return {
		get name() {
			return name;
		},
		set name(value) {
			name = value;
		}
	};
}

export const projectStore = createProjectStore();
