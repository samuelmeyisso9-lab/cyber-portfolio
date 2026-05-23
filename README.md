# 🛡️ Cyber Portfolio - Samuel Meyisso
## Analyste Cybersécurité | SOC Junior | Hacking Éthique

Ce portfolio est une application full-stack conçue avec une approche "Security-by-Design". Il simule une interface de monitoring SOC (Security Operations Center) tout en présentant mes compétences, projets et formations.

## 🚀 Caractéristiques Techniques

- **Frontend** : React 19 + Vite + Tailwind CSS / Vanilla CSS.
- **Backend** : Node.js (Express) - API REST & WebSockets (Socket.io).
- **Sécurité** : 
  - **Helmet.js** : Configuration stricte des headers HTTP.
  - **Rate Limiting** : Protection contre les attaques par force brute sur l'authentification.
  - **RBAC (Role-Based Access Control)** : Accès restreint à l'interface d'administration via JWT.
  - **Audit Logging** : Système de logs en temps réel via WebSockets.
- **Déploiement** : Prêt pour Render (via `render.yaml`).

## 🛠️ Installation Locale

1. Cloner le dépôt :
   ```bash
   git clone <votre-repo-url>
   cd cyber-portfolio
   ```

2. Installer les dépendances :
   ```bash
   npm install
   ```

3. Configurer l'environnement :
   Créer un fichier `.env` à la racine :
   ```env
   JWT_SECRET=votre_secret_ici
   ADMIN_USERNAME=samuel
   ADMIN_PASSWORD=votre_mot_de_paite
   PORT=3001
   ```

4. Lancer en mode développement :
   ```bash
   npm run dev # Pour le frontend
   node server.js # Pour le backend
   ```

## 📈 Structure du Projet

- `/src` : Code source React.
- `server.js` : Serveur API et gestion de la sécurité.
- `render.yaml` : Configuration pour le déploiement Cloud.
- `/dist` : Build de production optimisé.

## 👤 Contact

- **Email** : samuelmeyisso635@gmail.com
- **LinkedIn** : [Samuel Meyisso](https://www.linkedin.com/in/samuel-emmanuel-meyisso-91980b330/)
- **Localisation** : Coulommiers, 77120
