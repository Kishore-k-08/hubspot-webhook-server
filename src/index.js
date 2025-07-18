import { getContactIdByPhone, updateReplyNeeded } from './hubspot.js';

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
      const payload = await request.json();
      const { status, type, from, to } = payload?.whatsapp || {};
      const phone = from || to;

      if (!status || !type || !phone) {
        return new Response('Missing required fields.', { status: 400 });
      }

      // Determine if 'reply_needed' should be updated
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
    } catch {
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
