require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());

// ===== INTÉGRATION E-COMMERCE =====
const ecommerceWebhooks = require('./ecommerce-webhooks');
app.use('/ecommerce', ecommerceWebhooks);

// ===== SYSTÈME MULTI-STORE =====
const { 
  getStoreConfig, 
  getStoreByPhone, 
  getAllStores,
  addStore 
} = require('./stores-config');

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

// Le contexte par défaut (utilisé si aucun store configuré)
const DEFAULT_STORE_CONTEXT = `
Tu es un assistant virtuel amical pour une boutique en ligne.

🎯 TON RÔLE :
- Aide les clients avec leurs questions sur les produits, commandes, livraison
- Sois accueillant, professionnel et utile
- Réponds dans la langue du client (Français, Darija, ou Anglais)

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
  
  // Identifier le store depuis le numéro de téléphone business qui reçoit le message
  const metadata = body.entry?.[0]?.changes?.[0]?.value?.metadata;
  const businessPhone = metadata?.display_phone_number?.replace(/\D/g, '') || '';

  console.log(`📩 Message de ${clientPhone}: ${clientMessage}`);
  console.log(`🏪 Business Phone: ${businessPhone}`);

  res.sendStatus(200);
  await handleMessage(clientPhone, clientMessage, businessPhone);
});

// ===== LOGIQUE PRINCIPALE =====
async function handleMessage(phone, message, businessPhone = '') {
  try {
    // Identifier le store basé sur le numéro business
    const storeConfig = getStoreByPhone(businessPhone);
    const storeId = storeConfig?.id || 'default';
    
    console.log(`🏪 Store identifié: ${storeConfig?.name || 'Default'}`);
    console.log('🤖 Envoi à Llama...');
    
    const aiResponse = await askLlama(message, storeConfig);
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
async function askLlama(userMessage, storeConfig = null) {
  // Utiliser le contexte du store ou le contexte par défaut
  const storeContext = storeConfig?.context || DEFAULT_STORE_CONTEXT;
  const storeName = storeConfig?.name || 'Boutique';
  
  const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
    model: 'llama3.1:8b',
    prompt: `${storeContext}

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
    const storeId = req.query.store || null;
    const storeConfig = storeId ? getStoreConfig(storeId) : null;
    
    console.log(`🧪 Test Llama: "${message}" (Store: ${storeConfig?.name || 'Default'})`);
    const response = await askLlama(message, storeConfig);
    res.json({ 
      question: message, 
      store: storeConfig?.name || 'Default',
      response 
    });
  } catch (error) {
    console.error('❌ Erreur /test-llama GET:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ===== ROUTES GESTION DES STORES =====
// Lister tous les stores
app.get('/stores', (req, res) => {
  const stores = getAllStores();
  res.json({ 
    count: stores.length,
    stores: stores.map(s => ({
      id: s.id,
      name: s.name,
      phone: s.phone,
      type: s.type,
      active: s.active
    }))
  });
});

// Obtenir un store spécifique
app.get('/stores/:storeId', (req, res) => {
  const store = getStoreConfig(req.params.storeId);
  if (!store) {
    return res.status(404).json({ error: 'Store non trouvé' });
  }
  res.json(store);
});

// Tester une réponse pour un store spécifique
app.post('/stores/:storeId/test', async (req, res) => {
  try {
    const { message } = req.body;
    const storeConfig = getStoreConfig(req.params.storeId);
    
    if (!storeConfig) {
      return res.status(404).json({ error: 'Store non trouvé' });
    }
    
    if (!message) {
      return res.status(400).json({ error: 'Champ "message" requis' });
    }
    
    const response = await askLlama(message, storeConfig);
    res.json({ 
      store: storeConfig.name,
      question: message,
      response 
    });
  } catch (error) {
    console.error('❌ Erreur test store:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('🚀 Serveur démarré sur le port', process.env.PORT || 3000);
  console.log('🤖 Ollama URL:', OLLAMA_URL);
  console.log('🏪 Stores configurés:', getAllStores().map(s => s.name).join(', '));
});