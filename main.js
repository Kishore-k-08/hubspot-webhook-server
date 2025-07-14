require('dotenv').config();
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Logger middleware
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`\n📥 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

    if (req.method === 'POST') {
        console.log('🔍 Request Body:', JSON.stringify(req.body, null, 2));
    }

    const originalSend = res.send;
    res.send = function (body) {
        console.log(`📤 Response [${res.statusCode}] after ${Date.now() - start}ms:`, body);
        return originalSend.call(this, body);
    };

    next();
});

const HUBSPOT_API_TOKEN = process.env.HUBSPOT_API_TOKEN;

app.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        const whatsappData = payload?.whatsapp;

        const status = whatsappData?.status;
        const messageType = whatsappData?.type;
        const phone = whatsappData?.from || whatsappData?.to;

        if (!status || !messageType || !phone) {
            return res.status(400).send('Missing status, type, or phone.');
        }

        console.log(`ℹ️ WhatsApp Status: ${status}, Type: ${messageType}, Phone: ${phone}`);

        let replyNeeded = null;

        if (status === 'received' && messageType === 'text') {
            replyNeeded = 'yes';
        } else if (status === 'queued' && messageType === 'text') {
            replyNeeded = 'no';
        } else if (status === 'queued' && messageType === 'template') {
            console.log('ℹ️ Outgoing template message — ignored for reply_needed update');
            return res.status(200).send('Ignored outgoing template message');
        } else {
            console.log(`ℹ️ Ignored message: status=${status}, type=${messageType}`);
            return res.status(200).send('Ignored other message types');
        }

        console.log(`📞 Setting reply_needed = ${replyNeeded}`);

        const contactId = await getContactIdByPhone(phone);
        if (!contactId) {
            console.warn(`⚠️ No HubSpot contact found for phone: ${phone}`);
            return res.status(404).send('Contact not found');
        }

        console.log(`🧾 Found Contact ID: ${contactId}`);

        await updateReplyNeeded(contactId, replyNeeded);

        console.log(`✅ HubSpot Contact Updated → reply_needed = ${replyNeeded}`);
        res.status(200).send('Contact updated');
    } catch (error) {
        console.error('❌ Webhook error:', error.response?.data || error.message);
        res.status(500).send('Internal server error');
    }
});

async function getContactIdByPhone(phone) {
    const url = 'https://api.hubapi.com/crm/v3/objects/contacts/search';

    const payload = {
        filterGroups: [
            {
                filters: [
                    {
                        propertyName: 'phone',
                        operator: 'EQ',
                        value: phone
                    }
                ]
            }
        ],
        properties: ['firstname', 'lastname', 'email', 'phone'],
        limit: 1
    };

    const response = await axios.post(url, payload, {
        headers: {
            Authorization: `Bearer ${HUBSPOT_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data?.results?.[0]?.id;
}

async function updateReplyNeeded(contactId, value) {
    const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
    const payload = {
        properties: {
            reply_needed: value
        }
    };

    await axios.patch(url, payload, {
        headers: {
            Authorization: `Bearer ${HUBSPOT_API_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Webhook server listening on port ${PORT}`);
});
