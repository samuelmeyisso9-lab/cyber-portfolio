import { io } from 'socket.io-client'
import { useState, useEffect, useRef } from 'react'
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const API_URL = import.meta.env.PROD ? '' : import.meta.env.VITE_API_URL || 'http://localhost:3001'
const KEY = 'portfolio_samuel_v6'

const INIT = {
  "badge": "🟢 DISPONIBLE — Stage Cybersécurité/SOC Junior · Juin-Juil 2026",
  "name": "Samuel MEYISSO",
  "subtitle": "Analyste Cybersécurité · SOC Junior · Hacking Éthique",
  "desc": "Étudiant en Bachelor Cybersécurité à l'École 89. Spécialisé en sécurité offensive & défensive, analyse réseau, détection de vulnérabilités et tests d'intrusion (SQLi, OWASP).",
  "sectionOrder": ["home", "skills", "projets", "soc", "contact"],
  "positions": {
    "desc": { "x": 196, "y": 6, "w": 708, "s": 1 },
    "stats": { "x": 265, "y": 3, "w": 603, "s": 1 },
    "soft-card": { "x": 168, "y": 27, "w": 486, "s": 1.26 },
    "langs-card": { "x": 14, "y": 27, "w": 202, "s": 1.28 },
    "skill-s2": { "x": 546, "y": 143, "w": 387, "s": 1.3 },
    "skill-s3": { "x": 2, "y": 19, "w": 337, "s": 1.16 },
    "skill-s4": { "x": 539, "y": -299, "w": 424, "s": 1.21 },
    "skill-s1": { "x": 7, "y": 57, "w": 390, "s": 1.0 },
    "tools-title": { "x": -2, "y": -2, "w": null, "s": 1 },
    "skill-s5": { "x": -3, "y": 22, "w": 338 }
  },
  "skills": [
    { "id": "s1", "name": "Network Security (Wireshark, Nmap, BurpSuite)", "level": 82 },
    { "id": "s2", "name": "Penetration Testing (SQLi, OWASP)", "level": 80 },
    { "id": "s3", "name": "SIEM / Log Analysis / SOC", "level": 78 },
    { "id": "s4", "name": "Virtualisation (Kali, VMware, Docker)", "level": 85 },
    { "id": "s5", "name": "Python / Scripting", "level": 72 },
    { "id": "s6", "name": "Cloud & IAM (RBAC, RLS)", "level": 68 }
  ],
  "projects": [
    { "id": "p1", "title": "🖥️ VM Vulnérable — Audit & Surveillance", "desc": "Création d'une VM vulnérable, audit de sécurité complet et surveillance active des OS.", "tags": "Kali Linux · VirtualBox · Audit" },
    { "id": "p2", "title": "🗄️ Base de Données Éducative (10 000+)", "desc": "Conception et déploiement d'un logiciel de gestion éducative à grande échelle.", "tags": "SQL · Docker · Database" },
    { "id": "p3", "title": "🔐 Virtualisation & Cryptographie", "desc": "Virtualisation avancée, cryptographie, stéganographie et chiffrement de données.", "tags": "VMware · Cryptographie · Stégano" },
    { "id": "p4", "title": "🏢 Réseau d'Entreprise Segmenté", "desc": "Conception, implémentation et audit d'un réseau d'entreprise entièrement segmenté.", "tags": "Stormshield · LAN/WAN · Pentest" }
  ],
  "formations": [
    { "id": "f1", "school": "École 89 — Deep Tech", "period": "Sept 2025 – Juin 2026", "diploma": "Bachelor Cybersécurité & Hacking Éthique", "link": "https://ecole-89.com/" },
    { "id": "f2", "school": "F.L.S.H Limoges", "period": "Sept 2024 – Juil 2025", "diploma": "L1 Langues Étrangères Appliquées (EN/G/ESP/ITAL)" },
    { "id": "f3", "school": "Lycée International Cours Lumière", "period": "Sept 2023 – Juil 2024", "diploma": "Baccalauréat Général — Ses, LLcer" }
  ],
  "contact": [
    { "id": "c1", "icon": "📞", "label": "Téléphone", "value": "06 99 58 20 51" },
    { "id": "c2", "icon": "📧", "label": "Email", "value": "samuelmeyisso635@gmail.com" },
    { "id": "c3", "icon": "📍", "label": "Localisation", "value": "Île de France, 77120" },
    { "id": "c4", "icon": "🎓", "label": "École", "value": "École 89 — Deep Tech · Bachelor Cybersécurité", "link": "https://ecole-89.com/" },
    { "id": "c5", "icon": "🔗", "label": "LinkedIn", "value": "https://www.linkedin.com/in/samuel-emmanuel-meyisso-91980b330/" }
  ],
  "langs": [
    { "id": "l1", "lang": "Anglais", "level": "B2" },
    { "id": "l2", "lang": "Espagnol", "level": "B2" },
    { "id": "l3", "lang": "Italien", "level": "A1" }
  ],
  "softSkills": "Autodidacte · Adaptabilité & réactivité · Travail en équipe · Organisation & autonomie · Résilience",
  "tools": "Wireshark · Nmap · BurpSuite · Kali Linux · VMware · Docker · Stormshield · Hashcat · Sqlmap · Metasploit · Packet Tracer · Windows Server"
}

const LOGS = [
  '[INFO]  192.168.1.1  → Port scan detected on 443',
  '[WARN]  10.0.0.45   → Brute force attempt on SSH',
  '[CRIT]  172.16.0.8  → SQL Injection pattern found',
  '[INFO]  192.168.2.3 → Firewall rule triggered #4421',
  '[WARN]  10.0.1.12   → Unusual outbound traffic (8.8 MB)',
  '[CRIT]  192.168.1.9 → Privilege escalation attempt',
  '[INFO]  10.0.0.2    → VPN tunnel established',
  '[WARN]  172.16.1.5  → Failed login x5 on /admin',
  '[CRIT]  192.168.3.1 → Malware signature: Trojan.GenX',
  '[INFO]  10.0.2.18   → IDS alert: CVE-2024-1234',
]

const ATTACK_STEPS = [
  '> Initialisation du scan réseau...',
  '> Découverte des hôtes actifs: 14 trouvés',
  '> Port 22 (SSH) ouvert on 192.168.1.5',
  '> Port 80 (HTTP) ouvert on 192.168.1.7',
  '> Test SQLi sur /login → vulnérable!',
  '> Brute-force SSH (Hashcat)...',
  '> Credential found: admin:password123',
  '> Connexion établie — accès root obtenu 🔴',
  '> ✅ Simulation terminée — rapport généré',
]

function CyberBackground() {
  const [streams, setStreams] = useState([])

  useEffect(() => {
    const spawn = () => {
      const id = Date.now()
      const type = Math.random() > 0.7 ? 'holo' : (Math.random() > 0.5 ? 'green' : 'blue')
      
      let text = ""
      if (type === 'green') {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789*#@$!%/\\"
        text = Array(15).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
      } else if (type === 'blue') {
        text = '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase()
      } else {
        text = " [ HUD_SCAN_ACTIVE ] "
      }

      const newStream = {
        id, type, text,
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: type === 'holo' ? 2 + Math.random() * 3 : 5 + Math.random() * 10
      }
      setStreams(s => [...s.slice(-15), newStream])
    }
    const interval = setInterval(spawn, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1, opacity: 0.3 }}>
      <div className="scanlines" />
      <div className="grid-bg" />
      {streams.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          color: s.type === 'green' ? '#00ff88' : (s.type === 'blue' ? '#00aaff' : '#ffffff'),
          fontFamily: 'monospace',
          fontSize: s.type === 'holo' ? '1.2rem' : '0.7rem',
          fontWeight: s.type === 'holo' ? 'bold' : 'normal',
          textShadow: `0 0 8px ${s.type === 'green' ? '#00ff88' : (s.type === 'blue' ? '#00aaff' : '#fff')}`,
          whiteSpace: 'nowrap',
          animation: `flow-${s.type === 'holo' ? 'blue' : s.type} ${s.speed}s linear forwards`,
          border: s.type === 'holo' ? '1px solid rgba(255,255,255,0.3)' : 'none',
          padding: s.type === 'holo' ? '4px 10px' : '0',
          borderRadius: '4px'
        }}>
          {s.text}
        </div>
      ))}
      <style>{`
        @keyframes flow-green { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
        @keyframes flow-blue { 0% { transform: translateX(100%); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateX(-100vw); opacity: 0; } }
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(0, 255, 136, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 136, 0.05) 1px, transparent 1px); background-size: 50px 50px; }
        .scanlines { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.02) 50%); background-size: 100% 4px; z-index: 1; }
      `}</style>
    </div>
  )
}

function CustomCursor() {
  const dot = useRef(null); const ring = useRef(null)
  const [hovering, setHovering] = useState(false)
  useEffect(() => {
    const move = (e) => {
      if (dot.current) dot.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      if (ring.current) ring.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }
    const down = () => ring.current && (ring.current.style.transform += ' scale(0.6)')
    const up = () => ring.current && (ring.current.style.transform = ring.current.style.transform.replace(' scale(0.6)', ''))
    const over = (e) => {
      const tag = e.target.tagName
      const isBtn = tag === 'BUTTON' || tag === 'A' || e.target.closest('button') || e.target.closest('a') || e.target.contentEditable === 'true'
      setHovering(!!isBtn)
    }
    window.addEventListener('mousemove', move); window.addEventListener('mousedown', down); window.addEventListener('mouseup', up); window.addEventListener('mouseover', over)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mousedown', down); window.removeEventListener('mouseup', up); window.removeEventListener('mouseover', over) }
  }, [])
  return (
    <>
      <div ref={dot} style={{ position: 'fixed', top: -4, left: -4, width: 8, height: 8, background: '#00ff88', borderRadius: '50%', pointerEvents: 'none', zIndex: 99999, boxShadow: '0 0 10px #00ff88' }} />
      <div ref={ring} style={{ position: 'fixed', top: -15, left: -15, border: `1px solid ${hovering ? '#00aaff' : '#00ff88'}`, borderRadius: '50%', pointerEvents: 'none', zIndex: 99998, transition: 'transform 0.15s ease-out, width 0.3s, height 0.3s, border-color 0.3s', width: hovering ? 50 : 30, height: hovering ? 50 : 30, top: hovering ? -25 : -15, left: hovering ? -25 : -15, opacity: 0.5 }} />
      <style>{` body, button, a { cursor: none !important; } @media (max-width: 768px) { body, button, a { cursor: auto !important; } } `}</style>
    </>
  )
}

function FreeDrag({ id, isAdmin, positions, onMove, children, style = {} }) {
  const dragging = useRef(false); const resizing = useRef(false); const origin = useRef({}); const elRef = useRef()
  const pos = positions?.[id] || { x: 0, y: 0, w: null, s: 1 }
  const onMouseDown = (e) => {
    if (!isAdmin || e.target.dataset.resize || e.target.contentEditable === 'true' || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return
    e.preventDefault(); e.stopPropagation(); dragging.current = true
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    const onMv = (e) => { if (dragging.current) onMove(id, { ...pos, x: origin.current.px + (e.clientX - origin.current.mx), y: origin.current.py + (e.clientY - origin.current.my) }) }
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMv); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMv); window.addEventListener('mouseup', onUp)
  }
  const onResizeDown = (e) => {
    e.preventDefault(); e.stopPropagation(); resizing.current = true
    const rect = elRef.current.getBoundingClientRect(); origin.current = { mx: e.clientX, my: e.clientY, w: rect.width, s: pos.s || 1 }
    const onMv = (e) => { if (resizing.current) onMove(id, { ...pos, w: Math.max(80, origin.current.w + (e.clientX - origin.current.mx)) }) }
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMv); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMv); window.addEventListener('mouseup', onUp)
  }
  const onScaleDown = (e) => {
    e.preventDefault(); e.stopPropagation(); resizing.current = true
    const rect = elRef.current.getBoundingClientRect(); origin.current = { my: e.clientY, h: rect.height, s: pos.s || 1 }
    const onMv = (e) => { if (resizing.current) onMove(id, { ...pos, s: Math.min(2, Math.max(0.3, origin.current.s + (e.clientY - origin.current.my) / origin.current.h)) }) }
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMv); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMv); window.addEventListener('mouseup', onUp)
  }
  return (
    <div ref={elRef} onMouseDown={onMouseDown} onDoubleClick={() => isAdmin && onMove(id, { x: 0, y: 0, w: null, s: 1 })}
      style={{ ...style, transform: `translate(${pos.x || 0}px, ${pos.y || 0}px) scale(${pos.s || 1})`, transformOrigin: 'top left', width: pos.w ? `${pos.w}px` : undefined, position: 'relative', zIndex: (pos.x || pos.y) ? 50 : 'auto', cursor: isAdmin ? 'grab' : 'default' }}>
      {children}
      {isAdmin && <div data-resize="w" onMouseDown={onResizeDown} style={{ position: 'absolute', bottom: -6, right: -6, width: 14, height: 14, background: '#00ff88', borderRadius: '3px', cursor: 'se-resize', zIndex: 20 }} />}
      {isAdmin && <div data-resize="s" onMouseDown={onScaleDown} style={{ position: 'absolute', bottom: -6, left: -6, width: 14, height: 14, background: '#00aaff', borderRadius: '3px', cursor: 'sw-resize', zIndex: 20 }} />}
    </div>
  )
}

function ET({ val, onSave, edit, style, tag: Tag = 'span' }) {
  const ref = useRef()
  useEffect(() => { if (ref.current && ref.current.innerText !== val) ref.current.innerText = val }, [val, edit])
  if (!edit) return <Tag style={style}>{val}</Tag>
  return <span ref={ref} contentEditable suppressContentEditableWarning style={{ ...style, outline: '1px dashed #00ff8855', borderRadius: '3px' }} onBlur={e => onSave(e.target.innerText)} />
}

function SortableItem({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }} {...attributes}>{typeof children === 'function' ? children(listeners) : children}</div>
}

function TypeWriter({ text, speed = 60 }) {
  const [d, setD] = useState(''); useEffect(() => { setD(''); let i = 0; const t = setInterval(() => { setD(text.slice(0, ++i)); if (i >= text.length) clearInterval(t) }, speed); return () => clearInterval(t) }, [text])
  return <span>{d}<span className="cursor">_</span></span>
}

function LogFeed() {
  const [logs, setLogs] = useState([LOGS[0]]); const bot = useRef()
  useEffect(() => { let i = 1; const t = setInterval(() => setLogs(p => [...p.slice(-8), LOGS[i++ % LOGS.length]]), 1400); return () => clearInterval(t) }, [])
  useEffect(() => { bot.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])
  return <div style={S.logBox}><div style={S.logH}>● LIVE SOC FEED</div>{logs.map((l, i) => <div key={i} style={{ ...S.logLine, color: l.includes('CRIT') ? '#ff4444' : l.includes('WARN') ? '#ffaa00' : '#00ff88' }}>{l}</div>)}<div ref={bot} /></div>
}

function PwModal({ onLogin, onClose, error, form, setForm }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000ee', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <form onSubmit={onLogin} style={{ background: '#0f0f0f', border: '1px solid #00ff88', borderRadius: '16px', padding: '40px', width: '320px', textAlign: 'center', fontFamily: 'monospace' }}>
        <div style={{ color: '#00ff88', fontSize: '1.4rem', marginBottom: '24px' }}>🔐 RBAC Login</div>
        <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="Utilisateur..." style={S.input} required />
        <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Mot de passe..." style={S.input} required />
        {error && <div style={{ color: '#ff4444', fontSize: '0.8rem', marginBottom: '10px' }}>⚠️ {error}</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}><button type="button" onClick={onClose} style={S.aBtn}>Annuler</button><button type="submit" style={S.btnG}>Entrer →</button></div>
      </form>
    </div>
  )
}

function FileManager({ onClose }) {
  const [files, setFiles] = useState([]); const [loading, setLoading] = useState(true)
  const load = async () => { try { const r = await fetch(`${API_URL}/api/files`); const d = await r.json(); setFiles(d.files || []) } finally { setLoading(false) } }
  useEffect(() => { load() }, [])
  const upload = async (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (ev) => { await fetch(`${API_URL}/api/upload`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: file.name, data: ev.target.result }) }); load() }; reader.readAsDataURL(file) }
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000ee', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#0f0f0f', border: '1px solid #00ff88', borderRadius: '16px', padding: '30px', width: '450px', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}><span style={{ color: '#00ff88' }}>📁 Gestion des fichiers</span><button onClick={onClose} style={{ color: '#555', background: 'none', border: 'none' }}>✕</button></div>
        <input type="file" onChange={upload} style={{ color: '#00ff88', marginBottom: 20 }} />
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>{files.map(f => <div key={f} style={{ color: '#ccc', padding: 5, borderBottom: '1px solid #1a1a1a' }}>{f}</div>)}</div>
      </div>
    </div>
  )
}

function AdminDashboard({ logs, onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000f8', zIndex: 10001, padding: '40px', fontFamily: 'monospace', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #00ff88', paddingBottom: 10, marginBottom: 20 }}><h2 style={{ color: '#00ff88' }}>⚡ CYBER-SECURITY DASHBOARD</h2><button onClick={onClose} style={S.aBtn}>FERMER</button></div>
      {logs.all.map(log => <div key={log.id} style={{ color: '#00ff88', padding: 5, borderBottom: '1px solid #1a1a1a' }}>[{new Date(log.timestamp).toLocaleTimeString()}] {log.action} - {log.user}</div>)}
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(() => { try { const s = localStorage.getItem(KEY); return s ? { ...INIT, ...JSON.parse(s) } : INIT } catch { return INIT } })
  const [section, setSection] = useState('home'); const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('admin_token'))
  const [showModal, setShowModal] = useState(false); const [showFileManager, setShowFileManager] = useState(false); const [saved, setSaved] = useState(false); const [attackLog, setAttackLog] = useState([]); const [attackRunning, setAttackRunning] = useState(false); const [threats, setThreats] = useState(0); const clickCount = useRef(0); const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))
  const [loginForm, setLoginForm] = useState({ username: '', password: '' }); const [loginError, setLoginError] = useState(''); const [liveLogs, setLiveLogs] = useState({ all: [], alerts: [] }); const [showDashboard, setShowDashboard] = useState(false)

  const handleLogin = async (e) => { e.preventDefault(); try { const r = await fetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) }); const d = await r.json(); if (d.token) { localStorage.setItem('admin_token', d.token); setIsAdmin(true); setShowModal(false) } else setLoginError(d.error) } catch { setLoginError('Erreur') } }
  const save = async () => { try { setSaved(false); const r = await fetch(`${API_URL}/api/save-content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }, body: JSON.stringify({ content: data }) }); if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); localStorage.setItem(KEY, JSON.stringify(data)) } } catch { alert('Erreur') } }

  useEffect(() => {
    const down = (e) => { if (isAdmin && (e.key === 'e' || e.key === 'E')) setTimeout(() => window.prompt("EXPORT:", JSON.stringify(data)), 2000) }
    window.addEventListener('keydown', down); return () => window.removeEventListener('keydown', down)
  }, [isAdmin, data])

  const up = (k, v) => setData(d => ({ ...d, [k]: v })); const moveEl = (id, p) => setData(d => ({ ...d, positions: { ...d.positions, [id]: p } })); const A = isAdmin; const fd = (id, c, st) => <FreeDrag id={id} isAdmin={A} positions={data.positions} onMove={moveEl} style={st}>{c}</FreeDrag>

  const renderSection = (id) => {
    if (id === 'home') return (
      <div style={{ padding: '44px 0' }}>
        {fd('badge', <div style={S.badge}><ET val={data.badge} onSave={v => up('badge', v)} edit={A} /></div>, { display: 'inline-block', marginBottom: 22 })}
        {fd('name', <h1 style={S.h1}>{A ? <ET val={data.name} onSave={v => up('name', v)} edit style={{ color: '#00ff88' }} /> : <TypeWriter text={data.name} />}</h1>, { marginBottom: 10 })}
        {fd('subtitle', <div style={{ fontSize: '1.05rem', color: '#00aaff', fontWeight: 'bold' }}><ET val={data.subtitle} onSave={v => up('subtitle', v)} edit={A} /></div>, { marginBottom: 16 })}
        {fd('desc', <div style={{ color: '#777', maxWidth: 680, lineHeight: '1.75' }}><ET val={data.desc} onSave={v => up('desc', v)} edit={A} /></div>, { marginBottom: 32 })}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {fd('langs-card', <div style={S.card}><div style={S.cardT}>🌍 Langues</div>{data.langs.map(l => <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}><span>{l.lang}</span><span style={{ color: '#00ff88' }}>{l.level}</span></div>)}</div>)}
          {fd('soft-card', <div style={S.card}><div style={S.cardT}>🧠 Soft Skills</div>{data.softSkills.split('·').map((s, i) => <div key={i} style={{ color: '#888', padding: '3px 0', fontSize: '0.88rem' }}>→ {s.trim()}</div>)}</div>)}
        </div>
      </div>
    )
    if (id === 'skills') return (
      <div style={S.section}>
        {fd('skills-title', <h2 style={S.h2}>⚡ Compétences Techniques</h2>, { marginBottom: 26 })}
        {data.skills.map(sk => fd(`skill-${sk.id}`, <div style={{ marginBottom: 14 }}><div>{sk.name} <span style={{ color: '#00ff88' }}>{sk.level}%</span></div><div style={{ background: '#181818', height: 7, borderRadius: 4 }}><div style={{ background: 'linear-gradient(90deg,#00ff88,#00aaff)', height: '100%', width: `${sk.level}%` }} /></div></div>))}
        {fd('formations-title', <h3 style={S.h3}>🎓 Formations</h3>, { margin: '20px 0' })}
        {data.formations.map(f => fd(`form-${f.id}`, <div style={S.card}><a href={f.link} target="_blank" style={{ color: '#00ff88', textDecoration: 'none', fontWeight: 'bold' }}>{f.school}</a><div style={{ color: '#555', fontSize: '0.82rem' }}>{f.period}</div><div>{f.diploma}</div></div>, { marginBottom: 12 }))}
      </div>
    )
    if (id === 'projets') return (
      <div style={S.section}>
        {fd('projets-title', <h2 style={S.h2}>📁 Projets Cybersécurité</h2>)}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {data.projects.map(p => fd(`proj-${p.id}`, <div style={S.card}><h3>{p.title}</h3><p style={{ color: '#777', fontSize: '0.88rem', margin: '10px 0' }}>{p.desc}</p><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><span style={{ color: '#00aaff', fontSize: '0.75rem' }}>{p.tags}</span>{p.file && <a href={`/docs/${p.file}`} target="_blank" style={{ color: '#00ff88', fontSize: '0.75rem', textDecoration: 'none' }}>📄 PDF</a>}</div></div>))}
        </div>
      </div>
    )
    if (id === 'soc') return <div style={S.section}><h2>🖥️ SOC Live</h2><LogFeed /></div>
    if (id === 'contact') return (
      <div style={S.section}>
        {fd('contact-title', <h2 style={S.h2}>📡 Contact</h2>)}
        <div style={{ ...S.card, maxWidth: 580 }}>{data.contact.map(c => <div key={c.id} style={{ padding: '12px 0', borderBottom: '1px solid #161616' }}><strong>{c.label}:</strong> {c.link ? <a href={c.link} target="_blank" style={{ color: '#00ff88', textDecoration: 'none' }}>{c.value}</a> : c.value}</div>)}</div>
      </div>
    )
    return null
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: -10 }} />
      <CyberBackground />
      <CustomCursor />
      <div style={S.root}>
        {showModal && <PwModal onLogin={handleLogin} onClose={() => setShowModal(false)} error={loginError} form={loginForm} setForm={setLoginForm} />}
        {A && <div style={S.adminBar}><span style={{ color: '#00ff88' }}>✏️ MODE ÉDITION [V6]</span><button onClick={save} style={S.aSave}>{saved ? '✅' : 'Save'}</button><button onClick={() => setIsAdmin(false)} style={S.aBtn}>🔒</button></div>}
        <nav style={S.nav}><span style={S.logo} onClick={() => { clickCount.current++; if (clickCount.current > 4) setShowModal(true) }}>{'<Samuel.Meyisso />'}</span><div>{data.sectionOrder.map(s => <button key={s} onClick={() => setSection(s)} style={{ ...S.navBtn, color: section === s ? '#00ff88' : '#444' }}>{s.toUpperCase()}</button>)}</div></nav>
        <main style={S.main}>{renderSection(section)}</main>
        <footer style={{ textAlign: 'center', color: '#1a1a1a', padding: 20 }}>Samuel Meyisso · École 89</footer>
      </div>
      <style>{` * { box-sizing: border-box; } body { background: #0a0a0a; color: #fff; margin: 0; user-select: none; } .cursor { animation: blink 1s steps(1) infinite; } @keyframes blink { 50% { opacity: 0; } } `}</style>
    </>
  )
}

const S = {
  root: { minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'monospace', paddingBottom: 80 },
  adminBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#060f06', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', zIndex: 1000 },
  aBtn: { background: 'none', border: '1px solid #00ff8833', color: '#00ff88', cursor: 'pointer', padding: '5px 10px' },
  aSave: { background: '#00ff88', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', padding: '5px 15px' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', background: '#0d0d0d', position: 'sticky', top: 0, zIndex: 100 },
  logo: { color: '#00ff88', fontWeight: 'bold', cursor: 'pointer' },
  navBtn: { background: 'none', border: 'none', cursor: 'pointer', margin: '0 10px', fontSize: '0.8rem' },
  main: { maxWidth: 1100, margin: '0 auto', padding: '40px 20px' },
  badge: { color: '#00ff88', border: '1px solid #00ff8822', display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontSize: '0.82rem' },
  h1: { fontSize: '3rem', color: '#00ff88', margin: 0 },
  card: { background: '#0f0f0f', border: '1px solid #1a1a1a', padding: 20, borderRadius: 12 },
  cardT: { color: '#00ff88', fontWeight: 'bold', marginBottom: 12 },
  section: { padding: '20px 0' },
  h2: { fontSize: '1.7rem', color: '#00ff88', borderBottom: '1px solid #1a1a1a', paddingBottom: 10, display: 'inline-block' },
  h3: { color: '#00aaff' },
  logBox: { background: '#050505', border: '1px solid #111', padding: 15, height: 240, overflowY: 'auto' },
  logH: { color: '#00ff88', fontWeight: 'bold', marginBottom: 10 },
  logLine: { color: '#00ff88', borderBottom: '1px solid #0c0c0c', padding: '3px 0' },
  input: { width: '100%', padding: 10, marginBottom: 10, background: '#000', border: '1px solid #333', color: '#fff' },
  btnG: { background: '#00ff88', border: 'none', color: '#000', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }
}
