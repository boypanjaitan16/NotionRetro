import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";

import { errorHandler } from "./middleware/errorHandler";
import { methodOverride } from "./middleware/methodOverride";

import apiRoutes from "./routes/api";
import webRoutes from "./routes/web";

// Initialize DB (this will create tables)
import "./utils/db";

dotenv.config();

const app = express();

// Keep view engine setup for potential future use, but it won't be our primary response method
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// API middleware setup
app.use(
	cors({
		origin: process.env["CORS_ORIGIN"] || "http://localhost:3000",
		credentials: true,
	}),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

app.use(methodOverride);

app.use("/api", apiRoutes);
app.use("/", webRoutes);

// Error handling middleware
app.use(errorHandler);

const PORT = process.env["PORT"] || 4000;
app.listen(PORT, () => {
	console.log(`API server running on port ${PORT}`);
});
