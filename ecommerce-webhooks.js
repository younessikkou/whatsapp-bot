/**
 * ============================================
 * INTÉGRATION E-COMMERCE (Shopify / YouCan)
 * ============================================
 * 
 * Ce module gère les webhooks des plateformes e-commerce
 * pour envoyer des confirmations automatiques via WhatsApp
 */

const express = require('express');
const router = express.Router();

// ===== CONFIGURATION =====
const STORE_CONFIG = {
  name: "NessYou",
  currency: "MAD",
  whatsapp: "+212635611933",
  freeShippingMin: 300,
  shippingCost: 30,
  deliveryDays: "3-5"
};

// ===== TEMPLATES DE MESSAGES =====
const MESSAGES = {
  orderConfirmation: (order) => `
🎉 *Commande Confirmée !*

Bonjour ${order.customerName} 👋

Merci pour votre commande chez *${STORE_CONFIG.name}* !

📦 *Détails de la commande #${order.orderNumber}*
${order.items.map(item => `• ${item.name} x${item.quantity} - ${item.price} ${STORE_CONFIG.currency}`).join('\n')}

💰 *Total:* ${order.total} ${STORE_CONFIG.currency}
🚚 *Livraison:* ${order.shipping} ${STORE_CONFIG.currency}
📍 *Adresse:* ${order.address}

⏰ Livraison prévue dans ${STORE_CONFIG.deliveryDays} jours ouvrés.

Besoin d'aide ? Répondez à ce message ! 🙏
  `.trim(),

  orderShipped: (order) => `
🚚 *Votre commande est en route !*

Bonjour ${order.customerName} 👋

Votre commande #${order.orderNumber} a été expédiée !

📦 *Tracking:* ${order.trackingNumber || "Disponible bientôt"}
🏠 *Livraison à:* ${order.city}

Vous serez contacté(e) par le livreur. 📞

Questions ? Répondez ici ! 🙏
  `.trim(),

  orderDelivered: (order) => `
✅ *Commande Livrée !*

Bonjour ${order.customerName} 👋

Votre commande #${order.orderNumber} a été livrée ! 🎁

Merci pour votre confiance chez *${STORE_CONFIG.name}* ❤️

⭐ Laissez-nous un avis si vous êtes satisfait(e) !

À bientôt ! 👋
  `.trim(),

  abandonedCart: (cart) => `
👋 *Vous avez oublié quelque chose ?*

Bonjour ${cart.customerName},

Vous avez laissé des articles dans votre panier chez *${STORE_CONFIG.name}* :

${cart.items.map(item => `• ${item.name} - ${item.price} ${STORE_CONFIG.currency}`).join('\n')}

💰 Total: ${cart.total} ${STORE_CONFIG.currency}
${cart.total >= STORE_CONFIG.freeShippingMin ? '🎁 Livraison GRATUITE !' : `🚚 + ${STORE_CONFIG.shippingCost} MAD livraison`}

👉 Finalisez votre commande : ${cart.checkoutUrl}

Besoin d'aide ? Répondez ici ! 🙏
  `.trim()
};

// ===== WEBHOOK SHOPIFY =====
router.post('/webhook/shopify/order-created', async (req, res) => {
  console.log('📦 Shopify: Nouvelle commande reçue');
  
  try {
    const shopifyOrder = req.body;
    
    // Extraire les données Shopify
    const order = {
      orderNumber: shopifyOrder.order_number || shopifyOrder.name,
      customerName: shopifyOrder.customer?.first_name || "Client",
      customerPhone: formatPhone(shopifyOrder.customer?.phone || shopifyOrder.shipping_address?.phone),
      items: shopifyOrder.line_items?.map(item => ({
        name: item.title,
        quantity: item.quantity,
        price: item.price
      })) || [],
      total: shopifyOrder.total_price,
      shipping: shopifyOrder.total_shipping_price_set?.shop_money?.amount || 0,
      address: formatAddress(shopifyOrder.shipping_address),
      city: shopifyOrder.shipping_address?.city || ""
    };

    if (order.customerPhone) {
      const message = MESSAGES.orderConfirmation(order);
      await sendWhatsAppFromWebhook(order.customerPhone, message);
      console.log(`✅ Confirmation envoyée à ${order.customerPhone}`);
    }

    res.status(200).json({ success: true, message: "Order processed" });
  } catch (error) {
    console.error('❌ Erreur Shopify webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook/shopify/order-fulfilled', async (req, res) => {
  console.log('🚚 Shopify: Commande expédiée');
  
  try {
    const shopifyOrder = req.body;
    
    const order = {
      orderNumber: shopifyOrder.order_number || shopifyOrder.name,
      customerName: shopifyOrder.customer?.first_name || "Client",
      customerPhone: formatPhone(shopifyOrder.customer?.phone),
      trackingNumber: shopifyOrder.fulfillments?.[0]?.tracking_number,
      city: shopifyOrder.shipping_address?.city
    };

    if (order.customerPhone) {
      const message = MESSAGES.orderShipped(order);
      await sendWhatsAppFromWebhook(order.customerPhone, message);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== WEBHOOK YOUCAN =====
router.post('/webhook/youcan/order-created', async (req, res) => {
  console.log('📦 YouCan: Nouvelle commande reçue');
  
  try {
    const youcanOrder = req.body;
    
    // Structure YouCan (adapter selon leur API)
    const order = {
      orderNumber: youcanOrder.ref || youcanOrder.id,
      customerName: youcanOrder.customer?.first_name || youcanOrder.shipping?.name || "Client",
      customerPhone: formatPhone(youcanOrder.customer?.phone || youcanOrder.shipping?.phone),
      items: youcanOrder.items?.map(item => ({
        name: item.product?.name || item.name,
        quantity: item.quantity,
        price: item.price
      })) || [],
      total: youcanOrder.total || youcanOrder.amount,
      shipping: youcanOrder.shipping_price || 0,
      address: youcanOrder.shipping?.address || "",
      city: youcanOrder.shipping?.city || ""
    };

    if (order.customerPhone) {
      const message = MESSAGES.orderConfirmation(order);
      await sendWhatsAppFromWebhook(order.customerPhone, message);
      console.log(`✅ Confirmation YouCan envoyée à ${order.customerPhone}`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erreur YouCan webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook/youcan/order-shipped', async (req, res) => {
  console.log('🚚 YouCan: Commande expédiée');
  
  try {
    const youcanOrder = req.body;
    
    const order = {
      orderNumber: youcanOrder.ref || youcanOrder.id,
      customerName: youcanOrder.customer?.first_name || "Client",
      customerPhone: formatPhone(youcanOrder.customer?.phone),
      trackingNumber: youcanOrder.tracking_number,
      city: youcanOrder.shipping?.city
    };

    if (order.customerPhone) {
      const message = MESSAGES.orderShipped(order);
      await sendWhatsAppFromWebhook(order.customerPhone, message);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== WEBHOOK GÉNÉRIQUE (Pour autres plateformes) =====
router.post('/webhook/generic/order', async (req, res) => {
  console.log('📦 Webhook générique: Nouvelle commande');
  
  try {
    const data = req.body;
    
    // Format flexible - s'adapte à différentes structures
    const order = {
      orderNumber: data.order_number || data.orderNumber || data.ref || data.id || "N/A",
      customerName: data.customer_name || data.customerName || data.name || "Client",
      customerPhone: formatPhone(data.customer_phone || data.customerPhone || data.phone),
      items: data.items || data.products || [],
      total: data.total || data.amount || 0,
      shipping: data.shipping || data.shipping_cost || 0,
      address: data.address || data.shipping_address || "",
      city: data.city || ""
    };

    if (order.customerPhone) {
      const message = MESSAGES.orderConfirmation(order);
      await sendWhatsAppFromWebhook(order.customerPhone, message);
      res.status(200).json({ success: true, phone: order.customerPhone });
    } else {
      res.status(400).json({ error: "No phone number provided" });
    }
  } catch (error) {
    console.error('❌ Erreur webhook générique:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== PANIER ABANDONNÉ =====
router.post('/webhook/abandoned-cart', async (req, res) => {
  console.log('🛒 Panier abandonné détecté');
  
  try {
    const data = req.body;
    
    const cart = {
      customerName: data.customer_name || "Client",
      customerPhone: formatPhone(data.phone),
      items: data.items || [],
      total: data.total || 0,
      checkoutUrl: data.checkout_url || data.recovery_url || "#"
    };

    if (cart.customerPhone) {
      const message = MESSAGES.abandonedCart(cart);
      await sendWhatsAppFromWebhook(cart.customerPhone, message);
      res.status(200).json({ success: true });
    } else {
      res.status(400).json({ error: "No phone number" });
    }
  } catch (error) {
    console.error('❌ Erreur panier abandonné:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== HELPERS =====
function formatPhone(phone) {
  if (!phone) return null;
  // Nettoyer le numéro
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // Ajouter le code pays Maroc si nécessaire
  if (cleaned.startsWith('0')) {
    cleaned = '212' + cleaned.substring(1);
  }
  if (!cleaned.startsWith('212') && cleaned.length === 9) {
    cleaned = '212' + cleaned;
  }
  return cleaned.replace('+', '');
}

function formatAddress(addr) {
  if (!addr) return "Non spécifiée";
  const parts = [
    addr.address1,
    addr.address2,
    addr.city,
    addr.province,
    addr.zip
  ].filter(Boolean);
  return parts.join(', ') || "Non spécifiée";
}

// Fonction pour envoyer via WhatsApp (utilise le même système que server.js)
async function sendWhatsAppFromWebhook(phone, message) {
  const axios = require('axios');
  const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
  const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

  if (!WHATSAPP_TOKEN || WHATSAPP_TOKEN.includes('token_ici')) {
    console.log(`📤 [TEST MODE] Message pour ${phone}:\n${message}`);
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

module.exports = router;
