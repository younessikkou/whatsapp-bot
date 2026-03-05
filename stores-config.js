/**
 * ============================================
 * CONFIGURATION MULTI-STORES
 * ============================================
 * 
 * Chaque store a sa propre configuration :
 * - Nom, produits, prix
 * - Messages personnalisés
 * - Clé API unique pour identification
 */

const stores = {
  // ===== STORE 1 : NessYou (Mode & Vêtements) =====
  "nessyou": {
    id: "nessyou",
    apiKey: "nessyou_api_key_2026", // Clé pour identifier le store
    name: "NessYou",
    slogan: "La mode tendance au Maroc 🇲🇦",
    type: "fashion",
    currency: "MAD",
    whatsapp: "+212635611933",
    email: "contact@nessyou.ma",
    website: "https://nessyou.ma",
    
    // Produits
    products: [
      { name: "T-shirts", priceRange: "99 - 199 MAD" },
      { name: "Jeans", priceRange: "199 - 399 MAD" },
      { name: "Robes", priceRange: "149 - 499 MAD" },
      { name: "Accessoires", priceRange: "49 - 149 MAD" }
    ],
    
    // Livraison
    shipping: {
      freeAbove: 300,
      cost: 30,
      deliveryDays: "3-5",
      zones: ["Casablanca", "Rabat", "Marrakech", "Tanger", "Tout le Maroc"]
    },
    
    // Paiement
    payment: ["Carte bancaire", "Cash à la livraison (COD)"],
    
    // Retours
    returns: "7 jours après réception",
    
    // Horaires support
    supportHours: "9h-18h Lundi-Samedi",
    
    // Personnalité du bot
    botPersonality: "amical, jeune, utilise des emojis, parle français et darija",
    
    // Contexte IA spécifique
    aiContext: `
Tu es NessBot, l'assistant de NessYou - boutique de mode tendance au Maroc.

🎯 PERSONNALITÉ :
- Jeune, dynamique, amical
- Utilise des emojis 😊👗🛍️
- Parle français ou darija selon le client
- Tutoie les clients (ambiance décontractée)

📦 CATALOGUE :
- T-shirts : 99-199 MAD
- Jeans : 199-399 MAD  
- Robes : 149-499 MAD
- Accessoires : 49-149 MAD

🚚 LIVRAISON :
- 3-5 jours partout au Maroc
- GRATUITE dès 300 MAD
- 30 MAD sinon

💳 PAIEMENT :
- Carte bancaire
- Cash à la livraison

📞 CONTACT : +212635611933
    `
  },

  // ===== STORE 2 : TechMaroc (Électronique) =====
  "techmaroc": {
    id: "techmaroc",
    apiKey: "techmaroc_api_key_2026",
    name: "TechMaroc",
    slogan: "L'électronique au meilleur prix 📱",
    type: "electronics",
    currency: "MAD",
    whatsapp: "+212600000001",
    email: "support@techmaroc.ma",
    website: "https://techmaroc.ma",
    
    products: [
      { name: "Smartphones", priceRange: "1500 - 15000 MAD" },
      { name: "Laptops", priceRange: "4000 - 25000 MAD" },
      { name: "Accessoires Tech", priceRange: "50 - 500 MAD" },
      { name: "Gaming", priceRange: "500 - 8000 MAD" }
    ],
    
    shipping: {
      freeAbove: 1000,
      cost: 50,
      deliveryDays: "2-4",
      zones: ["Tout le Maroc", "Express Casablanca 24h"]
    },
    
    payment: ["Carte bancaire", "Virement", "Cash à la livraison", "Crédit 4x sans frais"],
    returns: "14 jours, produit neuf scellé",
    supportHours: "8h-20h 7j/7",
    botPersonality: "professionnel, technique, précis, vouvoie les clients",
    
    aiContext: `
Tu es TechBot, l'assistant de TechMaroc - spécialiste électronique au Maroc.

🎯 PERSONNALITÉ :
- Professionnel et technique
- Vouvoie les clients
- Donne des conseils techniques précis
- Utilise peu d'emojis (juste 📱💻🎮)

📦 CATALOGUE :
- Smartphones : 1500-15000 MAD (iPhone, Samsung, Xiaomi)
- Laptops : 4000-25000 MAD (HP, Dell, MacBook)
- Accessoires : 50-500 MAD
- Gaming : 500-8000 MAD

🚚 LIVRAISON :
- 2-4 jours Maroc
- Express 24h Casablanca
- GRATUITE dès 1000 MAD
- 50 MAD sinon

💳 PAIEMENT :
- Carte bancaire
- Virement
- Cash livraison
- Crédit 4x sans frais

🔧 GARANTIE : 1 an constructeur
📞 SUPPORT : +212600000001 (8h-20h 7j/7)
    `
  },

  // ===== STORE 3 : BeautyZone (Cosmétiques) =====
  "beautyzone": {
    id: "beautyzone",
    apiKey: "beautyzone_api_key_2026",
    name: "BeautyZone",
    slogan: "Votre beauté, notre passion 💄",
    type: "beauty",
    currency: "MAD",
    whatsapp: "+212600000002",
    email: "hello@beautyzone.ma",
    website: "https://beautyzone.ma",
    
    products: [
      { name: "Maquillage", priceRange: "30 - 300 MAD" },
      { name: "Soins visage", priceRange: "50 - 400 MAD" },
      { name: "Parfums", priceRange: "150 - 800 MAD" },
      { name: "Soins cheveux", priceRange: "40 - 250 MAD" }
    ],
    
    shipping: {
      freeAbove: 200,
      cost: 25,
      deliveryDays: "2-3",
      zones: ["Tout le Maroc"]
    },
    
    payment: ["Carte bancaire", "Cash à la livraison"],
    returns: "30 jours produits non ouverts",
    supportHours: "10h-19h Lundi-Samedi",
    botPersonality: "chaleureux, expert beauté, conseils personnalisés, féminin",
    
    aiContext: `
Tu es BeautyBot, l'assistante de BeautyZone - expert beauté au Maroc.

🎯 PERSONNALITÉ :
- Chaleureuse et bienveillante
- Experte en beauté et cosmétiques
- Donne des conseils personnalisés
- Utilise des emojis 💄💅✨🌸

📦 CATALOGUE :
- Maquillage : 30-300 MAD (MAC, Maybelline, L'Oréal)
- Soins visage : 50-400 MAD (crèmes, sérums, masques)
- Parfums : 150-800 MAD
- Cheveux : 40-250 MAD

🚚 LIVRAISON :
- 2-3 jours
- GRATUITE dès 200 MAD
- 25 MAD sinon

💝 OFFRES :
- -10% première commande
- Points fidélité
- Échantillons gratuits

📞 CONTACT : +212600000002
    `
  }
};

// ===== FONCTIONS UTILITAIRES =====

/**
 * Récupère un store par son ID
 */
function getStore(storeId) {
  return stores[storeId?.toLowerCase()] || null;
}

/**
 * Récupère un store par sa clé API
 */
function getStoreByApiKey(apiKey) {
  return Object.values(stores).find(s => s.apiKey === apiKey) || null;
}

/**
 * Liste tous les stores
 */
function getAllStores() {
  return Object.values(stores).map(s => ({
    id: s.id,
    name: s.name,
    type: s.type,
    phone: s.whatsapp,
    active: s.active !== false // Par défaut actif
  }));
}

/**
 * Alias pour getStore - utilisé par server.js
 */
function getStoreConfig(storeId) {
  const store = getStore(storeId);
  if (!store) return null;
  return {
    ...store,
    context: store.aiContext // Alias pour compatibilité
  };
}

/**
 * Récupère un store par son numéro de téléphone WhatsApp
 */
function getStoreByPhone(phone) {
  if (!phone) return null;
  
  // Normaliser le numéro (enlever les caractères non-numériques)
  const normalizedPhone = phone.replace(/\D/g, '');
  
  const store = Object.values(stores).find(s => {
    const storePhone = s.whatsapp?.replace(/\D/g, '') || '';
    return storePhone === normalizedPhone || 
           normalizedPhone.includes(storePhone) || 
           storePhone.includes(normalizedPhone);
  });
  
  if (!store) return null;
  
  return {
    ...store,
    context: store.aiContext
  };
}

/**
 * Ajouter un nouveau store dynamiquement
 */
function addStore(storeConfig) {
  const id = storeConfig.id?.toLowerCase();
  if (!id) throw new Error('Store ID required');
  stores[id] = {
    ...storeConfig,
    id
  };
  return stores[id];
}

/**
 * Génère le contexte IA pour un store spécifique
 */
function getAIContext(storeId) {
  const store = getStore(storeId);
  if (!store) return null;
  return store.aiContext;
}

/**
 * Génère un message de confirmation de commande pour un store
 */
function getOrderConfirmationMessage(storeId, order) {
  const store = getStore(storeId);
  if (!store) return null;

  return `
🎉 *Commande Confirmée !*

Bonjour ${order.customerName} 👋

Merci pour votre commande chez *${store.name}* !

📦 *Commande #${order.orderNumber}*
${order.items.map(item => `• ${item.name} x${item.quantity} - ${item.price} ${store.currency}`).join('\n')}

💰 *Total:* ${order.total} ${store.currency}
🚚 *Livraison:* ${order.shipping > 0 ? order.shipping + ' ' + store.currency : 'GRATUITE 🎁'}
📍 *Adresse:* ${order.address}

⏰ Livraison prévue dans ${store.shipping.deliveryDays} jours.

${store.type === 'fashion' ? '👗 Portez-les avec style !' : ''}
${store.type === 'electronics' ? '📱 Profitez de votre nouvel appareil !' : ''}
${store.type === 'beauty' ? '💄 Prenez soin de vous !' : ''}

Questions ? Contactez-nous : ${store.whatsapp}
  `.trim();
}

/**
 * Génère un message de bienvenue pour un store
 */
function getWelcomeMessage(storeId) {
  const store = getStore(storeId);
  if (!store) return "Bienvenue ! Comment puis-je vous aider ?";

  const messages = {
    fashion: `Bonjour ! 👋 Bienvenue chez *${store.name}* - ${store.slogan}\n\nJe suis là pour t'aider à trouver le look parfait ! 👗✨\n\nQue recherches-tu aujourd'hui ?`,
    electronics: `Bonjour ! 👋 Bienvenue chez *${store.name}* - ${store.slogan}\n\nJe suis votre assistant technique. Comment puis-je vous aider ? 📱💻`,
    beauty: `Bonjour ! 👋 Bienvenue chez *${store.name}* - ${store.slogan}\n\nJe suis là pour vous conseiller sur nos produits beauté ! 💄✨\n\nQue puis-je faire pour vous ?`
  };

  return messages[store.type] || `Bienvenue chez ${store.name} ! Comment puis-je vous aider ?`;
}

module.exports = {
  stores,
  getStore,
  getStoreConfig,
  getStoreByApiKey,
  getStoreByPhone,
  getAllStores,
  addStore,
  getAIContext,
  getOrderConfirmationMessage,
  getWelcomeMessage
};
