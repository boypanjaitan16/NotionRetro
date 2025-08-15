import { Router } from 'express';
import { create, list, remove } from '../controllers/collectionController';
import { add, list as listTodos, update, remove as removeTodo } from '../controllers/todoController';
import { authenticateJWT } from '../middleware/authMiddleware';
const router = Router();

router.use(authenticateJWT);

router.post('/', create);
router.get('/', list);
router.delete('/:id', remove);

router.post('/:collectionId/todos', add);
router.get('/:collectionId/todos', listTodos);
router.put('/todos/:id', update);
router.delete('/todos/:id', removeTodo);

export default router;
