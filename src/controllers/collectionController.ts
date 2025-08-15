import { Request, Response } from 'express';
import { createCollection, getCollectionsByUser, deleteCollection } from '../services/collectionService';

export async function create(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user.id;
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const collection = await createCollection(userId, name);
  return res.json(collection);
}

export async function list(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user.id;
  // @ts-ignore
  const notionConnected = !!req.user.notionAccessToken;
  
  const collections = await getCollectionsByUser(userId);
  return res.render('dashboard', { 
    collections,
    notionConnected
  });
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params;
  const success = await deleteCollection(Number(id));
  if (!success) return res.status(404).json({ error: 'Not found' });
  return res.json({ success: true });
}
