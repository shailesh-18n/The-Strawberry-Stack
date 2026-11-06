require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const { connectDatabase } = require('./config/db');
const { seedCatalog } = require('./services/catalogService');

function getPort(value) {
  const port = Number(value || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535.');
  }
  return port;
}

async function start() {
  const port = getPort(process.env.PORT);
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    await connectDatabase(mongoUri);
    const seeded = await seedCatalog();
    console.info('Connected to MongoDB.');
    console.info(`Career catalogue ready (${seeded.careers} careers, ${seeded.skills} skills).`);
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is required in production.');
  } else {
    console.warn('MONGODB_URI is not set; starting development server without database readiness.');
  }

  const server = await new Promise((resolve, reject) => {
    const listener = app.listen(port);
    listener.once('error', reject);
    listener.once('listening', () => resolve(listener));
  });
  console.info(`VidyaChain listening on port ${port}.`);

  let shuttingDown = false;
  const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`${signal} received; shutting down.`);
    server.close((error) => {
      if (error) {
        console.error('HTTP server shutdown failed.', error);
        process.exitCode = 1;
      }
      Promise.allSettled([
        mongoose.disconnect(),
        app.locals.sessionStore?.close(),
      ].filter(Boolean)).then((results) => {
        for (const result of results) {
          if (result.status === 'rejected') {
            console.error('Application shutdown failed.', result.reason);
            process.exitCode = 1;
          }
        }
      });
    });
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  return server;
}

if (require.main === module) {
  start().catch(async (error) => {
    console.error('VidyaChain failed to start.', error);
    const results = await Promise.allSettled([
      mongoose.disconnect(),
      app.locals.sessionStore?.close(),
    ].filter(Boolean));
    for (const result of results) {
      if (result.status === 'rejected') {
        console.error('Database shutdown failed.', result.reason);
      }
    }
    process.exitCode = 1;
  });
}

module.exports = { getPort, start };
