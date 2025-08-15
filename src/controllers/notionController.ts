import { Request, Response } from 'express';
import { 
  getNotionAuthUrl, 
  exchangeCodeForToken, 
  getDatabases, 
  exportCollectionToNotion, 
  createNotionDatabase,
  getNotionPages,
  createNotionPage,
  exportCollectionToNotionPage
} from '../services/notionService';
import { getTodosByCollection } from '../services/todoService';
import { updateNotionToken } from '../services/userService';

const NOTION_CLIENT_ID = process.env['NOTION_CLIENT_ID'] || '';
const NOTION_CLIENT_SECRET = process.env['NOTION_CLIENT_SECRET'] || '';
const NOTION_REDIRECT_URI = process.env['NOTION_REDIRECT_URI'] || '';

export async function connect(_req: Request, res: Response) {
  const url = await getNotionAuthUrl(NOTION_CLIENT_ID, NOTION_REDIRECT_URI);
  console.log(url);
  res.redirect(url);
}

export async function disconnect(req: Request, res: Response) {
  try {
    // @ts-ignore
    await updateNotionToken(req.user.id, null);
    return res.redirect('/collections');
  } catch (error) {
    console.error('Error disconnecting from Notion:', error);
    return res.status(500).json({ error: 'Failed to disconnect from Notion' });
  }
}

export async function callback(req: Request, res: Response) {
  const code = req.query['code'] as string;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  
  try {
    const tokenResponse = await exchangeCodeForToken(code, NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_REDIRECT_URI);
    
    // Update user's Notion access token in the database
    // @ts-ignore
    await updateNotionToken(req.user.id, tokenResponse);
    
    return res.redirect('/collections');
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return res.redirect('/collections?error=notion_connection_failed');
  }
}

export async function databases(req: Request, res: Response) {
  // @ts-ignore
  const accessToken = req.user.notionAccessToken;
  if (!accessToken) return res.status(401).json({ error: 'Notion not connected' });
  
  try {
    const dbs = await getDatabases(accessToken);
    return res.json(dbs);
  } catch (error) {
    console.error('Error fetching Notion databases:', error);
    return res.status(500).json({ error: 'Failed to fetch Notion databases' });
  }
}

export async function createDatabase(req: Request, res: Response) {
  // @ts-ignore
  const accessToken = req.user.notionAccessToken;
  const { name, collectionId } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Notion not connected' });
  }
  
  if (!name) {
    return res.status(400).json({ error: 'Database name is required' });
  }
  
  try {
    const database = await createNotionDatabase(accessToken, name);
    
    // Redirect back to the todos page with the new database ID
    if (collectionId) {
      // Add a timestamp to ensure the page is refreshed and not cached
      return res.redirect(`/collections/${collectionId}/todos?databaseCreated=true&dbId=${database.id}&t=${Date.now()}`);
    }
    
    return res.json(database);
  } catch (error) {
    console.error('Error creating Notion database:', error);
    
    if (collectionId) {
      return res.redirect(`/collections/${collectionId}/todos?error=create_database_failed`);
    }
    
    return res.status(500).json({ error: 'Failed to create Notion database' });
  }
}

export async function exportToNotion(req: Request, res: Response) {
  // @ts-ignore
  const accessToken = req.user.notionAccessToken;
  const { databaseId, collectionId } = req.body;
  
  if (!accessToken || !databaseId || !collectionId) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  try {
    const todos = await getTodosByCollection(Number(collectionId));
    
    if (todos.length === 0) {
      return res.redirect(`/collections/${collectionId}/todos?error=no_todos_to_export`);
    }
    
    await exportCollectionToNotion(accessToken, databaseId, todos);
    
    // Redirect back to the todos page with a success message
    return res.redirect(`/collections/${collectionId}/todos?success=exported`);
  } catch (error: any) {
    console.error('Error exporting to Notion:', error);
    
    let errorMessage = 'export_failed';
    
    // Extract more specific error message if available
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = `export_failed: ${error.response.data.message.substring(0, 100)}`;
    }
    
    return res.redirect(`/collections/${collectionId}/todos?error=${encodeURIComponent(errorMessage)}`);
  }
}

export async function getPages(req: Request, res: Response) {
  // @ts-ignore
  const accessToken = req.user?.notionAccessToken;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Notion not connected' });
  }
  
  try {
    const pages = await getNotionPages(accessToken);
    return res.json(pages);
  } catch (error) {
    console.error('Error fetching Notion pages:', error);
    return res.status(500).json({ error: 'Failed to fetch Notion pages' });
  }
}

export async function createPage(req: Request, res: Response) {
  // @ts-ignore
  const accessToken = req.user.notionAccessToken;
  const { name, collectionId } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Notion not connected' });
  }
  
  if (!name) {
    return res.status(400).json({ error: 'Page name is required' });
  }
  
  try {
    const page = await createNotionPage(accessToken, name);
    
    // Redirect back to the todos page with the new page ID
    if (collectionId) {
      // Add a timestamp to ensure the page is refreshed and not cached
      return res.redirect(`/collections/${collectionId}/todos?pageCreated=true&pageId=${page.id}&t=${Date.now()}`);
    }
    
    return res.json(page);
  } catch (error) {
    console.error('Error creating Notion page:', error);
    
    if (collectionId) {
      return res.redirect(`/collections/${collectionId}/todos?error=create_page_failed`);
    }
    
    return res.status(500).json({ error: 'Failed to create Notion page' });
  }
}

export async function exportToPage(req: Request, res: Response) {
  // @ts-ignore
  const accessToken = req.user.notionAccessToken;
  const { pageId, collectionId } = req.body;
  
  if (!accessToken || !pageId || !collectionId) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  
  try {
    const todos = await getTodosByCollection(Number(collectionId));
    
    if (todos.length === 0) {
      return res.redirect(`/collections/${collectionId}/todos?error=no_todos_to_export`);
    }
    
    await exportCollectionToNotionPage(accessToken, pageId, todos);
    
    // Redirect back to the todos page with a success message
    return res.redirect(`/collections/${collectionId}/todos?success=exported_to_page`);
  } catch (error: any) {
    console.error('Error exporting to Notion page:', error);
    
    let errorMessage = 'export_to_page_failed';
    
    // Extract more specific error message if available
    if (error.response && error.response.data && error.response.data.message) {
      errorMessage = `export_to_page_failed: ${error.response.data.message.substring(0, 100)}`;
    }
    
    return res.redirect(`/collections/${collectionId}/todos?error=${encodeURIComponent(errorMessage)}`);
  }
}
