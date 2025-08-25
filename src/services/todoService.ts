import { Todo } from '../models/Todo';
import pool from '../utils/db';

export async function addTodo(collectionId: number, title: string): Promise<Todo> {
  const [result] = await pool.query(
    'INSERT INTO todos (collectionId, title, completed) VALUES (?, ?, ?)',
    [collectionId, title, false]
  );
  // @ts-ignore
  const id = result.insertId;
  return { id, collectionId, title, completed: false };
}

export async function getTodosByCollection(collectionId: number): Promise<Todo[]> {
  const [rows] = await pool.query(
    'SELECT * FROM todos WHERE collectionId = ?',
    [collectionId]
  );
  // @ts-ignore
  return rows;
}

export async function updateTodo(id: number, completed: boolean): Promise<Todo | undefined> {
  const [result] = await pool.query(
    'UPDATE todos SET completed = ? WHERE id = ?',
    [completed ? 1 : 0, id]
  );
  // @ts-ignore
  if (result.affectedRows === 0) return undefined;
  
  const [rows] = await pool.query(
    'SELECT * FROM todos WHERE id = ?',
    [id]
  );
  // @ts-ignore
  return rows.length > 0 ? rows[0] : undefined;
}

export async function deleteTodo(id: number): Promise<boolean> {
  const [result] = await pool.query(
    'DELETE FROM todos WHERE id = ?',
    [id]
  );
  // @ts-ignore
  return result.affectedRows > 0;
}
