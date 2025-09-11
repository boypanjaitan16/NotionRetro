export interface User {
	id: number;
	name: string;
	email: string;
	passwordHash: string;
	notionAccessToken?: string;
	notionWorkspaceId?: string;
	notionWorkspaceName?: string;
	notionBotId?: string;
	notionTokenExpiresAt?: Date;
}
