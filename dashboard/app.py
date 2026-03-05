"""
WhatsApp Bot IA - Dashboard de Supervision
==========================================
Interface web pour superviser et tester tous les composants du projet.
"""

from flask import Flask, render_template, jsonify, request
import requests
import subprocess
import json
import os
from datetime import datetime

app = Flask(__name__)

# Configuration
CONFIG = {
    "railway_url": "https://whatsapp-bot-production-2cc1.up.railway.app",
    "ollama_local": "http://localhost:11434",
    "ngrok_api": "http://127.0.0.1:4040/api/tunnels",
    "whatsapp_phone_id": "1026114920581795",
    "whatsapp_business_id": "1525207402945764",
}

def check_service(url, timeout=5):
    """Vérifie si un service est accessible"""
    try:
        response = requests.get(url, timeout=timeout, headers={"ngrok-skip-browser-warning": "true"})
        return {
            "status": "online",
            "code": response.status_code,
            "response_time": response.elapsed.total_seconds()
        }
    except requests.exceptions.Timeout:
        return {"status": "timeout", "code": None, "response_time": None}
    except requests.exceptions.ConnectionError:
        return {"status": "offline", "code": None, "response_time": None}
    except Exception as e:
        return {"status": "error", "code": None, "error": str(e)}

def get_ngrok_url():
    """Récupère l'URL ngrok active"""
    try:
        response = requests.get(CONFIG["ngrok_api"], timeout=3)
        data = response.json()
        if data.get("tunnels"):
            return data["tunnels"][0].get("public_url", "Non disponible")
        return "Aucun tunnel actif"
    except:
        return "ngrok non accessible"

@app.route('/')
def index():
    """Page principale du dashboard"""
    return render_template('index.html')

@app.route('/api/status')
def get_status():
    """Récupère le statut de tous les services"""
    ngrok_url = get_ngrok_url()
    
    status = {
        "timestamp": datetime.now().isoformat(),
        "services": {
            "railway": {
                "name": "Railway (Backend)",
                "url": CONFIG["railway_url"],
                **check_service(f"{CONFIG['railway_url']}/health")
            },
            "ollama_local": {
                "name": "Ollama (Local)",
                "url": CONFIG["ollama_local"],
                **check_service(f"{CONFIG['ollama_local']}/api/tags")
            },
            "ngrok": {
                "name": "ngrok Tunnel",
                "url": ngrok_url,
                **check_service(f"{ngrok_url}/api/tags" if ngrok_url.startswith("http") else "")
            }
        },
        "config": {
            "ngrok_url": ngrok_url,
            "phone_number_id": CONFIG["whatsapp_phone_id"],
            "whatsapp_business_id": CONFIG["whatsapp_business_id"]
        }
    }
    
    return jsonify(status)

@app.route('/api/test-llama', methods=['POST'])
def test_llama():
    """Teste Llama via différentes routes"""
    data = request.json
    message = data.get('message', 'Bonjour')
    route = data.get('route', 'local')  # local, ngrok, railway
    
    try:
        if route == 'local':
            url = f"{CONFIG['ollama_local']}/api/generate"
            payload = {
                "model": "llama3.1:8b",
                "prompt": message,
                "stream": False
            }
            response = requests.post(url, json=payload, timeout=120)
            result = response.json()
            return jsonify({
                "success": True,
                "route": "Local Ollama",
                "response": result.get("response", "")[:500]
            })
            
        elif route == 'ngrok':
            ngrok_url = get_ngrok_url()
            url = f"{ngrok_url}/api/generate"
            payload = {
                "model": "llama3.1:8b",
                "prompt": message,
                "stream": False
            }
            response = requests.post(url, json=payload, timeout=120, 
                                   headers={"ngrok-skip-browser-warning": "true"})
            result = response.json()
            return jsonify({
                "success": True,
                "route": "Via ngrok",
                "response": result.get("response", "")[:500]
            })
            
        elif route == 'railway':
            url = f"{CONFIG['railway_url']}/test-llama?message={message}"
            response = requests.get(url, timeout=120)
            result = response.json()
            return jsonify({
                "success": True,
                "route": "Railway → ngrok → Ollama",
                "response": result.get("response", "")[:500]
            })
            
    except Exception as e:
        return jsonify({
            "success": False,
            "route": route,
            "error": str(e)
        })

@app.route('/api/ollama/models')
def get_models():
    """Liste les modèles Ollama disponibles"""
    try:
        response = requests.get(f"{CONFIG['ollama_local']}/api/tags", timeout=5)
        data = response.json()
        models = [
            {
                "name": m["name"],
                "size": f"{m['size'] / 1e9:.1f} GB",
                "family": m["details"].get("family", "unknown")
            }
            for m in data.get("models", [])
        ]
        return jsonify({"success": True, "models": models})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/railway/logs')
def get_railway_logs():
    """Récupère les derniers logs Railway (simulé)"""
    try:
        # Test health endpoint
        response = requests.get(f"{CONFIG['railway_url']}/health", timeout=5)
        return jsonify({
            "success": True,
            "health": response.json(),
            "message": "Railway est en ligne"
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/architecture')
def get_architecture():
    """Retourne l'architecture du projet"""
    architecture = {
        "nodes": [
            {"id": "user", "label": "👤 Utilisateur WhatsApp", "type": "user"},
            {"id": "meta", "label": "📱 Meta WhatsApp API", "type": "external"},
            {"id": "railway", "label": "🚂 Railway (Node.js)", "type": "server"},
            {"id": "ngrok", "label": "🔗 ngrok Tunnel", "type": "tunnel"},
            {"id": "ollama", "label": "🤖 Ollama (Local)", "type": "ai"},
            {"id": "llama", "label": "🦙 Llama 3.1:8b", "type": "model"},
            {"id": "gpu", "label": "🎮 RTX 4060 8GB", "type": "hardware"}
        ],
        "edges": [
            {"from": "user", "to": "meta", "label": "Message WhatsApp"},
            {"from": "meta", "to": "railway", "label": "Webhook POST"},
            {"from": "railway", "to": "ngrok", "label": "HTTP Request"},
            {"from": "ngrok", "to": "ollama", "label": "Tunnel"},
            {"from": "ollama", "to": "llama", "label": "Inference"},
            {"from": "llama", "to": "gpu", "label": "CUDA"},
            {"from": "railway", "to": "meta", "label": "Réponse API"},
            {"from": "meta", "to": "user", "label": "Message Bot"}
        ],
        "flow": [
            "1️⃣ L'utilisateur envoie un message sur WhatsApp",
            "2️⃣ Meta reçoit le message et appelle le webhook Railway",
            "3️⃣ Railway reçoit le webhook et extrait le message",
            "4️⃣ Railway envoie le message à Ollama via ngrok",
            "5️⃣ Ollama utilise Llama 3.1 (GPU RTX 4060) pour générer une réponse",
            "6️⃣ La réponse remonte: Ollama → ngrok → Railway",
            "7️⃣ Railway envoie la réponse via l'API WhatsApp",
            "8️⃣ L'utilisateur reçoit la réponse du bot"
        ]
    }
    return jsonify(architecture)

@app.route('/api/test-whatsapp', methods=['POST'])
def test_whatsapp():
    """Teste l'envoi d'un message WhatsApp"""
    data = request.json
    token = data.get('token', '')
    to_number = data.get('to', '')
    
    if not token or not to_number:
        return jsonify({"success": False, "error": "Token et numéro requis"})
    
    try:
        url = f"https://graph.facebook.com/v22.0/{CONFIG['whatsapp_phone_id']}/messages"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "template",
            "template": {
                "name": "hello_world",
                "language": {"code": "en_US"}
            }
        }
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        return jsonify({
            "success": response.status_code == 200,
            "status_code": response.status_code,
            "response": response.json()
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    print("🚀 Dashboard WhatsApp Bot IA")
    print("📊 Ouvrez http://localhost:5000 dans votre navigateur")
    app.run(debug=True, port=5000)
