import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();


const HUBSPOT_API_TOKEN = process.env.HUBSPOT_API_TOKEN;

export async function getContactIdByPhone(phone) {
    const url = 'https://api.hubapi.com/crm/v3/objects/contacts/search';

    const phonewithcc = phone.startsWith('+') ? phone : `+${phone}`;

    const payload = {
        filterGroups: [
            {
                filters: [
                    {
                        propertyName: 'phone',
                        operator: 'EQ',
                        value: phonewithcc
                    }
                ]
            }
        ],
        properties: ['firstname', 'lastname', 'email', 'phone'],
        limit: 1
    };

    const headers = {
        Authorization: `Bearer ${HUBSPOT_API_TOKEN}`,
        'Content-Type': 'application/json'
    };

    console.log('📡 [Search Contact] POST:', url);
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    console.log('🧾 Headers:', headers);

    const response = await axios.post(url, payload, { headers });
    return response.data?.results?.[0]?.id;
}

export async function updateReplyNeeded(contactId, value) {
    const url = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`;
    const payload = {
        properties: {
            reply_needed: value
        }
    };

    const headers = {
        Authorization: `Bearer ${HUBSPOT_API_TOKEN}`,
        'Content-Type': 'application/json'
    };

    console.log('📡 [Update Contact] PATCH:', url);
    console.log('📤 Payload:', JSON.stringify(payload, null, 2));
    console.log('🧾 Headers:', headers);

    await axios.patch(url, payload, { headers });
}
