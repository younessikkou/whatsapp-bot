# WhatsApp Bot IA - E-commerce

Bot WhatsApp intelligent pour e-commerce (YouCan/Shopify) propulsé par Llama 3.1.

## Installation locale

```bash
npm install
npm run dev
```

## Variables d'environnement

```env
OLLAMA_URL=https://votre-tunnel.trycloudflare.com
WHATSAPP_TOKEN=votre_token_meta
PHONE_NUMBER_ID=votre_phone_id
VERIFY_TOKEN=votre_secret
PORT=3000
```

## Routes

- `GET /` - Status du bot
- `GET /health` - Health check
- `GET /webhook` - Vérification webhook Meta
- `POST /webhook` - Réception messages WhatsApp
- `GET /test-llama?message=...` - Test Llama via navigateur
- `POST /test-llama` - Test Llama via API

## Déploiement

Déployé sur Railway avec Ollama exposé via Cloudflare Tunnel.
