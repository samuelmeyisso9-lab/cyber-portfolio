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

// SERVIR LE FRONTEND (BUILD DE PRODUCTION)
app.use(express.static(path.join(__dirname, 'dist')));

// PROTECTION BRUTE-FORCE
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: "Trop de tentatives. Accès bloqué pour 15 minutes." },
    handler: (req, res, next, options) => {
        addLog({ type: 'ALERT', user: 'SYSTEM', action: 'BRUTE_FORCE_DETECTED', ip: req.ip, severity: 'HIGH' });
        res.status(options.statusCode).send(options.message);
    }
});

const PORTFOLIO_PATH = path.join(__dirname, '.');
const DATA_FILE = path.join(PORTFOLIO_PATH, 'src', 'App.jsx');

let liveLogs = [];
let securityAlerts = [];
const MAX_LOGS = 500;

const addLog = (log) => {
    const entry = { ...log, id: Date.now(), timestamp: new Date().toISOString() };
    liveLogs.unshift(entry);
    if (log.type === 'ALERT' || log.severity === 'HIGH') {
        securityAlerts.unshift(entry);
    }
    if (liveLogs.length > MAX_LOGS) liveLogs.pop();
    io.to('admin-room').emit('new-log', entry);
};

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
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    let location = 'Inconnue';
    try {
        const response = await axios.get(`http://ip-api.com/json/${ip === '::1' ? '' : ip}`);
        if (response.data.status === 'success') {
            location = `${response.data.city}, ${response.data.country}`;
        }
    } catch (e) {}
    addLog({ type: 'VISIT', user: 'Visitor', ip, location, action: 'Viewed Portfolio' });
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
app.get('*', (req, res) => {
    // Si c'est une requête pour un fichier (avec extension) qui n'a pas été trouvé par express.static
    if (req.path.includes('.')) {
        return res.status(404).send('Fichier non trouvé');
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
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
});

server.listen(PORT, () => console.log(`FORTERESSE ACTIVE : Écoute sur le port ${PORT}`));

