# 🛒 Intégration E-commerce - WhatsApp Bot IA

Ce guide explique comment connecter votre boutique Shopify ou YouCan au bot WhatsApp pour envoyer des confirmations automatiques.

---

## 📋 Endpoints disponibles

| Endpoint | Description |
|----------|-------------|
| `/ecommerce/webhook/shopify/order-created` | Nouvelle commande Shopify |
| `/ecommerce/webhook/shopify/order-fulfilled` | Commande expédiée Shopify |
| `/ecommerce/webhook/youcan/order-created` | Nouvelle commande YouCan |
| `/ecommerce/webhook/youcan/order-shipped` | Commande expédiée YouCan |
| `/ecommerce/webhook/generic/order` | Webhook universel |
| `/ecommerce/webhook/abandoned-cart` | Panier abandonné |

---

## 🟢 Configuration Shopify

### Étape 1 : Créer un Webhook

1. Allez dans **Admin Shopify** → **Paramètres** → **Notifications**
2. Descendez jusqu'à **Webhooks** et cliquez sur **Créer un webhook**
3. Configurez :
   - **Événement** : `Order creation` (Création de commande)
   - **Format** : JSON
   - **URL** : `https://whatsapp-bot-production-2cc1.up.railway.app/ecommerce/webhook/shopify/order-created`
4. Cliquez sur **Enregistrer**

### Étape 2 : Ajouter le webhook d'expédition

Répétez pour l'événement `Order fulfillment` :
- **URL** : `https://whatsapp-bot-production-2cc1.up.railway.app/ecommerce/webhook/shopify/order-fulfilled`

### Vérification

Quand un client passe une commande avec un numéro de téléphone, il recevra automatiquement un message WhatsApp !

---

## 🔵 Configuration YouCan

### Étape 1 : Accéder aux Webhooks

1. Connectez-vous à votre **Dashboard YouCan**
2. Allez dans **Paramètres** → **Intégrations** → **Webhooks**
3. Cliquez sur **Ajouter un Webhook**

### Étape 2 : Configurer le webhook commande

- **Nom** : WhatsApp Confirmation
- **URL** : `https://whatsapp-bot-production-2cc1.up.railway.app/ecommerce/webhook/youcan/order-created`
- **Événement** : Nouvelle commande
- **Méthode** : POST

### Étape 3 : Configurer le webhook expédition

- **URL** : `https://whatsapp-bot-production-2cc1.up.railway.app/ecommerce/webhook/youcan/order-shipped`
- **Événement** : Commande expédiée

---

## 🔧 Webhook Générique (Autres plateformes)

Pour toute autre plateforme, utilisez le webhook générique :

**URL** : `https://whatsapp-bot-production-2cc1.up.railway.app/ecommerce/webhook/generic/order`

**Format JSON attendu** :
```json
{
  "order_number": "12345",
  "customer_name": "Ahmed",
  "customer_phone": "+212612345678",
  "items": [
    {"name": "T-shirt Noir", "quantity": 2, "price": 149},
    {"name": "Jean Slim", "quantity": 1, "price": 299}
  ],
  "total": 597,
  "shipping": 30,
  "address": "123 Rue Mohammed V, Casablanca",
  "city": "Casablanca"
}
```

---

## 🛒 Panier Abandonné

Envoyez une notification quand un client abandonne son panier :

**URL** : `https://whatsapp-bot-production-2cc1.up.railway.app/ecommerce/webhook/abandoned-cart`

**Format JSON** :
```json
{
  "customer_name": "Sara",
  "phone": "+212698765432",
  "items": [
    {"name": "Robe d'été", "price": 199}
  ],
  "total": 199,
  "checkout_url": "https://votre-boutique.com/checkout/recover/abc123"
}
```

---

## 📱 Messages automatiques envoyés

### Confirmation de commande
```
🎉 Commande Confirmée !

Bonjour Ahmed 👋

Merci pour votre commande chez NessYou !

📦 Détails de la commande #12345
• T-shirt Noir x2 - 149 MAD
• Jean Slim x1 - 299 MAD

💰 Total: 597 MAD
🚚 Livraison: 30 MAD
📍 Adresse: 123 Rue Mohammed V, Casablanca

⏰ Livraison prévue dans 3-5 jours ouvrés.

Besoin d'aide ? Répondez à ce message ! 🙏
```

### Commande expédiée
```
🚚 Votre commande est en route !

Bonjour Ahmed 👋

Votre commande #12345 a été expédiée !

📦 Tracking: ABC123456
🏠 Livraison à: Casablanca

Vous serez contacté(e) par le livreur. 📞
```

### Panier abandonné
```
👋 Vous avez oublié quelque chose ?

Bonjour Sara,

Vous avez laissé des articles dans votre panier :
• Robe d'été - 199 MAD

💰 Total: 199 MAD
🚚 + 30 MAD livraison

👉 Finalisez votre commande : [lien]
```

---

## 🧪 Tester l'intégration

### Test avec cURL

```bash
curl -X POST https://whatsapp-bot-production-2cc1.up.railway.app/ecommerce/webhook/generic/order \
  -H "Content-Type: application/json" \
  -d '{
    "order_number": "TEST-001",
    "customer_name": "Test Client",
    "customer_phone": "212631298588",
    "items": [{"name": "Produit Test", "quantity": 1, "price": 99}],
    "total": 99,
    "shipping": 30,
    "address": "Adresse test",
    "city": "Casablanca"
  }'
```

### Test via Dashboard Python

1. Ouvrez http://localhost:5000
2. Utilisez la section "Test E-commerce" (à ajouter)

---

## ⚙️ Personnalisation

Modifiez le fichier `ecommerce-webhooks.js` pour :

- Changer le nom du store (`STORE_CONFIG.name`)
- Modifier les frais de livraison
- Personnaliser les messages
- Ajouter des langues (Darija, Anglais)

---

## 🔒 Sécurité

Pour sécuriser les webhooks, ajoutez une vérification de signature :

```javascript
// Dans ecommerce-webhooks.js
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

function verifySignature(req) {
  const signature = req.headers['x-shopify-hmac-sha256'];
  // Vérifier la signature...
}
```

---

## 📞 Support

- WhatsApp : +212 635-611933
- Email : support@nessyou.ma

---

*Dernière mise à jour : Mars 2026*
