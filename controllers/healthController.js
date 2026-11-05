const mongoose = require('mongoose');

function showLiveness(_request, response) {
  response.status(200).json({ status: 'ok' });
}

function showReadiness(_request, response) {
  const connected = mongoose.connection.readyState === 1;
  response.status(connected ? 200 : 503).json({
    status: connected ? 'ready' : 'not_ready',
    database: connected ? 'connected' : 'disconnected',
  });
}

module.exports = { showLiveness, showReadiness };
