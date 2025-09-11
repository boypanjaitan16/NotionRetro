/**
 * Collection model interface
 */
export interface Collection {
	id: number;
	userId: number;
	name: string;
	summary?: string;
	pageId: string;
	createdAt?: string;
	updatedAt?: string;
	todos?: Todo[];
}

/**
 * Todo model interface
 */
export interface Todo {
	id: number;
	collectionId: number;
	title: string;
	completed: boolean;
	createdAt?: string;
	updatedAt?: string;
}
