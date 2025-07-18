import { getContactIdByPhone, updateReplyNeeded } from './hubspot.js';
import { logRequest } from './utils.js';

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/webhook') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const startTime = Date.now();
      const payload = await request.json();

      logRequest(payload, startTime);

      const whatsapp = payload?.whatsapp;
      const status = whatsapp?.status;
      const type = whatsapp?.type;
      const phone = whatsapp?.from || whatsapp?.to;

      if (!status || !type || !phone) {
        return new Response('Missing required fields.', { status: 400 });
      }

      let replyNeeded = null;
      if (status === 'received' && type === 'text') {
        replyNeeded = 'yes';
      } else if (status === 'queued' && type === 'text') {
        replyNeeded = 'no';
      } else if (status === 'queued' && type === 'template') {
        return new Response('Ignored: template message');
      } else {
        return new Response('Ignored: unhandled message type');
      }

      const contactId = await getContactIdByPhone(phone, env.HUBSPOT_API_TOKEN);
      if (!contactId) {
        return new Response('Contact not found.', { status: 404 });
      }

      await updateReplyNeeded(contactId, replyNeeded, env.HUBSPOT_API_TOKEN);
      return new Response('Contact updated.', { status: 200 });
    } catch (err) {
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
