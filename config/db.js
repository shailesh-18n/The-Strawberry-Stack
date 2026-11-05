const mongoose = require('mongoose');

async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri) {
    throw new Error('MONGODB_URI must be configured before connecting to MongoDB.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
  return mongoose.connection;
}

function isMongoAvailable() {
  return mongoose.connection.readyState === 1;
}

module.exports = {
  connectDatabase,
  isMongoAvailable,
};
