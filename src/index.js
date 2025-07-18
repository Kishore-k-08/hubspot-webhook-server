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

    const startTime = Date.now();
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    logRequest(body, startTime);

    const phone = body?.message?.contact?.phone;
    const value = body?.message?.payload?.[0]?.value;

    if (!phone || !value) {
      return new Response('Missing phone or value', { status: 400 });
    }

    const contactId = await getContactIdByPhone(phone, env.HUBSPOT_API_TOKEN);
    if (!contactId) {
      return new Response('Contact not found', { status: 404 });
    }

    await updateReplyNeeded(contactId, value, env.HUBSPOT_PROPERTY_NAME, env.HUBSPOT_API_TOKEN);

    return new Response('Success', { status: 200 });
  },
};
