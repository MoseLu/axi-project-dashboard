import { Router } from 'express';
import { register } from 'prom-client';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

export { router as metricsRouter };
