export * from "./Activity";
export * from "./Collection";
export * from "./Page";
export * from "./User";

export interface NotionPage {
	id: string;
	title: string;
	url: string;
	parent: {
		type: string;
		workspace: boolean;
	};
}
