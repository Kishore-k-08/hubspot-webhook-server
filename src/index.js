import { getContactIdByPhone, updateReplyNeeded } from './hubspot.js';
import { logRequest } from './utils.js';

export default {
  async fetch(request, env) {
    // Only allow POST method
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const url = new URL(request.url);
    // Only respond to /webhook path
    if (url.pathname !== '/webhook') {
      return new Response('Not Found', { status: 404 });
    }

    try {
      const body = await request.json();
      logRequest(body); // Optional: log for debugging

      const { status, type, from, to } = body?.whatsapp || {};
      const phone = from || to;

      // Ensure essential fields are present
      if (!status || !type || !phone) {
        return new Response('Missing required fields.', { status: 400 });
      }

      // Determine replyNeeded based on message status/type
      let replyNeeded = null;

      if (status === 'received') {
        replyNeeded = 'yes';
      } else if (status === 'queued') {
        if (type === 'template') {
          return new Response('Ignored: template message');
        } else {
          replyNeeded = 'no';
        }
      } else {
        return new Response('Ignored: unhandled message type');
      }

      // Get contact ID from HubSpot by phone number
      const contactId = await getContactIdByPhone(phone, env.HUBSPOT_API_TOKEN);
      if (!contactId) {
        return new Response('Contact not found.', { status: 404 });
      }

      // Update the replyNeeded property in HubSpot
      await updateReplyNeeded(contactId, replyNeeded, env.HUBSPOT_API_TOKEN, env.HUBSPOT_PROPERTY_NAME);

      return new Response('Contact updated.', { status: 200 });

    } catch (error) {
      console.error('Internal Error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
