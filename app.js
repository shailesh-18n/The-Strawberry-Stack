const path = require('node:path');
const express = require('express');
const securityMiddleware = require('./middleware/security');
const healthRoutes = require('./routes/health');
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const careerRoutes = require('./routes/career');
const assessmentRoutes = require('./routes/assessment');
const learningRoutes = require('./routes/learning');
const skillTrackRoutes = require('./routes/skilltrack');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const csrfProtection = require('./middleware/csrfProtection');
const { configureDnsResolver } = require('./config/dns');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const mongoose = require('mongoose');

configureDnsResolver();

const app = express();
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must contain at least 32 characters before starting the application.');
}

const sessionStore = process.env.MONGODB_URI
  ? MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60,
  })
  : undefined;

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(securityMiddleware);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.get('/sw.js', (request, response, next) => {
  response.set('Service-Worker-Allowed', '/');
  response.sendFile(path.join(__dirname, 'public', 'sw.js'), (error) => {
    if (error) next(error);
  });
});
app.use(session({
  name: 'vidyachain.sid',
  secret: sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  },
}));
app.use((request, response, next) => {
  response.locals.currentYear = new Date().getFullYear();
  response.locals.user = request.session.userId ? { id: request.session.userId } : null;
  next();
});
app.use(csrfProtection);

app.use(healthRoutes);
app.use(indexRoutes);
app.use('/auth', authRoutes);
app.use(studentRoutes);
app.use(careerRoutes);
app.use(assessmentRoutes);
app.use(learningRoutes);
app.use(skillTrackRoutes);
app.use(notFound);
app.use(errorHandler);

app.locals.sessionStore = sessionStore;
app.locals.mongoose = mongoose;

module.exports = app;
