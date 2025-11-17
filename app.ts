import 'newrelic';
import express, { Router } from 'express';
import { apiErrorHandler, errorHandler } from './middleware';

const app = express();
const router = Router();

router.get('/', (req, res) => {
  res.send('Hello, world!');
});
router.use(apiErrorHandler);

app.use('/', router);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
