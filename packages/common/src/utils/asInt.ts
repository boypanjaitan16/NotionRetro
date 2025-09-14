export const asInt = (value: string | undefined, defaultValue = 0): number => {
	const parsed = parseInt(value || "", 10);
	return Number.isNaN(parsed) ? defaultValue : parsed;
};
