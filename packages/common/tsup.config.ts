import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/utils/index.ts", "src/types/index.ts"],
	format: ["cjs", "esm"],
	outDir: "dist",
	dts: true,
	clean: !process.argv.includes("--watch"),
	sourcemap: true,
});
