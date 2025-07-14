import express from 'express';
import { getContactIdByPhone, updateReplyNeeded } from '../services/hubspot.js';

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const whatsappData = req.body?.whatsapp;
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

        const contactId = await getContactIdByPhone(phone);
        if (!contactId) {
            console.warn(`⚠️ No HubSpot contact found for phone: ${phone}`);
            return res.status(404).send('Contact not found');
        }

        await updateReplyNeeded(contactId, replyNeeded);
        console.log(`✅ HubSpot Contact Updated → reply_needed = ${replyNeeded}`);
        res.status(200).send('Contact updated');
    } catch (error) {
        console.error('❌ Webhook error:', error.response?.data || error.message);
        res.status(500).send('Internal server error');
    }
});

export default router;
