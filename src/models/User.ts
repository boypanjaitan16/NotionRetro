export interface User {
	id: number;
	email: string;
	password: string;
	notionAccessToken?: string;
	notionWorkspaceId?: string;
	notionWorkspaceName?: string;
	notionBotId?: string;
	notionTokenExpiresAt?: Date;
}
