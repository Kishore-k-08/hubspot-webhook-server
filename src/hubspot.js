const BASE_URL = 'https://api.hubapi.com/crm/v3/objects/contacts';

export async function getContactIdByPhone(phone, token) {
  const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
  const url = `${BASE_URL}/search`;

  const payload = {
    filterGroups: [{
      filters: [{
        propertyName: 'phone',
        operator: 'EQ',
        value: formattedPhone,
      }],
    }],
    properties: ['phone'],
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

  if (!res.ok) return null;

  const data = await res.json();
  return data?.results?.[0]?.id || null;
}

export async function updateReplyNeeded(contactId, value, token) {
  const url = `${BASE_URL}/${contactId}`;
  const payload = {
    properties: {
      reply_needed: value,
    },
  };

  await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
}
