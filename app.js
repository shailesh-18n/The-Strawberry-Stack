const path = require('node:path');
const express = require('express');
const securityMiddleware = require('./middleware/security');
const healthRoutes = require('./routes/health');
const indexRoutes = require('./routes/index');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

app.disable('x-powered-by');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(securityMiddleware);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(healthRoutes);
app.use(indexRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
