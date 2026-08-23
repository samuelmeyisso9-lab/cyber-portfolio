import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Server } from 'socket.io';
import http from 'http';
import axios from 'axios';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Chargement des variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_not_safe';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
// Hashage du mot de passe défini dans le .env
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Samuel6352050', 10);

// --- SÉCURITÉ RÉSEAU ---
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https:"],
            "connect-src": ["'self'", "https://ip-api.com", "ws:", "wss:"],
        },
    },
}));
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- BOUCLIER DE SÉCURITÉ (ANTI-SCAN & ANTI-BOT) ---
const BLACKLISTED_UA = ["sqlmap", "nmap", "nikto", "dirbuster", "goby", "python-requests", "curl", "wget", "scan"];
app.use((req, res, next) => {
    const ua = req.headers['user-agent']?.toLowerCase() || '';
    if (BLACKLISTED_UA.some(k => ua.includes(k))) {
        addLog({ type: 'ALERT', user: 'BOT/SCANNER', action: `BLOCKED_SCANNER_UA: ${ua.substring(0, 20)}...`, ip: req.ip, severity: 'HIGH' });
        emitSoc('CRIT', req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            parseClient(req.headers['user-agent']), geoCache.get(cleanIp(req.headers['x-forwarded-for'] || ''))?.place || '',
            `Scanner bloqué (${ua.split(/[\/\s]/)[0]})`);
        return res.status(403).json({ error: "Security Policy Violation: Access Denied" });
    }
    next();
});

// Protection spécifique pour les PDF
app.get('/docs/:file', (req, res) => {
    const filePath = path.join(__dirname, 'dist', 'docs', req.params.file);
    
    // Headers de sécurité
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Cache long pour un chargement instantané des PDF déjà préchargés
    res.setHeader('Cache-Control', 'public, max-age=86400');
    
    // Envoi direct pour supporter le streaming (Range Requests)
    res.sendFile(filePath, (err) => {
        if (err) {
            res.status(404).send('Document non trouvé');
        }
    });
});

// SERVIR LE FRONTEND (BUILD DE PRODUCTION)
app.use(express.static(path.join(__dirname, 'dist')));

// PROTECTION BRUTE-FORCE
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Trop de tentatives. Accès bloqué pour 15 minutes." },
    handler: (req, res, next, options) => {
        addLog({ type: 'ALERT', user: 'SYSTEM', action: 'BRUTE_FORCE_DETECTED', ip: req.ip, severity: 'HIGH' });
        emitSoc('CRIT', req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            parseClient(req.headers['user-agent']), '',
            'Brute force sur /api/login — IP bloquée 15 min');
        res.status(options.statusCode).send(options.message);
    }
});

const PORTFOLIO_PATH = path.join(__dirname, '.');
const DATA_FILE = path.join(PORTFOLIO_PATH, 'src', 'App.jsx');

let liveLogs = [];
let securityAlerts = [];
let socFeed = []; // flux public temps réel (données réelles, IP masquées RGPD)
const MAX_LOGS = 500;
const MAX_SOC = 40;

// --- ANONYMISATION RGPD : on ne diffuse jamais une IP complète ---
const maskIp = (raw) => {
    let ip = String(raw || '').split(',')[0].trim();
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    if (ip === '::1' || ip === '127.0.0.1') return 'localhost';
    const v4 = ip.split('.');
    if (v4.length === 4) return `${v4[0]}.${v4[1]}.xxx.xxx`;
    return ip.split(':').slice(0, 4).join(':') + ':xxxx';
};

// --- GÉOLOCALISATION AVEC CACHE (limite : 45 req/min sur ip-api.com) ---
// NB : une IP pointe vers le nœud du FAI, pas l'adresse réelle du visiteur.
// On n'affiche donc JAMAIS la ville (souvent fausse) mais région/pays + FAI,
// comme le font les dashboards professionnels (Cloudflare, AWS…).
const geoCache = new Map();
const cleanIp = (raw) => {
    let ip = String(raw || '').split(',')[0].trim();
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    return (ip === '::1' || ip === '127.0.0.1') ? '' : ip;
};
async function lookupGeo(rawIp) {
    const ip = cleanIp(rawIp);
    if (!ip) return { place: 'Réseau local', isp: '', country: '' };
    if (geoCache.has(ip)) return geoCache.get(ip);
    try {
        const r = await axios.get(
            `http://ip-api.com/json/${ip}?fields=status,regionName,country,countryCode,isp`,
            { timeout: 3000 }
        );
        const d = r.data || {};
        const geo = d.status === 'success'
            ? {
                place: [d.regionName, d.countryCode].filter(Boolean).join(', ') || d.country || 'Inconnue',
                isp: (d.isp || '').split(/\s*[-,(]/)[0].trim(), // ex. "Orange France" → "Orange"
                country: d.country || '',
            }
            : { place: 'Inconnue', isp: '', country: '' };
        geoCache.set(ip, geo);
        return geo;
    } catch { return { place: 'Inconnue', isp: '', country: '' }; }
}

// --- ANALYSE DU USER-AGENT ---
function parseClient(ua = '') {
    const browser = /Edg\//.test(ua) ? 'Edge'
        : /OPR\/|Opera/.test(ua) ? 'Opera'
        : /Firefox\//.test(ua) ? 'Firefox'
        : /Chrome\//.test(ua) ? 'Chrome'
        : /Safari\//.test(ua) ? 'Safari'
        : /bot|crawl|spider|slurp|bingpreview/i.test(ua) ? 'Bot/Indexeur'
        : 'Inconnu';
    const os = /Windows/.test(ua) ? 'Windows'
        : /Android/.test(ua) ? 'Android'
        : /iPhone|iPad|iPod/.test(ua) ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
        : /Linux/.test(ua) ? 'Linux' : '—';
    return `${browser} · ${os}`;
}

// Diffusion publique vers la salle SOC (événements RÉELS, anonymisés)
function emitSoc(sev, ipRaw, client, location, action) {
    const entry = {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        sev, // 'INFO' | 'WARN' | 'CRIT'
        ip: maskIp(ipRaw),
        client,
        location,
        action,
    };
    socFeed.unshift(entry);
    if (socFeed.length > MAX_SOC) socFeed.pop();
    io.to('soc-room').emit('soc-event', entry);
}

const addLog = (log) => {
    const entry = { ...log, id: Date.now(), timestamp: new Date().toISOString() };
    liveLogs.unshift(entry);
    if (log.type === 'ALERT' || log.severity === 'HIGH') {
        securityAlerts.unshift(entry);
    }
    if (liveLogs.length > MAX_LOGS) liveLogs.pop();
    io.to('admin-room').emit('new-log', entry);
};

// Détecteur de rafales (trop de requêtes depuis une même IP)
const burstMap = new Map(); // ip -> { count, start, warned }
setInterval(() => burstMap.clear(), 5 * 60 * 1000);
app.use((req, res, next) => {
    const fullIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ip = cleanIp(fullIp);
    if (ip && !ip.startsWith('localhost')) {
        const now = Date.now();
        const b = burstMap.get(ip) || { count: 0, start: now, warned: false };
        b.count++;
        if (now - b.start < 60_000 && b.count > 80 && !b.warned) {
            b.warned = true;
            emitSoc('WARN', fullIp, parseClient(req.headers['user-agent']),
                geoCache.get(ip)?.place || '', `Rafale détectée : ${b.count} requêtes/min`);
        }
        burstMap.set(ip, b);
    }
    next();
});

// Middleware RBAC
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        addLog({ type: 'ALERT', user: 'UNKNOWN', action: 'UNAUTHORIZED_API_ACCESS', ip: req.ip, severity: 'HIGH' });
        return res.status(401).json({ error: 'Accès refusé' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err || user.role !== 'ADMIN') {
            addLog({ type: 'ALERT', user: 'HACKER?', action: 'INVALID_TOKEN_ATTEMPT', ip: req.ip, severity: 'CRITICAL' });
            return res.status(403).json({ error: 'Interdit' });
        }
        req.user = user;
        next();
    });
};

// --- ROUTES API ---

app.post('/api/login', loginLimiter, async (req, res) => {
    const { username, password } = req.body;
    
    const sqlKeywords = ["SELECT", "UNION", "DROP", "OR 1=1", "--"];
    if (sqlKeywords.some(k => JSON.stringify(req.body).toUpperCase().includes(k))) {
        addLog({ type: 'ALERT', user: username || 'attacker', action: 'SQL_INJECTION_PATTERN', ip: req.ip, severity: 'CRITICAL' });
        emitSoc('CRIT', req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            parseClient(req.headers['user-agent']), '', 'Pattern SQLi détecté sur /api/login');
    }

    if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
        const token = jwt.sign({ 
            username, 
            role: 'ADMIN',
            fingerprint: req.headers['user-agent'] 
        }, JWT_SECRET, { expiresIn: '1h' });
        
        addLog({ type: 'AUTH', user: username, action: 'LOGIN_SUCCESS', ip: req.ip });
        return res.json({ token });
    }

    addLog({ type: 'SECURITY', user: username || 'unknown', action: 'LOGIN_FAILURE', ip: req.ip });
    res.status(401).json({ error: 'Identifiants incorrects' });
});

app.post('/api/track', async (req, res) => {
    const fullIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const ua = String(req.headers['user-agent'] || '');
    // Le ping Keep-Alive interne (axios) n'est pas un visiteur : on le tait dans le flux public
    const isKeepAlive = /^axios|^node|^undici/i.test(ua);

    if (!isKeepAlive) {
        const geo = await lookupGeo(fullIp);
        const client = parseClient(ua);
        addLog({ type: 'VISIT', user: 'Visitor', ip: fullIp, location: geo.place, action: 'Viewed Portfolio' });
        emitSoc('INFO', fullIp, client, geo.place, 'Nouvelle connexion au portfolio');
    }
    res.json({ success: true });
});

app.post('/api/save-content', authenticate, async (req, res) => { 
    try {
        const { content } = req.body;
        addLog({ type: 'ADMIN_ACTION', user: req.user.username, action: 'MODIFIED_WEBSITE_CONTENT', ip: req.ip });
        let fileContent = await fs.readFile(DATA_FILE, 'utf-8');
        const startMarker = 'const INIT = {';
        const endMarker = '\n}';
        const startIndex = fileContent.indexOf(startMarker);
        const endIndex = fileContent.indexOf(endMarker, startIndex);
        if (startIndex === -1 || endIndex === -1) return res.status(500).json({ error: 'Data error' });
        const newInit = `const INIT = ${JSON.stringify(content, null, 2)}`;
        const newFileContent = fileContent.substring(0, startIndex) + newInit + fileContent.substring(endIndex + 2);
        await fs.writeFile(DATA_FILE, newFileContent, 'utf-8');
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/logs', authenticate, (req, res) => {
    res.json({ all: liveLogs, alerts: securityAlerts });
});

// ROUTE CATCH-ALL POUR LE SPA (REACT)
app.use((req, res) => {
    // On ne sert l'index que pour les requêtes GET qui ne sont pas des fichiers
    if (req.method === 'GET' && !req.path.includes('.')) {
        return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
    // 404 réel = sonde/scan d'un bot ou fichier manquant : événement SOC authentique
    const fullIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    emitSoc('WARN', fullIp, parseClient(req.headers['user-agent']),
        geoCache.get(cleanIp(fullIp))?.place || '', `Sonde détectée : ${req.method} ${String(req.path).slice(0, 48)}`);
    res.status(404).send('Non trouvé');
});

// --- SOCKET.IO ---
io.on('connection', (socket) => {
    socket.on('join-admin', (token) => {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (!err && user.role === 'ADMIN') {
                socket.join('admin-room');
                socket.emit('init-logs', { all: liveLogs, alerts: securityAlerts });
            }
        });
    });

    // Salle publique du SOC : le visiteur reçoit les VRAIS événements
    // (IP masquées RGPD) + ses propres informations de connexion.
    socket.on('join-soc', async () => {
        try {
            socket.join('soc-room');
            const fullIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
            const ua = socket.handshake.headers['user-agent'] || '';
            const geo = await lookupGeo(fullIp);
            socket.emit('you', {
                ip: maskIp(fullIp),
                client: parseClient(ua),
                location: geo.isp ? `${geo.place} · ${geo.isp}` : geo.place,
            });
            socket.emit('soc-init', socFeed.slice(0, 12));
        } catch { /* la salle reste joignable même si l'enrichissement échoue */ }
    });
});

server.listen(PORT, () => {
    console.log(`FORTERESSE ACTIVE : Écoute sur le port ${PORT}`);
    
    // Système Keep-Alive pour éviter la mise en veille sur Render
    const RENDER_URL = `https://samuel-meyisso-portfolio.onrender.com/api/track`;
    setInterval(async () => {
        try {
            await axios.post(RENDER_URL);
            console.log('KEEP_ALIVE: Ping envoyé avec succès');
        } catch (error) {
            console.error('KEEP_ALIVE_ERROR:', error.message);
        }
    }, 13 * 60 * 1000); // Ping toutes les 13 minutes (Render dort après 15 min)
});

