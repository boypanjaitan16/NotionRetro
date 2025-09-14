export interface Activity {
	id: number;
	collectionId: number;
	title: string;
	pageId: string;
	summary: string;
	facilitator: string;
	participants: string[];
	actions: Action[];
}

export interface Action {
	title: string;
	assignee: string;
	priority: string;
	dueDate: string;
}
