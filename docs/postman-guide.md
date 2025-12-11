# Postman Testing Guide

This guide explains how to test the API endpoints using Postman.

## Pre-requisites

1.  **Base URL**: Determine your deployment URL (e.g., `https://api-neero.vercel.app` or `http://localhost:3000`).
2.  **API Key**: If you have `NEERO_API_KEY` set in your environment, you must send it as a header `x-api-key`.

## Endpoints

### 1. Health Check
*   **URL**: `GET /api/bird/health`
*   **Description**: Verifies that the AI services (Gemini, Groq) are correctly configured.
*   **Response**: `200 OK` with JSON status.

### 2. Process Bird Action
*   **URL**: `POST /api/bird`
*   **Description**: Main endpoint for processing images, audio, or documents.
*   **Headers**:
    *   `Content-Type`: `application/json`
    *   `x-api-key`: `{{neero_api_key}}` (Optional, if enabled)
*   **Body (Image Example)**:
    ```json
    {
      "type": "image",
      "mediaUrl": "https://example.com/photo.jpg",
      "context": {
        "name": "Juan Perez",
        "email": "juan@example.com"
      }
    }
    ```
*   **Body (Audio Example)**:
    ```json
    {
      "type": "audio",
      "mediaUrl": "https://example.com/voice.mp3"
    }
    ```

## Importable Postman Collection

Copy the JSON below and save it as `neero-collection.json`, then import it into Postman.

```json
{
	"info": {
		"_postman_id": "b3e04052-9f0e-4363-8839-867c2957754b",
		"name": "Neero API",
		"schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
	},
	"item": [
		{
			"name": "Health Check",
			"request": {
				"method": "GET",
				"header": [],
				"url": {
					"raw": "{{base_url}}/api/bird/health",
					"host": [
						"{{base_url}}"
					],
					"path": [
						"api",
						"bird",
						"health"
					]
				}
			},
			"response": []
		},
		{
			"name": "Process Image (Action)",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "x-api-key",
						"value": "{{api_key}}",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"type\": \"image\",\n    \"mediaUrl\": \"https://images.unsplash.com/photo-1554080353-a576cf803bda?auto=format&fit=crop&w=1000&q=80\",\n    \"context\": {\n        \"name\": \"Test User\"\n    }\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "{{base_url}}/api/bird",
					"host": [
						"{{base_url}}"
					],
					"path": [
						"api",
						"bird"
					]
				}
			},
			"response": []
		},
		{
			"name": "Process Invoice (Action)",
			"request": {
				"method": "POST",
				"header": [
					{
						"key": "x-api-key",
						"value": "{{api_key}}",
						"type": "text"
					}
				],
				"body": {
					"mode": "raw",
					"raw": "{\n    \"type\": \"image\",\n    \"mediaUrl\": \"https://marketplace.canva.com/EAFGv9k7b04/1/0/1131w/canva-grey-minimalist-invoice-L-4q4s7Y8rY.jpg\",\n    \"context\": {\n        \"intent\": \"extract_invoice\"\n    }\n}",
					"options": {
						"raw": {
							"language": "json"
						}
					}
				},
				"url": {
					"raw": "{{base_url}}/api/bird",
					"host": [
						"{{base_url}}"
					],
					"path": [
						"api",
						"bird"
					]
				}
			},
			"response": []
		}
	],
	"event": [
		{
			"listen": "prerequest",
			"script": {
				"type": "text/javascript",
				"exec": [
					""
				]
			}
		},
		{
			"listen": "test",
			"script": {
				"type": "text/javascript",
				"exec": [
					""
				]
			}
		}
	],
	"variable": [
		{
			"key": "base_url",
			"value": "https://api-neero.vercel.app",
			"type": "string"
		},
		{
			"key": "api_key",
			"value": "",
			"type": "string"
		}
	]
}
```
