import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { createUser, validateUser } from '../services/userService';

const JWT_SECRET = process.env['JWT_SECRET'] || 'secret';

export function logout(_req: Request, res: Response) {
  res.clearCookie('token');
  res.redirect('/auth/login');
}

export async function signup(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.render('signup', { error: 'Missing fields' });
  const user = await createUser(email, password);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, { httpOnly: true });
  return res.redirect('/collections');
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  if (!email || !password) return res.render('login', { error: 'Missing fields' });
  const user = await validateUser(email, password);
  if (!user) return res.render('login', { error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
  res.cookie('token', token, { httpOnly: true });
  return res.redirect('/collections');
}

export function showLogin(_req: Request, res: Response) {
  res.render('login');
}

export function showSignup(_req: Request, res: Response) {
  res.render('signup');
}
