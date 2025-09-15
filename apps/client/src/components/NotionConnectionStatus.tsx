import { Button } from "@mantine/core";
import { IconBrandNotion, IconLink } from "@tabler/icons-react";
import { useEffect } from "react";
import { useUpdateNotionToken } from "@/hooks/useNotion";
import { useAuthStore } from "@/stores/authStore";
import { handleConnectNotion } from "@/utils/notion";

export const NotionConnectionStatus: React.FC = () => {
	const { isAuthenticated, user } = useAuthStore();
	const updateToken = useUpdateNotionToken();

	useEffect(() => {
		const listener = (event: MessageEvent) => {
			if (event.data.type === "NOTION_CONNECTED" && event.data.data) {
				updateToken.mutateAsync(event.data.data);
			}
		};
		window.addEventListener("message", listener);

		return () => {
			window.removeEventListener("message", listener);
		};
	}, [updateToken]);

	if (!isAuthenticated || user?.isNotionConnected) return null;

	return (
		<div
			className="flex flex-row items-center justify-between gap-5 bg-yellow-100 border-t border-b border-yellow-500 text-yellow-700 p-5 md:px-24 lg:px-32"
			role="alert"
		>
			<div className="flex flex-row items-center gap-3">
				<IconBrandNotion size={50} />
				<div>
					<p className="font-bold">Notion Integration Required</p>
					<p className="text-sm">
						Please connect your Notion account to access all features.
					</p>
				</div>
			</div>
			<Button
				leftSection={<IconLink />}
				color="black"
				onClick={handleConnectNotion}
				type="button"
			>
				Connect
			</Button>
		</div>
	);
};
