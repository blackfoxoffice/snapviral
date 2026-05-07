import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { projectsRouter } from './routes/projects.js';
import { pipelineRouter } from './routes/pipeline.js';
import { voicesRouter } from './routes/voices.js';
import { profileRouter } from './routes/profile.js';
import { youtubeRouter } from './routes/youtube.js';
import { dashboardRouter } from './routes/dashboard.js';
import { adminRouter } from './routes/admin.js';
import { billingRouter } from './routes/billing.js';
import { automationRouter } from './routes/automation.js';
import { blogRouter } from './routes/blog.js';
import { errorHandler } from './middleware/error.js';
import { startScheduler } from './services/scheduler.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? true : '*',
    credentials: true,
  }),
);
// Skip JSON body parsing on the webhook path — it needs the raw body for
// signature verification. The webhook route mounts express.raw itself.
app.use((req, res, next) => {
  if (req.path === '/api/billing/webhook') return next();
  return express.json({ limit: '2mb' })(req, res, next);
});
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'newsflow-api', time: new Date().toISOString() });
});

app.use('/api/projects', projectsRouter);
app.use('/api/pipeline', pipelineRouter);
app.use('/api/voices', voicesRouter);
app.use('/api/profile', profileRouter);
app.use('/api/youtube', youtubeRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/billing', billingRouter);
app.use('/api/automation', automationRouter);
app.use('/api/blog', blogRouter);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
  startScheduler();
});
