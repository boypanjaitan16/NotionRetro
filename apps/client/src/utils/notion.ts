const NOTION_CONNECT_URL = import.meta.env.VITE_NOTION_CONNECT_URL;

export const handleConnectNotion = () => {
	window.open(NOTION_CONNECT_URL, "Notion Integration", "width=600,height=700");
};
