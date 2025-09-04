import type { Todo } from "../models/Todo";
import pool from "../utils/db";

export async function addTodo(
	collectionId: number,
	title: string,
): Promise<Todo> {
	const [result] = await pool.query(
		"INSERT INTO todos (collectionId, title, completed) VALUES (?, ?, ?)",
		[collectionId, title, false],
	);
	// @ts-expect-error
	const id = result.insertId;
	return { id, collectionId, title, completed: 0 };
}

export async function getTodosByCollection(
	collectionId: number,
): Promise<Todo[]> {
	const [rows] = await pool.query(
		"SELECT * FROM todos WHERE collectionId = ?",
		[collectionId],
	);
	// @ts-expect-error
	return rows;
}

export async function updateTodo(
	id: number,
	completed: boolean,
): Promise<Todo | undefined> {
	const [result] = await pool.query(
		"UPDATE todos SET completed = ? WHERE id = ?",
		[completed ? 1 : 0, id],
	);
	// @ts-expect-error
	if (result.affectedRows === 0) return undefined;

	const [rows] = await pool.query("SELECT * FROM todos WHERE id = ?", [id]);
	// @ts-expect-error
	return rows.length > 0 ? rows[0] : undefined;
}

export async function deleteTodo(id: number): Promise<boolean> {
	const [result] = await pool.query("DELETE FROM todos WHERE id = ?", [id]);
	// @ts-expect-error
	return result.affectedRows > 0;
}
