import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import bodyParser from 'body-parser';
import { handleOAuthRedirect, getAccessToken } from './controllers/oauthController.js';

import logger from './middleware/logger.js';
import webhookRoutes from './routes/webhook.js';

const app = express();
app.use(bodyParser.json());
app.use(logger);
app.use('/webhook', webhookRoutes);
app.get('/oauth/callback', handleOAuthRedirect);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Webhook server listening on port ${PORT}`);
});
