import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express from "express";
import path from "path";

dotenv.config();

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));

import { checkAuth } from "./middleware/authMiddleware";
// Import middleware
import { methodOverride } from "./middleware/methodOverride";

// Method override for PUT and DELETE requests
app.use(methodOverride);

// Flash message middleware
app.use((_req, res, next) => {
	res.locals["error"] = null;
	res.locals["success"] = null;
	next();
});

// Initialize DB (this will create tables)
import "./utils/db";

import authRoutes from "./routes/authRoutes";
import collectionRoutes from "./routes/collectionRoutes";
import notionRoutes from "./routes/notionRoutes";

app.use("/auth", authRoutes);
app.use("/collections", collectionRoutes);
app.use("/notion", notionRoutes);

// Use checkAuth middleware for the index route
app.get("/", checkAuth, (req, res) => {
	// If user is logged in, redirect to collections dashboard
	if (req.user) {
		return res.redirect("/collections");
	}
	// Otherwise show the landing page
	return res.render("index");
});

const PORT = process.env["PORT"] || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
