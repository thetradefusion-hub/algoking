import { createApp } from './app.js';
import { connectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { ensureDefaultSettings } from './services/settingsService.js';

async function bootstrap() {
  await connectDatabase();
  await ensureDefaultSettings();

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, mode: env.PLATFORM_MODE, env: env.NODE_ENV },
      `AlgoKing API listening on http://localhost:${env.PORT}`
    );
  });
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
