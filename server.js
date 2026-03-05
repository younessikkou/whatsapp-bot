require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// ===== INTÉGRATION E-COMMERCE =====
const ecommerceWebhooks = require('./ecommerce-webhooks');
app.use('/ecommerce', ecommerceWebhooks);

process.on('uncaughtException', (err) => {
  console.error('❌ uncaughtException:', err.message, err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('❌ unhandledRejection:', reason);
});

const OLLAMA_URL = process.env.OLLAMA_URL;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const STORE_CONTEXT = `
Tu es NessBot, l'assistant virtuel amical de notre boutique en ligne NessYou.

🎯 TON RÔLE :
- Aide les clients avec leurs questions sur les produits, commandes, livraison
- Sois accueillant, professionnel et utile
- Réponds dans la langue du client (Français, Darija, ou Anglais)

📦 INFOS DU STORE :
- Boutique : NessYou - Boutique en ligne au Maroc
- Produits : Vêtements, accessoires, articles tendance
- Prix : À partir de 99 MAD
- Livraison : 3-5 jours ouvrés, GRATUITE dès 300 MAD
- Frais de livraison : 30 MAD (si moins de 300 MAD)
- Retours : Gratuits sous 7 jours
- Paiement : Carte bancaire / Cash à la livraison (COD)
- Support : 9h-18h du Lundi au Samedi
- WhatsApp : +212 635-611933

💡 EXEMPLES DE RÉPONSES :
- "Bonjour" → "Bonjour ! 👋 Bienvenue chez NessYou. Comment puis-je vous aider ?"
- "Prix" → "Nos prix commencent à 99 MAD. Quel type de produit vous intéresse ?"
- "Livraison Casablanca" → "Oui ! Livraison à Casablanca en 3-5 jours. Gratuite dès 300 MAD 🚚"

Sois concis, utilise des emojis, et propose toujours de l'aide supplémentaire.
`;

// ===== TEST ROUTE =====
app.get('/', (req, res) => {
  res.json({ status: '✅ Bot WhatsApp actif' });
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ollama_url: OLLAMA_URL,
    timestamp: new Date().toISOString()
  });
});

// ===== WEBHOOK VERIFICATION =====
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook vérifié');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ===== RECEPTION MESSAGES WHATSAPP =====
app.post('/webhook', async (req, res) => {
  const body = req.body;
  if (body.object !== 'whatsapp_business_account') return res.sendStatus(404);

  const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (!message || message.type !== 'text') return res.sendStatus(200);

  const clientPhone = message.from;
  const clientMessage = message.text.body;

  console.log(`📩 Message de ${clientPhone}: ${clientMessage}`);

  res.sendStatus(200);
  await handleMessage(clientPhone, clientMessage);
});

// ===== LOGIQUE PRINCIPALE =====
async function handleMessage(phone, message) {
  try {
    console.log('🤖 Envoi à Llama...');
    const aiResponse = await askLlama(message);
    console.log(`💬 Réponse Llama: ${aiResponse}`);
    await sendWhatsAppMessage(phone, aiResponse);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await sendWhatsAppMessage(phone,
      "Désolé, je rencontre un problème technique. Réessayez dans quelques instants 🙏"
    );
  }
}

// ===== APPEL OLLAMA =====
async function askLlama(userMessage) {
  // Répondre directement sans classification stricte
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: 'llama3.1:8b',
    prompt: `${STORE_CONTEXT}

Message du client: "${userMessage}"

Réponds de manière utile, amicale et concise. Si la question n'est pas liée à la boutique, réponds quand même poliment en redirigeant vers les produits.

Ta réponse:`,
    stream: false,
    options: { temperature: 0.7, num_predict: 200 }
  }, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  });

  return response.data.response.trim();
}

// ===== ENVOI MESSAGE WHATSAPP =====
async function sendWhatsAppMessage(phone, message) {
  if (!WHATSAPP_TOKEN || WHATSAPP_TOKEN === 'token_ici_plus_tard') {
    console.log(`📤 [TEST MODE] Réponse pour ${phone}: ${message}`);
    return;
  }

  await axios.post(
    `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
}

// ===== ROUTE TEST LLAMA =====
app.post('/test-llama', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Champ "message" requis' });
    const response = await askLlama(message);
    res.json({ response });
  } catch (error) {
    console.error('❌ Erreur /test-llama:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Route GET pour test rapide via navigateur
app.get('/test-llama', async (req, res) => {
  try {
    const message = req.query.message || 'Vous livrez à Casablanca ?';
    console.log(`🧪 Test Llama: "${message}"`);
    const response = await askLlama(message);
    res.json({ question: message, response });
  } catch (error) {
    console.error('❌ Erreur /test-llama GET:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🚀 Serveur démarré sur le port', process.env.PORT || 3000);
  console.log('🤖 Ollama URL:', OLLAMA_URL);
});