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
const KEY = 'portfolio_samuel_v5'

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
  '[INFO] 192.168.1.1 -> Port scan detected',
  '[WARN] 10.0.0.45 -> Brute force on SSH',
  '[CRIT] 172.16.0.8 -> SQL Injection pattern',
  '[INFO] 192.168.2.3 -> Firewall rule triggered',
  '[WARN] 10.0.1.12 -> Unusual outbound traffic',
]

const ATTACK_STEPS = [
  '> Scan réseau...', '> Ports ouverts: 22, 80', '> Test SQLi...', '> Bruteforce...', '> Root obtenu 🔴'
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
        text = Array(12).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('')
      } else if (type === 'blue') {
        text = '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase()
      } else {
        text = "[ MONITOR_HUD_V5 ]"
      }
      const newStream = { id, type, text, x: Math.random() * 100, y: Math.random() * 100, speed: type === 'holo' ? 3 : 8 }
      setStreams(s => [...s.slice(-15), newStream])
    }
    const interval = setInterval(spawn, 1500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: -1, opacity: 0.35 }}>
      <div className="grid-bg" />
      {streams.map(s => (
        <div key={s.id} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          color: s.type === 'green' ? '#00ff88' : (s.type === 'blue' ? '#00aaff' : '#fff'),
          fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap',
          animation: `flow-${s.type === 'holo' ? 'blue' : s.type} ${s.speed}s linear forwards`,
          textShadow: '0 0 8px currentColor', opacity: 0.8
        }}>{s.text}</div>
      ))}
      <style>{`
        @keyframes flow-green { 0% { transform: translateY(-100%); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(100vh); opacity: 0; } }
        @keyframes flow-blue { 0% { transform: translateX(100%); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateX(-100vw); opacity: 0; } }
        .grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(0,255,136,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.05) 1px, transparent 1px); background-size: 50px 50px; }
      `}</style>
    </div>
  )
}

function CustomCursor() {
  const dot = useRef(null); const ring = useRef(null)
  useEffect(() => {
    const move = (e) => {
      if (dot.current) dot.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
      if (ring.current) ring.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])
  return (
    <>
      <div ref={dot} style={{ position: 'fixed', top: -4, left: -4, width: 8, height: 8, background: '#00ff88', borderRadius: '50%', pointerEvents: 'none', zIndex: 99999, boxShadow: '0 0 10px #00ff88' }} />
      <div ref={ring} style={{ position: 'fixed', top: -15, left: -15, width: 30, height: 30, border: '1px solid #00ff88', borderRadius: '50%', pointerEvents: 'none', zIndex: 99998, transition: 'transform 0.15s ease-out', opacity: 0.5 }} />
      <style>{` body, button, a { cursor: none !important; } @media (max-width: 768px) { body, button, a { cursor: auto !important; } } `}</style>
    </>
  )
}

// Sub-components ET, FreeDrag, etc.
function ET({ val, onSave, edit, style, tag: Tag = 'span' }) {
  const ref = useRef()
  useEffect(() => { if (ref.current && ref.current.innerText !== val) ref.current.innerText = val }, [val, edit])
  if (!edit) return <Tag style={style}>{val}</Tag>
  return <span ref={ref} contentEditable suppressContentEditableWarning style={{ ...style, outline: '1px dashed #00ff8855' }} onBlur={e => onSave(e.target.innerText)} />
}

function FreeDrag({ id, isAdmin, positions, onMove, children, style = {} }) {
  const elRef = useRef(); const pos = positions?.[id] || { x: 0, y: 0, w: null, s: 1 }
  const onMouseDown = (e) => {
    if (!isAdmin || e.target.tagName === 'BUTTON' || e.target.contentEditable === 'true') return
    e.preventDefault(); const ox = e.clientX - pos.x, oy = e.clientY - pos.y
    const move = (e) => onMove(id, { ...pos, x: e.clientX - ox, y: e.clientY - oy })
    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
  }
  return <div ref={elRef} onMouseDown={onMouseDown} style={{ ...style, transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.s || 1})`, width: pos.w ? `${pos.w}px` : undefined, position: 'relative', cursor: isAdmin ? 'grab' : 'default' }}>{children}</div>
}

function LogFeed() {
  const [logs, setLogs] = useState([LOGS[0]])
  useEffect(() => {
    let i = 1
    const t = setInterval(() => setLogs(p => [...p.slice(-5), LOGS[i++ % LOGS.length]]), 2000)
    return () => clearInterval(t)
  }, [])
  return <div style={S.logBox}>{logs.map((l, i) => <div key={i} style={S.logLine}>{l}</div>)}</div>
}

function PwModal({ onLogin, onClose, error, form, setForm }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000e', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <form onSubmit={onLogin} style={{ background: '#0f0f0f', border: '1px solid #00ff88', padding: '30px', borderRadius: '12px', textAlign: 'center' }}>
        <h3 style={{ color: '#00ff88', marginBottom: '20px' }}>🔐 Admin Access</h3>
        <input type="text" placeholder="User" value={form.username} onChange={e => setForm({...form, username: e.target.value})} style={S.input} required />
        <input type="password" placeholder="Pass" value={form.password} onChange={e => setForm({...form, password: e.target.value})} style={S.input} required />
        {error && <div style={{ color: 'red', fontSize: '0.8rem' }}>{error}</div>}
        <button type="submit" style={S.btnG}>Login</button>
        <button onClick={onClose} style={{ color: '#555', background: 'none', border: 'none', marginTop: '10px' }}>Cancel</button>
      </form>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(() => { try { const s = localStorage.getItem(KEY); return s ? { ...INIT, ...JSON.parse(s) } : INIT } catch { return INIT } })
  const [section, setSection] = useState('home'); const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('admin_token'))
  const [showModal, setShowModal] = useState(false); const [saved, setSaved] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' }); const [loginError, setLoginError] = useState('')
  const clickCount = useRef(0)

  const handleLogin = async (e) => {
    e.preventDefault()
    const r = await fetch(`${API_URL}/api/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginForm) })
    const d = await r.json()
    if (d.token) { localStorage.setItem('admin_token', d.token); setIsAdmin(true); setShowModal(false) } else setLoginError(d.error)
  }

  const save = async () => {
    const r = await fetch(`${API_URL}/api/save-content`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` }, body: JSON.stringify({ content: data }) })
    if (r.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000); localStorage.setItem(KEY, JSON.stringify(data)) }
  }

  // Backdoor E
  useEffect(() => {
    let t; const down = (e) => { if (isAdmin && (e.key === 'e' || e.key === 'E')) t = setTimeout(() => window.prompt("EXPORT:", JSON.stringify(data)), 2000) }
    const up = () => clearTimeout(t)
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [isAdmin, data])

  const up = (k, v) => setData(d => ({ ...d, [k]: v }))
  const moveEl = (id, p) => setData(d => ({ ...d, positions: { ...d.positions, [id]: p } }))
  const A = isAdmin; const fd = (id, c, st) => <FreeDrag id={id} isAdmin={A} positions={data.positions} onMove={moveEl} style={st}>{c}</FreeDrag>

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: -10 }} />
      <CyberBackground />
      <CustomCursor />
      <div style={S.root}>
        {showModal && <PwModal onLogin={handleLogin} onClose={() => setShowModal(false)} error={loginError} form={loginForm} setForm={setLoginForm} />}
        {A && <div style={S.adminBar}>
          <span style={{ color: '#00ff88' }}>✏️ ADMIN V5</span>
          <button onClick={save} style={S.aSave}>{saved ? 'Saved!' : 'Save'}</button>
          <button onClick={() => { localStorage.removeItem(KEY); window.location.reload() }} style={S.aBtn}>Hard Reset</button>
          <button onClick={() => { localStorage.removeItem('admin_token'); setIsAdmin(false) }} style={S.aBtn}>Logout</button>
        </div>}

        <nav style={S.nav}>
          <span style={S.logo} onClick={() => { clickCount.current++; if (clickCount.current > 4) setShowModal(true) }}>{'<Samuel.Meyisso />'}</span>
          <div>{data.sectionOrder.map(s => <button key={s} onClick={() => setSection(s)} style={{ ...S.navBtn, color: section === s ? '#00ff88' : '#444' }}>{s.toUpperCase()}</button>)}</div>
        </nav>

        <main style={S.main}>
          {section === 'home' && (
            <div style={{ padding: '40px 0' }}>
              {fd('badge', <div style={S.badge}>{data.badge}</div>)}
              {fd('name', <h1 style={S.h1}>{data.name}</h1>)}
              {fd('desc', <p style={{ color: '#777', maxWidth: '600px' }}>{data.desc}</p>)}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '40px' }}>
                <div style={S.card}><h3>🌍 Langues</h3>{data.langs.map(l => <div key={l.id}>{l.lang}: {l.level}</div>)}</div>
                <div style={S.card}><h3>🧠 Soft Skills</h3>{data.softSkills}</div>
              </div>
            </div>
          )}
          {section === 'skills' && (
            <div style={S.section}>
              <h2>⚡ Compétences</h2>
              {data.skills.map(s => <div key={s.id} style={{ margin: '15px 0' }}>{s.name} <div style={{ background: '#111', height: '8px' }}><div style={{ background: '#00ff88', height: '100%', width: `${s.level}%` }} /></div></div>)}
            </div>
          )}
          {section === 'projets' && (
            <div style={S.section}>
              <h2>📁 Projets</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {data.projects.map(p => (
                  <div key={p.id} style={S.card}>
                    <h3>{p.title}</h3><p>{p.desc}</p>
                    {p.file && <a href={`/docs/${p.file}`} target="_blank" style={{ color: '#00ff88' }}>📄 PDF</a>}
                    {A && <button onClick={() => { const f = window.prompt("File name:", p.file || ""); if (f) up('projects', data.projects.map(x => x.id === p.id ? { ...x, file: f } : x)) }}>📎 Link</button>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {section === 'soc' && <div style={S.section}><h2>🖥️ SOC Live</h2><LogFeed /></div>}
          {section === 'contact' && (
            <div style={S.section}>
              <h2>📡 Contact</h2>
              {data.contact.map(c => (
                <div key={c.id} style={{ margin: '10px 0' }}>
                  <strong>{c.label}:</strong> {c.link ? <a href={c.link} target="_blank" style={{ color: '#00ff88' }}>{c.value}</a> : c.value}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}

const S = {
  root: { minHeight: '100vh', background: 'transparent', color: '#fff', fontFamily: 'monospace' },
  nav: { display: 'flex', justifyContent: 'space-between', padding: '20px 40px', background: '#0d0d0d' },
  logo: { color: '#00ff88', fontWeight: 'bold', cursor: 'pointer' },
  navBtn: { background: 'none', border: 'none', cursor: 'pointer', margin: '0 10px' },
  main: { maxWidth: '1000px', margin: '0 auto', padding: '40px' },
  badge: { color: '#00ff88', border: '1px solid #00ff8822', display: 'inline-block', padding: '5px 15px', borderRadius: '20px' },
  h1: { fontSize: '3rem', color: '#00ff88' },
  card: { background: '#0f0f0f', border: '1px solid #1a1a1a', padding: '20px', borderRadius: '8px' },
  section: { padding: '20px 0' },
  adminBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#060f06', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', zIndex: 1000 },
  aBtn: { background: 'none', border: '1px solid #555', color: '#555', cursor: 'pointer', padding: '5px 10px' },
  aSave: { background: '#00ff88', border: 'none', color: '#000', fontWeight: 'bold', cursor: 'pointer', padding: '5px 15px' },
  input: { width: '100%', padding: '10px', margin: '5px 0', background: '#000', border: '1px solid #333', color: '#fff' },
  logBox: { background: '#050505', border: '1px solid #111', padding: '15px', height: '200px', overflowY: 'auto' },
  logLine: { color: '#00ff88', borderBottom: '1px solid #0c0c0c', padding: '3px 0' },
  btnG: { background: '#00ff88', border: 'none', color: '#000', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold' }
}
