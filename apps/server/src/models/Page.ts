export interface Page {
	id: string;
	title: string;
	url: string;
	parent: {
		type: string;
		workspace: boolean;
	};
}
