import { getContactIdByPhone, updateReplyNeeded } from './hubspot.js';
import { logRequest } from './utils.js';

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    if (url.pathname !== '/webhook') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const body = await request.json();
      logRequest(body);

      const { status, type, from, to } = body?.whatsapp || {};
      const phone = from || to;

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

      await updateReplyNeeded(contactId, replyNeeded, env.HUBSPOT_API_TOKEN, env.HUBSPOT_PROPERTY_NAME);

      return new Response('Contact updated.', { status: 200 });
    } catch (error) {
      console.error('Internal Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
