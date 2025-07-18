import { logRequest } from './utils.js';

const HUBSPOT_API_BASE_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';

export async function getContactIdByPhone(phone, token) {
  const url = `${HUBSPOT_API_BASE_URL}/search`;
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;

  const payload = {
    filterGroups: [
      {
        filters: [
          {
            propertyName: 'phone',
            operator: 'EQ',
            value: formattedPhone,
          },
        ],
      },
    ],
    properties: ['firstname', 'lastname', 'email', 'phone'],
    limit: 1,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('❌ Error fetching contact ID:', error);
    return null;
  }

  const data = await res.json();
  return data?.results?.[0]?.id || null;
}

export async function updateReplyNeeded(contactId, value, propertyName, token) {
  const url = `${HUBSPOT_API_BASE_URL}/${contactId}`;
  const payload = {
    properties: {
      [propertyName]: value,
    },
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error('❌ Error updating contact:', error);
  }
  else {
    console.log(`✅ Contact updated → reply_needed = ${value}`);
  }
}
