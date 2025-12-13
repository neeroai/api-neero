# Receiving messages

## Inbound messages

In this section, you can find sample messages of every inbound message type supported by the Channels API from WhatsApp. The code snippets in every subsection demonstrate how a WhatsApp message is converted into a Channels API message.

See the following pages to understand more about [retrieving messages](https://docs.bird.com/api/channels-api/api-reference/messaging) or [message statuses](https://docs.bird.com/api/channels-api/message-status-and-interactions)

### Text

{% code lineNumbers="true" %}

```json
{
  "id": "96a0b5fa-a986-453d-be5c-3117f989f025",
  "channelId": "614208aa-b153-4d5d-9989-2fddfc0ce4c3",
  "sender": {
    "contact": {
      "id": "32cf5eee-f940-422c-ab8c-5f753aad5efd",
      "identifierKey": "phonenumber",
      "identifierValue": "+31612345678"
    }
  },
  "receiver": {
    "connector": {
      "id": "86cc4dc0-3dc0-41b7-ac43-8ec829ead56f"
    }
  },
  "body": {
    "type": "text",
    "text": {
      "text": "Sample incoming text message"
    }
  },
  "parts": [
    {
      "platformReference": "wamid.HBgLMzE2MjUzNDg2MjAVAgASGBQzQTE0NTY1MjU0Q0IxN0EwRjc3OQA="
    }
  ],
  "status": "delivered",
  "direction": "incoming",
  "lastStatusAt": "2022-12-22T08:32:50.736Z",
  "createdAt": "2022-12-22T08:32:50.736Z",
  "updatedAt": "2022-12-22T08:32:50.736Z"
}
```

{% endcode %}

### Image

{% code lineNumbers="true" %}

```json
{
  "id": "dc2e4643-32ce-41c9-816e-cbb777719b1b",
  "channelId": "614208aa-b153-4d5d-9989-2fddfc0ce4c3",
  "sender": {
    "contact": {
      "id": "32cf5eee-f940-422c-ab8c-5f753aad5efd",
      "identifierKey": "phonenumber",
      "identifierValue": "+31612345678"
    }
  },
  "receiver": {
    "connector": {
      "id": "86cc4dc0-3dc0-41b7-ac43-8ec829ead56f"
    }
  },
  "body": {
    "type": "image",
    "image": {
      "images": [
        {
          "mediaUrl": "https://media.nest.messagebird.com/workspaces/b2d7a013-86df-4aa7-8245-8f3715c87ae2/messages/dc2e4643-32ce-41c9-816e-cbb777719b1b/media/7dc04199-1022-484a-8502-582f59ede37c"
        }
      ]
    }
  },
  "parts": [
    {
      "platformReference": "wamid.HBgLMzE2MjUzNDg2MjAVAgASGBQzQTE5N0UxN0U1N0QwOUE0ODRGMwA="
    }
  ],
  "status": "delivered",
  "direction": "incoming",
  "lastStatusAt": "2022-12-22T12:52:48.058Z",
  "createdAt": "2022-12-22T12:52:48.058Z",
  "updatedAt": "2022-12-22T12:52:48.058Z"
}

```

{% endcode %}

### Sticker

{% code lineNumbers="true" %}

```json
{
  "id": "bd0000a4-e3f6-4eb8-87bd-27edaf918edc",
  "channelId": "614208aa-b153-4d5d-9989-2fddfc0ce4c3",
  "sender": {
    "contact": {
      "id": "32cf5eee-f940-422c-ab8c-5f753aad5efd",
      "identifierKey": "phonenumber",
      "identifierValue": "+31612345678"
    }
  },
  "receiver": {
    "connector": {
      "id": "86cc4dc0-3dc0-41b7-ac43-8ec829ead56f",
    }
  },
  "body": {
    "type": "file",
    "file": {
      "files": [
        {
          "contentType": "image/webp",
          "mediaUrl": "https://media.nest.messagebird.com/workspaces/b2d7a013-86df-4aa7-8245-8f3715c87ae2/messages/bd0000a4-e3f6-4eb8-87bd-27edaf918edc/media/41be4a06-fc14-4ed0-8ae1-96db548a2beb",
          "metadata": {
            "isAnimated": false
          }
        }
      ]
    }
  },
  "parts": [
    {
      "platformReference": "wamid.HBgLMzE2MjUzNDg2MjAVAgASGBQzQUREQTlFMjUwNjAwMjg4QUFEQwA="
    }
  ],
  "status": "delivered",
  "direction": "incoming",
  "lastStatusAt": "2022-12-22T12:54:26.764Z",
  "createdAt": "2022-12-22T12:54:26.764Z",
  "updatedAt": "2022-12-22T12:54:26.764Z"
}

```

{% endcode %}

### Document

{% code lineNumbers="true" %}

```json
{
  "id": "6eaa106f-9487-4711-abe5-6c18e363b6ac",
  "channelId": "614208aa-b153-4d5d-9989-2fddfc0ce4c3",
  "sender": {
    "contact": {
      "id": "32cf5eee-f940-422c-ab8c-5f753aad5efd",
      "identifierKey": "phonenumber",
      "identifierValue": "+31612345678"
    }
  },
  "receiver": {
    "connector": {
      "id": "86cc4dc0-3dc0-41b7-ac43-8ec829ead56f"
    }
  },
  "body": {
    "type": "file",
    "file": {
      "files": [
        {
          "contentType": "application/pdf",
          "mediaUrl": "https://media.nest.messagebird.com/workspaces/b2d7a013-86df-4aa7-8245-8f3715c87ae2/messages/6eaa106f-9487-4711-abe5-6c18e363b6ac/media/1fa36ac7-ce4d-4783-bb81-10a015776836",
          "filename": "document.pdf"
        }
      ]
    }
  },
  "reference": "",
  "parts": [
    {
      "platformReference": "wamid.HBgLMzE2MjUzNDg2MjAVAgASGBQzRUIwRDk1Njk3OUVBQ0VDNDA1NwA="
    }
  ],
  "status": "delivered",
  "direction": "incoming",
  "lastStatusAt": "2022-12-22T12:57:40.954Z",
  "createdAt": "2022-12-22T12:57:40.954Z",
  "updatedAt": "2022-12-22T12:57:40.954Z"
}

```

{% endcode %}

### Video

{% code lineNumbers="true" %}

```json
{
  "id": "f87d82ed-1742-44f7-ae1b-48cdb05a8ad7",
  "channelId": "614208aa-b153-4d5d-9989-2fddfc0ce4c3",
  "sender": {
    "contact": {
      "id": "32cf5eee-f940-422c-ab8c-5f753aad5efd",
      "identifierKey": "phonenumber",
      "identifierValue": "+31612345678"
    }
  },
  "receiver": {
    "connector": {
      "id": "86cc4dc0-3dc0-41b7-ac43-8ec829ead56f"
    }
  },
  "body": {
    "type": "file",
    "file": {
      "files": [
        {
          "contentType": "video/mp4",
          "mediaUrl": "https://media.nest.messagebird.com/workspaces/b2d7a013-86df-4aa7-8245-8f3715c87ae2/messages/f87d82ed-1742-44f7-ae1b-48cdb05a8ad7/media/9afdab13-8f31-4112-a4ce-dede500dde57"
        }
      ]
    }
  },
  "parts": [
    {
      "platformReference": "wamid.HBgLMzE2MjUzNDg2MjAVAgASGBQzRUIwRTBFREY1MjUwNzBBRDYwRQA="
    }
  ],
  "status": "delivered",
  "direction": "incoming",
  "lastStatusAt": "2022-12-22T13:00:08.346Z",
  "createdAt": "2022-12-22T13:00:08.346Z",
  "updatedAt": "2022-12-22T13:00:08.346Z"
}

```

{% endcode %}

### Location

{% code lineNumbers="true" %}

```json
{
  "id": "5b0221a7-6d2b-4a06-96c4-5b91a4f1d0b4",
  "channelId": "614208aa-b153-4d5d-9989-2fddfc0ce4c3",
  "sender": {
    "contact": {
      "id": "32cf5eee-f940-422c-ab8c-5f753aad5efd",
      "identifierKey": "phonenumber",
      "identifierValue": "+31612345678"
    }
  },
  "receiver": {
    "connector": {
      "id": "86cc4dc0-3dc0-41b7-ac43-8ec829ead56f"
    }
  },
  "body": {
    "type": "location",
    "location": {
      "coordinates": {
        "latitude": 52.359917,
        "longitude": 4.855734
      },
      "location": {
        "address": "Trompenburgstraat 2C, Amsterdam, North Holland 1079 TX",
        "label": "MessageBird"
      }
    }
  },
  "parts": [
    {
      "platformReference": "wamid.HBgLMzE2MjUzNDg2MjAVAgASGBQzQUI0QjFEODU0RjQwMUI3ODc3NQA="
    }
  ],
  "status": "delivered",
  "direction": "incoming",
  "lastStatusAt": "2022-12-22T13:02:10.96Z",
  "createdAt": "2022-12-22T13:02:10.96Z",
  "updatedAt": "2022-12-22T13:02:10.96Z"
}

```

{% endcode %}

### Audio&#x20;

{% code lineNumbers="true" %}

```json
{
  "id": "96ccc0ec-33cc-4f88-b379-52ae30d8f82e",
  "channelId": "614208aa-b153-4d5d-9989-2fddfc0ce4c3",
  "sender": {
    "contact": {
      "id": "32cf5eee-f940-422c-ab8c-5f753aad5efd",
      "identifierKey": "phonenumber",
      "identifierValue": "+31612345678"
    }
  },
  "receiver": {
    "connector": {
      "id": "86cc4dc0-3dc0-41b7-ac43-8ec829ead56f"
    }
  },
  "body": {
    "type": "file",
    "file": {
      "files": [
        {
          "contentType": "audio/ogg",
          "mediaUrl": "https://media.nest.messagebird.com/workspaces/b2d7a013-86df-4aa7-8245-8f3715c87ae2/messages/96ccc0ec-33cc-4f88-b379-52ae30d8f82e/media/4d25c3f8-499f-45c5-a25d-dc704b15d08b"
        }
      ]
    }
  },
  "parts": [
    {
      "platformReference": "wamid.HBgLMzE2MjUzNDg2MjAVAgASGBQzQTZFRTlGN0FCRDBBREQ0NDhBOAA="
    }
  ],
  "status": "delivered",
  "direction": "incoming",
  "lastStatusAt": "2022-12-22T13:03:30.295Z",
  "createdAt": "2022-12-22T13:03:30.295Z",
  "updatedAt": "2022-12-22T13:03:30.295Z"
}

```

{% endcode %}

### Interactive message reply

The following message is an example of an inbound message received when a WhatsApp user clicks on a button.

{% code lineNumbers="true" %}

```json
{
  "id": "d2e22fd6-fe2f-4180-ae43-105968d18eda",
  "channelId": "614208aa-b153-4d5d-9989-2fddfc0ce4c3",
  "sender": {
    "contact": {
      "id": "32cf5eee-f940-422c-ab8c-5f753aad5efd",
      "identifierKey": "phonenumber",
      "identifierValue": "+31612345678"
    }
  },
  "receiver": {
    "connector": {
      "id": "86cc4dc0-3dc0-41b7-ac43-8ec829ead56f",
      "identifierValue": ""
    }
  },
  "body": {
    "type": "text",
    "text": {
      "text": "Yes"
    }
  },
  "reference": "",
  "parts": [
    {
      "platformReference": "wamid.HBgMNDQ3OTY0OTA1NzMxFQIAEhgUM0FDOUQ5NTY2QTJBNkE1NTc0RDcA"
    }
  ],
  "status": "delivered",
  "reason": "",
  "direction": "incoming",
  "lastStatusAt": "2023-01-10T16:31:59.559Z",
  "createdAt": "2023-01-10T16:31:59.559Z",
  "updatedAt": "2023-01-10T16:31:59.559Z"
}

```

{% endcode %}
