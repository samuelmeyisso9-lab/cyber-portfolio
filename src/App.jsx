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
const KEY = 'portfolio_samuel_v3'

const INIT = {
  "badge": "🟢 DISPONIBLE — Stage Cybersécurité/SOC Junior · Juin-Juil 2026",
  "name": "Samuel MEYISSO",
  "subtitle": "Analyste Cybersécurité · SOC Junior · Hacking Éthique",
  "desc": "Étudiant en Bachelor Cybersécurité à l'École 89. Spécialisé en sécurité offensive & défensive, analyse réseau, détection de vulnérabilités et tests d'intrusion (SQLi, OWASP).",
  "sectionOrder": [
    "home",
    "skills",
    "projets",
    "soc",
    "contact"
  ],
  "positions": {
    "desc": {
      "x": 196,
      "y": 6,
      "w": 708,
      "s": 1
    },
    "stats": {
      "x": 265,
      "y": 3,
      "w": 603,
      "s": 1
    },
    "soft-card": {
      "x": 168,
      "y": 27,
      "w": 486,
      "s": 1.2603250201324543
    },
    "langs-card": {
      "x": 14,
      "y": 27,
      "w": 202.48419189453125,
      "s": 1.2793348700083689
    },
    "skill-s2": {
      "x": 546,
      "y": 143,
      "w": 387.81231689453125,
      "s": 1.3075170735937627
    },
    "skill-s3": {
      "x": 2,
      "y": 19,
      "w": 337.1119689941406,
      "s": 1.168271461870516
    },
    "skill-s4": {
      "x": 539,
      "y": -299,
      "w": 424.66436767578125,
      "s": 1.2140010491596211
    },
    "skill-s1": {
      "x": 7,
      "y": 57,
      "w": 390.7618103027344,
      "s": 1.007595670958985
    },
    "tools-title": {
      "x": -2,
      "y": -2,
      "w": null,
      "s": 1
    },
    "skill-s5": {
      "x": -3,
      "y": 22,
      "w": 338
    }
  },
  "skills": [
    {
      "id": "s1",
      "name": "Network Security (Wireshark, Nmap, BurpSuite)",
      "level": 82
    },
    {
      "id": "s2",
      "name": "Penetration Testing (SQLi, OWASP)",
      "level": 80
    },
    {
      "id": "s3",
      "name": "SIEM / Log Analysis / SOC",
      "level": 78
    },
    {
      "id": "s4",
      "name": "Virtualisation (Kali, VMware, Docker)",
      "level": 85
    },
    {
      "id": "s5",
      "name": "Python / Scripting",
      "level": 72
    },
    {
      "id": "s6",
      "name": "Cloud & IAM (RBAC, RLS)",
      "level": 68
    }
  ],
  "projects": [
    {
      "id": "p1",
      "title": "🖥️ VM Vulnérable — Audit & Surveillance",
      "desc": "Création d'une VM vulnérable, audit de sécurité complet et surveillance active des OS.",
      "tags": "Kali Linux · VirtualBox · Audit"
    },
    {
      "id": "p2",
      "title": "🗄️ Base de Données Éducative (10 000+)",
      "desc": "Conception et déploiement d'un logiciel de gestion éducative à grande échelle.",
      "tags": "SQL · Docker · Database"
    },
    {
      "id": "p3",
      "title": "🔐 Virtualisation & Cryptographie",
      "desc": "Virtualisation avancée, cryptographie, stéganographie et chiffrement de données.",
      "tags": "VMware · Cryptographie · Stégano"
    },
    {
      "id": "p4",
      "title": "🏢 Réseau d'Entreprise Segmenté",
      "desc": "Conception, implémentation et audit d'un réseau d'entreprise entièrement segmenté.",
      "tags": "Stormshield · LAN/WAN · Pentest"
    }
  ],
  "formations": [
    {
      "id": "f1",
      "school": "École 89 — Deep Tech",
      "period": "Sept 2025 – Juin 2026",
      "diploma": "Bachelor Cybersécurité & Hacking Éthique"
    },
    {
      "id": "f2",
      "school": "F.L.S.H Limoges",
      "period": "Sept 2024 – Juil 2025",
      "diploma": "L1 Langues Étrangères Appliquées (EN/G/ESP/ITAL)"
    },
    {
      "id": "f3",
      "school": "Lycée International Cours Lumière",
      "period": "Sept 2023 – Juil 2024",
      "diploma": "Baccalauréat Général — Ses, LLcer"
    }
  ],
  "contact": [
    {
      "id": "c1",
      "icon": "📞",
      "label": "Téléphone",
      "value": "06 99 58 20 51"
    },
    {
      "id": "c2",
      "icon": "📧",
      "label": "Email",
      "value": "samuelmeyisso635@gmail.com"
    },
    {
      "id": "c3",
      "icon": "📍",
      "label": "Localisation",
      "value": "Île de France, 77120"
    },
    {
      "id": "c4",
      "icon": "🎓",
      "label": "École",
      "value": "École 89 — Deep Tech · Bachelor Cybersécurité"
    },
    {
      "id": "c5",
      "icon": "🔗",
      "label": "LinkedIn",
      "value": "https://www.linkedin.com/in/samuel-emmanuel-meyisso-91980b330/"
    }
  ],
  "langs": [
    {
      "id": "l1",
      "lang": "Anglais",
      "level": "B2"
    },
    {
      "id": "l2",
      "lang": "Espagnol",
      "level": "B2"
    },
    {
      "id": "l3",
      "lang": "Italien",
      "level": "A1"
    }
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

function FreeDrag({ id, isAdmin, positions, onMove, children, style = {} }) {
  const dragging = useRef(false)
  const resizing = useRef(false)
  const origin = useRef({})
  const elRef = useRef()
  const pos = positions?.[id] || { x: 0, y: 0, w: null, s: 1 }

  // ── DRAG ────────────────────────────────────────────
  const onMouseDown = (e) => {
    if (!isAdmin) return
    if (e.target.dataset.resize || e.target.contentEditable === 'true' || e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return
    e.preventDefault(); e.stopPropagation()
    dragging.current = true
    origin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    const onMv = (e) => {
      if (!dragging.current) return
      onMove(id, { ...pos, x: origin.current.px + (e.clientX - origin.current.mx), y: origin.current.py + (e.clientY - origin.current.my) })
    }
    const onUp = () => { dragging.current = false; window.removeEventListener('mousemove', onMv); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMv)
    window.addEventListener('mouseup', onUp)
  }

  // ── RESIZE (coin bas-droite) ─────────────────────────
  const onResizeDown = (e) => {
    e.preventDefault(); e.stopPropagation()
    resizing.current = true
    const rect = elRef.current.getBoundingClientRect()
    origin.current = { mx: e.clientX, my: e.clientY, w: rect.width, s: pos.s || 1 }
    const onMv = (e) => {
      if (!resizing.current) return
      const newW = Math.max(80, origin.current.w + (e.clientX - origin.current.mx))
      onMove(id, { ...pos, w: newW })
    }
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMv); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMv)
    window.addEventListener('mouseup', onUp)
  }

  // ── SCALE (coin bas-gauche) ──────────────────────────
  const onScaleDown = (e) => {
    e.preventDefault(); e.stopPropagation()
    resizing.current = true
    const rect = elRef.current.getBoundingClientRect()
    origin.current = { my: e.clientY, h: rect.height, s: pos.s || 1 }
    const onMv = (e) => {
      if (!resizing.current) return
      const delta = (e.clientY - origin.current.my) / origin.current.h
      const newS = Math.min(2, Math.max(0.3, origin.current.s + delta))
      onMove(id, { ...pos, s: newS })
    }
    const onUp = () => { resizing.current = false; window.removeEventListener('mousemove', onMv); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMv)
    window.addEventListener('mouseup', onUp)
  }

  const onDblClick = (e) => {
    if (!isAdmin) return
    e.stopPropagation()
    onMove(id, { x: 0, y: 0, w: null, s: 1 })
  }

  const hasOffset = pos.x !== 0 || pos.y !== 0 || pos.w || (pos.s && pos.s !== 1)

  return (
    <div
      ref={elRef}
      onMouseDown={onMouseDown}
      onDoubleClick={onDblClick}
      style={{
        ...style,
        transform: `translate(${pos.x || 0}px, ${pos.y || 0}px) scale(${pos.s || 1})`,
        transformOrigin: 'top left',
        width: pos.w ? `${pos.w}px` : undefined,
        transition: (dragging.current || resizing.current) ? 'none' : 'transform 0.1s',
        position: 'relative',
        zIndex: hasOffset ? 50 : 'auto',
        ...(isAdmin ? {
          cursor: 'grab',
          outline: '1px dashed #00ff8840',
          outlineOffset: '3px',
          borderRadius: '6px',
          userSelect: 'none',
        } : {}),
      }}
    >
      {/* Étiquette admin */}
      {isAdmin && (
        <div style={{ position: 'absolute', top: -18, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none', zIndex: 10 }}>
          <span style={{ color: '#00ff8855', fontSize: '0.6rem' }}>⠿ glisse · dbl-clic=reset</span>
          {hasOffset && <span style={{ color: '#ffaa0066', fontSize: '0.6rem' }}>
            {pos.x ? `${Math.round(pos.x)}px ` : ''}{pos.y ? `${Math.round(pos.y)}px ` : ''}{pos.s && pos.s !== 1 ? `×${pos.s.toFixed(2)}` : ''}
          </span>}
        </div>
      )}

      {children}

      {/* Poignée resize largeur (coin bas-droite) */}
      {isAdmin && (
        <div
          data-resize="w"
          onMouseDown={onResizeDown}
          title="Redimensionner la largeur"
          style={{
            position: 'absolute', bottom: -6, right: -6,
            width: 14, height: 14,
            background: '#00ff88', borderRadius: '3px',
            cursor: 'se-resize', zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 7L7 1M4 7L7 4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      {/* Poignée scale taille (coin bas-gauche) */}
      {isAdmin && (
        <div
          data-resize="s"
          onMouseDown={onScaleDown}
          title="Agrandir / Réduire"
          style={{
            position: 'absolute', bottom: -6, left: -6,
            width: 14, height: 14,
            background: '#00aaff', borderRadius: '3px',
            cursor: 'sw-resize', zIndex: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M7 7L1 1M4 7L1 4" stroke="#000" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </div>
  )
}
// ── Texte éditable ────────────────────────────────────
function ET({ val, onSave, edit, style, tag: Tag = 'span' }) {
  const ref = useRef()
  useEffect(() => {
    if (ref.current && ref.current.innerText !== val) ref.current.innerText = val
  }, [val, edit])
  if (!edit) return <Tag style={style}>{val}</Tag>
  return (
    <span ref={ref} contentEditable suppressContentEditableWarning
      style={{ ...style, outline: '1px dashed #00ff8855', borderRadius: '3px', padding: '0 3px', cursor: 'text' }}
      onBlur={e => onSave(e.target.innerText)} />
  )
}

// ── Sortable (dnd-kit pour listes) ────────────────────
function SortableItem({ id, children, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}>
      {typeof children === 'function' ? children(listeners) : children}
    </div>
  )
}

function TypeWriter({ text, speed = 60 }) {
  const [d, setD] = useState('')
  useEffect(() => {
    setD(''); let i = 0
    const t = setInterval(() => { setD(text.slice(0, ++i)); if (i >= text.length) clearInterval(t) }, speed)
    return () => clearInterval(t)
  }, [text])
  return <span>{d}<span className="cursor">_</span></span>
}

function LogFeed() {
  const [logs, setLogs] = useState([LOGS[0]])
  const bot = useRef()
  useEffect(() => {
    let i = 1
    const t = setInterval(() => setLogs(p => [...p.slice(-8), LOGS[i++ % LOGS.length]]), 1400)
    return () => clearInterval(t)
  }, [])
  useEffect(() => { bot.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])
  return (
    <div style={S.logBox}>
      <div style={S.logH}>● LIVE SOC FEED</div>
      {logs.map((l, i) => <div key={i} style={{ ...S.logLine, color: l.includes('CRIT') ? '#ff4444' : l.includes('WARN') ? '#ffaa00' : '#00ff88' }}>{l}</div>)}
      <div ref={bot} />
    </div>
  )
}

function PwModal({ onLogin, onClose, error, form, setForm }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000ee', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <form onSubmit={onLogin} style={{ background: '#0f0f0f', border: '1px solid #00ff88', borderRadius: '16px', padding: '40px', width: '320px', textAlign: 'center', fontFamily: 'monospace' }}>
        <div style={{ color: '#00ff88', fontSize: '1.4rem', marginBottom: '6px' }}>🔐 RBAC Login</div>
        <div style={{ color: '#444', fontSize: '0.82rem', marginBottom: '24px' }}>Seul Samuel peut modifier ce site</div>
        <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} 
          placeholder="Utilisateur..." autoFocus required
          style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', marginBottom: '10px', outline: 'none' }} />
        <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} 
          placeholder="Mot de passe..." required
          style={{ width: '100%', padding: '10px 14px', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', marginBottom: '10px', outline: 'none' }} />
        {error && <div style={{ color: '#ff4444', fontSize: '0.8rem', marginBottom: '10px' }}>⚠️ {error}</div>}
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#555', cursor: 'pointer' }}>Annuler</button>
          <button type="submit" style={{ flex: 1, padding: '10px', background: '#00ff88', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 'bold', cursor: 'pointer' }}>Entrer →</button>
        </div>
      </form>
    </div>
  )
}


function FileManager({ onClose }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const r = await fetch(`${API_URL}/api/files`)
      const d = await r.json()
      setFiles(d.files || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const del = async (name) => {
    if (!confirm(`Supprimer ${name} ?`)) return
    await fetch(`${API_URL}/api/files/${name}`, { method: 'DELETE' })
    load()
  }

  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, data: ev.target.result })
      })
      load()
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000ee', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div style={{ background: '#0f0f0f', border: '1px solid #00ff88', borderRadius: '16px', padding: '30px', width: '450px', fontFamily: 'monospace' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ color: '#00ff88', fontSize: '1.2rem' }}>📁 Gestion des fichiers</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div style={{ marginBottom: '20px' }}>
          <input type="file" onChange={upload} style={{ color: '#00ff88', fontSize: '0.8rem' }} />
        </div>
        <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
          {loading ? <div>Chargement...</div> : files.map(f => (
            <div key={f} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #1a1a1a', alignItems: 'center' }}>
              <span style={{ color: '#ccc', fontSize: '0.85rem' }}>{f}</span>
              <button onClick={() => del(f)} style={{ color: '#ff4444', background: 'none', border: 'none', cursor: 'pointer' }}>Supprimer</button>
            </div>
          ))}
          {!loading && files.length === 0 && <div style={{ color: '#444', textAlign: 'center' }}>Aucun fichier dans public/assets</div>}
        </div>
        <div style={{ color: '#777', fontSize: '0.75rem', textAlign: 'center' }}>
          Déposez vos fichiers dans <code>public/assets</code> pour les utiliser.
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
function AdminDashboard({ logs, onClose }) {
  const [activeTab, setActiveTab] = useState('ALL')
  const filteredLogs = activeTab === 'ALL' ? logs.all : logs.alerts

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000f8', zIndex: 10001, padding: '40px', fontFamily: 'monospace', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '2px solid #00ff88', paddingBottom: '10px' }}>
        <h2 style={{ color: '#00ff88', margin: 0 }}>⚡ CYBER-SECURITY DASHBOARD</h2>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button onClick={() => setActiveTab('ALL')} style={{ background: activeTab === 'ALL' ? '#00ff88' : 'transparent', color: activeTab === 'ALL' ? '#000' : '#00ff88', border: '1px solid #00ff88', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>TOUS LES LOGS</button>
          <button onClick={() => setActiveTab('ALERTS')} style={{ background: activeTab === 'ALERTS' ? '#ff4444' : 'transparent', color: activeTab === 'ALERTS' ? '#000' : '#ff4444', border: '1px solid #ff4444', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>ALERTES CRITIQUES ({logs.alerts.length})</button>
          <button onClick={onClose} style={{ background: '#555', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '4px', cursor: 'pointer' }}>FERMER</button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px' }}>
        {filteredLogs.length === 0 && <div style={{ color: '#444', textAlign: 'center', padding: '40px' }}>Aucune activité détectée.</div>}
        {filteredLogs.map(log => (
          <div key={log.id} style={{ 
            background: '#0a0a0a', 
            borderLeft: `4px solid ${log.type === 'ALERT' ? '#ff4444' : log.type === 'SECURITY' ? '#ffaa00' : '#00aaff'}`, 
            padding: '12px', 
            fontSize: '0.85rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span style={{ color: '#00ff88', fontWeight: 'bold' }}>{`[${log.type}]`} <span style={{ color: '#555', fontWeight: 'normal' }}>{new Date(log.timestamp).toLocaleString()}</span></span>
                {log.severity === 'CRITICAL' && <span style={{ background: '#ff4444', color: '#000', padding: '0 5px', borderRadius: '2px', fontSize: '0.7rem' }}>MENACE DÉTECTÉE</span>}
            </div>
            <div style={{ color: '#fff' }}>
                <span style={{ color: '#888' }}>Utilisateur:</span> {log.user} | 
                <span style={{ color: '#888', marginLeft: '10px' }}>Action:</span> <span style={{ color: log.type === 'ALERT' ? '#ff4444' : '#fff' }}>{log.action}</span>
            </div>
            <div style={{ marginTop: '5px', fontSize: '0.75rem' }}>
                {log.ip && <span style={{ color: '#ffaa00' }}>IP ORIGINE: {log.ip}</span>}
                {log.location && <span style={{ color: '#00aaff', marginLeft: '15px' }}>LOCALISATION: {log.location}</span>}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}


function CyberBackground() {
  const [streams, setStreams] = useState([])

  useEffect(() => {
    const spawn = () => {
      const id = Date.now()
      const isGreen = Math.random() > 0.5
      const newStream = {
        id,
        type: isGreen ? 'green' : 'blue',
        text: isGreen 
          ? Array(12).fill(0).map(() => String.fromCharCode(0x30A0 + Math.random() * 96)).join('') 
          : '0x' + Math.floor(Math.random() * 0xFFFFFFFF).toString(16).toUpperCase(),
        x: Math.random() * 100,
        y: Math.random() * 100,
        speed: 8 + Math.random() * 12
      }
      setStreams(s => [...s.slice(-10), newStream])
    }
    const interval = setInterval(spawn, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0, opacity: 0.12 }}>
      <div className="scanlines" />
      <div className="noise" />
      {streams.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: `${s.x}%`,
          top: `${s.y}%`,
          color: s.type === 'green' ? '#00ff88' : '#00aaff',
          fontFamily: 'monospace',
          fontSize: '0.8rem',
          textShadow: `0 0 5px ${s.type === 'green' ? '#00ff88' : '#00aaff'}`,
          whiteSpace: 'nowrap',
          animation: `flow-${s.type} ${s.speed}s linear forwards`,
        }}>
          {s.text}
        </div>
      ))}
      <style>{`
        @keyframes flow-green {
          0% { transform: translate(-100%, -100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(200%, 200%); opacity: 0; }
        }
        @keyframes flow-blue {
          0% { transform: translate(100%, -50%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translate(-300%, 150%); opacity: 0; }
        }
        .scanlines {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(0, 255, 136, 0.02) 50%);
          background-size: 100% 4px;
          z-index: 1;
        }
        .noise {
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.05;
          z-index: 2;
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const [data, setData] = useState(() => {
    try { const s = localStorage.getItem(KEY); return s ? { ...INIT, ...JSON.parse(s) } : INIT }
    catch { return INIT }
  })
  const [section, setSection] = useState('home')
  const [isAdmin, setIsAdmin] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showFileManager, setShowFileManager] = useState(false)
  const [saved, setSaved] = useState(false)
  const [attackLog, setAttackLog] = useState([])
  const [attackRunning, setAttackRunning] = useState(false)
  const [threats, setThreats] = useState(0)
  const clickCount = useRef(0)
  const clickTimer = useRef()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const [token, setToken] = useState(localStorage.getItem('admin_token'))
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginError, setLoginError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const r = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      const d = await r.json()
      if (d.token) {
        setToken(d.token)
        localStorage.setItem('admin_token', d.token)
        setIsAdmin(true)
        setShowModal(false)
        setLoginError('')
      } else {
        setLoginError(d.error || 'Erreur')
      }
    } catch (err) { setLoginError('Serveur injoignable') }
  }

  const handleLogout = () => {
    setToken(null)
    localStorage.removeItem('admin_token')
    setIsAdmin(false)
  }

  useEffect(() => {
    if (token) setIsAdmin(true)
  }, [token])

    const [liveLogs, setLiveLogs] = useState({ all: [], alerts: [] })
  const [showDashboard, setShowDashboard] = useState(false)
  const socketRef = useRef()

  useEffect(() => {
    fetch(`${API_URL}/api/track`, { method: 'POST' }).catch(() => {})
    if (token) {
      const socket = io(`${API_URL}`)
      socketRef.current = socket
      socket.emit('join-admin', token)
      socket.on('init-logs', (logs) => setLiveLogs(logs))
      socket.on('new-log', (log) => {
        setLiveLogs(prev => {
          const newAll = [log, ...prev.all].slice(0, 500)
          const newAlerts = (log.type === 'ALERT' || log.severity === 'HIGH') ? [log, ...prev.alerts] : prev.alerts
          return { all: newAll, alerts: newAlerts }
        })
      })
      return () => socket.disconnect()
    }
  }, [token])




  useEffect(() => {
    // Bloquer le clic droit
    const handleContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    
    // Bloquer F12, Ctrl+Shift+I (Inspect), Ctrl+U (Source), Ctrl+P (Print), Ctrl+S (Save)
    const handleKeyDown = (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'u') ||
        (e.ctrlKey && e.key === 'p') ||
        (e.ctrlKey && e.key === 's')
      ) {
        e.preventDefault();
        return false;
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --- CYBER BACKDOOR : Appui long sur 'E' pour exporter ---
  const eTimer = useRef(null)
  useEffect(() => {
    const down = (e) => {
      if (isAdmin && (e.key === 'e' || e.key === 'E') && !eTimer.current) {
        eTimer.current = setTimeout(() => {
          window.prompt("CYBER-EXPORT ACTIVATED (CTRL+C) :", JSON.stringify(data));
        }, 2000)
      }
    }
    const up = () => { clearTimeout(eTimer.current); eTimer.current = null }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [isAdmin, data])


  const up = (k, v) => setData(d => ({ ...d, [k]: v }))

  // Met à jour la position d'un élément
  const moveEl = (id, pos) => {
    setData(d => ({ ...d, positions: { ...d.positions, [id]: pos } }))
  }

  // Remet toutes les positions à zéro
  const resetPositions = () => {
    if (window.confirm('Remettre tous les éléments à leur position d\'origine ?')) {
      up('positions', {})
    }
  }

  const handleLogoClick = () => {
    clickCount.current += 1
    clearTimeout(clickTimer.current)
    clickTimer.current = setTimeout(() => { clickCount.current = 0 }, 2000)
    if (clickCount.current >= 5) { clickCount.current = 0; setShowModal(true) }
  }

  const save = async () => {
    try {
      setSaved(false)
      const r = await fetch(`${API_URL}/api/save-content`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: data })
      })
      const d = await r.json()
      if (d.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
        localStorage.setItem(KEY, JSON.stringify(data))
      } else {
        alert(d.error || 'Erreur de sauvegarde')
      }
    } catch (err) {
      alert('Serveur injoignable')
    }
  }

  const reset = () => {
    if (window.confirm('Réinitialiser tout le contenu par défaut ?')) {
      setData(INIT)
      localStorage.removeItem(KEY)
    }
  }

  const makeDragEnd = (key) => ({ active, over }) => {
    if (!over || active.id === over.id) return
    const arr = data[key]
    up(key, arrayMove(arr, arr.findIndex(x => x.id === active.id), arr.findIndex(x => x.id === over.id)))
  }

  const runAttack = () => {
    if (attackRunning) return
    setAttackRunning(true); setAttackLog([]); let i = 0
    const t = setInterval(() => {
      setAttackLog(a => [...a, ATTACK_STEPS[i++]])
      if (i >= ATTACK_STEPS.length) { clearInterval(t); setAttackRunning(false); setThreats(n => n + 1) }
    }, 650)
  }

  const A = isAdmin
  const fd = (id, children, style) => (
    <FreeDrag id={id} isAdmin={A} positions={data.positions} onMove={moveEl} style={style}>
      {children}
    </FreeDrag>
  )

  const renderSection = (id) => {
    if (id === 'home') return (
      <div style={{ padding: '44px 0', position: 'relative' }}>
        {fd('badge', <div style={S.badge}><ET val={data.badge} onSave={v => up('badge', v)} edit={A} style={{ color: '#00ff88' }} /></div>, { display: 'inline-block', marginBottom: '22px' })}
        {fd('name', (
          <h1 style={S.h1}>
            {A ? <ET val={data.name} onSave={v => up('name', v)} edit style={{ color: '#00ff88', fontSize: 'inherit', fontWeight: 'inherit' }} />
               : <TypeWriter text={data.name} />}
          </h1>
        ), { marginBottom: '10px' })}
        {fd('subtitle', (
          <div style={{ fontSize: '1.05rem', color: '#00aaff', fontWeight: 'bold' }}>
            <ET val={data.subtitle} onSave={v => up('subtitle', v)} edit={A} style={{ color: '#00aaff' }} />
          </div>
        ), { marginBottom: '16px' })}
        {fd('desc', (
          <div style={{ color: '#777', maxWidth: '680px', lineHeight: '1.75' }}>
            <ET val={data.desc} onSave={v => up('desc', v)} edit={A} style={{ color: '#777' }} />
          </div>
        ), { marginBottom: '32px' })}
        {fd('stats', (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {[{ l: 'Projets cyber', v: '4' }, { l: 'Outils maîtrisés', v: '12+' }, { l: 'Simulations lancées', v: String(threats) }].map(x => (
              <div key={x.l} style={S.stat}><div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#00ff88' }}>{x.v}</div><div style={{ color: '#444', fontSize: '0.8rem', marginTop: '3px' }}>{x.l}</div></div>
            ))}
          </div>
        ), { marginBottom: '32px' })}
        {!A && fd('cta-buttons', (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button style={S.btnG} onClick={() => setSection('soc')}>🖥️ SOC Live</button>
            <button style={S.btnO} onClick={() => setSection('projets')}>📁 Projets</button>
            <button style={S.btnO} onClick={() => setSection('contact')}>📡 Contact</button>
          </div>
        ), { marginBottom: '36px' })}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px', marginTop: A ? '16px' : '0' }}>
          {fd('langs-card', (
            <div style={S.card}>
              <div style={S.cardT}>🌍 Langues</div>
              {data.langs.map(l => (
                <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <ET val={l.lang} onSave={v => up('langs', data.langs.map(x => x.id === l.id ? { ...x, lang: v } : x))} edit={A} style={{ color: '#bbb' }} />
                  <span style={{ background: '#0a1a0a', border: '1px solid #00ff8833', color: '#00ff88', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>
                    <ET val={l.level} onSave={v => up('langs', data.langs.map(x => x.id === l.id ? { ...x, level: v } : x))} edit={A} style={{ color: '#00ff88' }} />
                  </span>
                </div>
              ))}
            </div>
          ))}
          {fd('soft-card', (
            <div style={S.card}>
              <div style={S.cardT}>🧠 Soft Skills</div>
              {A
                ? <ET val={data.softSkills} onSave={v => up('softSkills', v)} edit style={{ color: '#888', fontSize: '0.9rem', display: 'block', lineHeight: '1.9' }} />
                : data.softSkills.split('·').map((s, i) => <div key={i} style={{ color: '#888', padding: '3px 0', fontSize: '0.88rem' }}>→ {s.trim()}</div>)
              }
            </div>
          ))}
        </div>
      </div>
    )

    if (id === 'skills') return (
      <div style={{ ...S.section, position: 'relative' }}>
        {fd('skills-title', <h2 style={S.h2}>⚡ Compétences Techniques</h2>, { marginBottom: '26px' })}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEnd('skills')}>
          <SortableContext items={data.skills.map(s => s.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '740px', marginBottom: '36px' }}>
              {data.skills.map(sk => (
                <SortableItem key={sk.id} id={sk.id} disabled={!A}>
                  {(listeners) =>
                    fd(`skill-${sk.id}`, (
                      <div style={A ? { border: '1px dashed #00ff8815', borderRadius: '8px', padding: '10px' } : {}}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px', gap: '8px' }}>
                          {A && <span {...listeners} style={{ color: '#00ff8844', cursor: 'grab', fontSize: '1.1rem', userSelect: 'none' }}>⠿</span>}
                          <ET val={sk.name} onSave={v => up('skills', data.skills.map(x => x.id === sk.id ? { ...x, name: v } : x))} edit={A} style={{ color: '#ccc', flex: 1, fontSize: '0.88rem' }} />
                          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {A && <input type="range" min="0" max="100" value={sk.level} onChange={e => up('skills', data.skills.map(x => x.id === sk.id ? { ...x, level: +e.target.value } : x))} style={{ width: '80px', accentColor: '#00ff88' }} />}
                            <span style={{ color: '#00ff88', minWidth: '36px', fontSize: '0.85rem' }}>{sk.level}%</span>
                            {A && <button onClick={() => up('skills', data.skills.filter(x => x.id !== sk.id))} style={S.del}>✕</button>}
                          </span>
                        </div>
                        <div style={{ background: '#181818', borderRadius: '4px', height: '7px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(90deg,#00ff88,#00aaff)', height: '100%', width: `${sk.level}%`, transition: 'width 0.6s ease' }} />
                        </div>
                      </div>
                    ))
                  }
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {fd('formations-title', <h3 style={S.h3}>🎓 Formations</h3>, { marginBottom: '14px' })}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {data.formations.map(f =>
            fd(`form-${f.id}`, (
              <div style={S.card}>
                <ET val={f.school} onSave={v => up('formations', data.formations.map(x => x.id === f.id ? { ...x, school: v } : x))} edit={A} style={{ color: '#00ff88', fontWeight: 'bold', display: 'block' }} />
                <ET val={f.period} onSave={v => up('formations', data.formations.map(x => x.id === f.id ? { ...x, period: v } : x))} edit={A} style={{ color: '#555', fontSize: '0.82rem', display: 'block', margin: '3px 0' }} />
                <ET val={f.diploma} onSave={v => up('formations', data.formations.map(x => x.id === f.id ? { ...x, diploma: v } : x))} edit={A} style={{ color: '#bbb', display: 'block' }} />
              </div>
            ))
          )}
        </div>

        {fd('tools-title', <h3 style={S.h3}>🏷️ Outils & Technologies</h3>, { marginBottom: '14px' })}
        {fd('tools-list', A
          ? <ET val={data.tools} onSave={v => up('tools', v)} edit style={{ color: '#00ff88', fontSize: '0.9rem', display: 'block', lineHeight: '2.2' }} />
          : <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {data.tools.split('·').map(t => <span key={t} style={{ background: '#0a1a0a', border: '1px solid #00ff8833', color: '#00ff88', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem' }}>{t.trim()}</span>)}
            </div>
        )}
      </div>
    )

    if (id === 'projets') return (
      <div style={{ ...S.section, position: 'relative' }}>
        {fd('projets-title', <h2 style={S.h2}>📁 Projets Cybersécurité 2025–2026</h2>, { marginBottom: '26px' })}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={makeDragEnd('projects')}>
          <SortableContext items={data.projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {data.projects.map(p => (
                <SortableItem key={p.id} id={p.id} disabled={!A}>
                  {(listeners) =>
                    fd(`proj-${p.id}`, (
                      <div style={{ ...S.card, ...(A ? { borderColor: '#00ff8818' } : {}) }}>
                        {A && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span {...listeners} style={{ color: '#00ff8844', cursor: 'grab', fontSize: '1.1rem', userSelect: 'none' }}>⠿ ordre</span>
                            <button onClick={() => up('projects', data.projects.filter(x => x.id !== p.id))} style={S.del}>✕</button>
                          </div>
                        )}
                        <ET val={p.title} onSave={v => up('projects', data.projects.map(x => x.id === p.id ? { ...x, title: v } : x))} edit={A} tag="h3"
                          style={{ color: '#00ff88', fontSize: '1rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }} />
                        <ET val={p.desc} onSave={v => up('projects', data.projects.map(x => x.id === p.id ? { ...x, desc: v } : x))} edit={A}
                          style={{ color: '#777', fontSize: '0.88rem', lineHeight: '1.6', display: 'block', marginBottom: '14px' }} />
                        {A
                          ? <ET val={p.tags} onSave={v => up('projects', data.projects.map(x => x.id === p.id ? { ...x, tags: v } : x))} edit style={{ color: '#00aaff', fontSize: '0.82rem', display: 'block' }} />
                          : <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                              {p.tags.split('·').map(t => <span key={t} style={{ background: '#0a1428', border: '1px solid #00aaff33', color: '#00aaff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.74rem' }}>{t.trim()}</span>)}
                            </div>
                        }
                      </div>
                    ))
                  }
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    )

    if (id === 'soc') return (
      <div style={{ ...S.section, position: 'relative' }}>
        {fd('soc-title', <h2 style={S.h2}>🖥️ SOC Dashboard — Live Demo</h2>, { marginBottom: '26px' })}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {fd('soc-feed', <LogFeed />)}
          {fd('soc-attack', (
            <div style={S.card}>
              <div style={S.logH}>⚡ SIMULATION PENTEST</div>
              <button onClick={runAttack} disabled={attackRunning} style={{ ...S.btnG, opacity: attackRunning ? 0.5 : 1, marginBottom: '12px', width: '100%' }}>
                {attackRunning ? '⏳ Attaque en cours...' : '🚀 Lancer la simulation'}
              </button>
              <div style={S.logBox}>
                {attackLog.length === 0 && <div style={{ color: '#2a2a2a', fontStyle: 'italic' }}>En attente...</div>}
                {attackLog.map((l, i) => <div key={i} style={{ ...S.logLine, color: l.includes('🔴') ? '#ff4444' : l.includes('✅') ? '#00ff88' : '#aaa' }}>{l}</div>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )

    if (id === 'contact') return (
      <div style={{ ...S.section, position: 'relative' }}>
        {fd('contact-title', <h2 style={S.h2}>📡 Contact</h2>, { marginBottom: '26px' })}
        {fd('contact-intro', (
          <p style={{ color: '#666', marginBottom: '22px', lineHeight: '1.6', maxWidth: '500px' }}>
            Disponible pour une <strong style={{ color: '#00ff88' }}>alternance SOC Junior / Analyste Cyber</strong> — Juin–Juillet 2026
          </p>
        ))}
        <div style={{ ...S.card, maxWidth: '580px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {data.contact.map(c =>
            fd(`contact-${c.id}`, (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #161616' }}>
                <span style={{ fontSize: '1.3rem', minWidth: '28px' }}>{c.icon}</span>
                <div>
                  <div style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '2px' }}>{c.label}</div>
                  {A ? (
                    <ET val={c.value} onSave={v => up('contact', data.contact.map(x => x.id === c.id ? { ...x, value: v } : x))} edit={A} style={{ color: '#bbb', fontSize: '0.95rem' }} />
                  ) : (
                    <a 
                      href={c.label === 'Email' ? `mailto:${c.value}` : c.label === 'Téléphone' ? `tel:${c.value.replace(/\s/g, '')}` : c.value.startsWith('http') ? c.value : '#'} 
                      target={c.value.startsWith('http') ? '_blank' : undefined}
                      rel={c.value.startsWith('http') ? 'noopener noreferrer' : undefined}
                      style={{ color: '#bbb', fontSize: '0.95rem', textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#00ff88'}
                      onMouseLeave={e => e.target.style.color = '#bbb'}
                    >
                      {c.value}
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
    return null
  }

  return (
    <div style={S.root}>
      <CyberBackground />
      {showModal && <PwModal onLogin={handleLogin} onClose={() => setShowModal(false)} error={loginError} form={loginForm} setForm={setLoginForm} />}
      {showFileManager && <FileManager onClose={() => setShowFileManager(false)} />}
      {showDashboard && <AdminDashboard logs={liveLogs} onClose={() => setShowDashboard(false)} />}

      {A && (
        <div style={S.adminBar}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#00ff88', fontWeight: 'bold', fontSize: '0.82rem' }}>✏️ MODE ÉDITION</span>
            <span style={{ color: '#2a2a2a', fontSize: '0.7rem' }}>Glisse un élément · Double-clic = reset position · Slider = niveau</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setShowFileManager(true)} style={S.aBtn}>📁 Fichiers</button>
            <button onClick={() => up('projects', [...data.projects, { id: 'p' + Date.now(), title: '🆕 Nouveau Projet', desc: 'Description...', tags: 'Tag1 · Tag2' }])} style={S.aBtn}>+ Projet</button>
            <button onClick={() => up('skills', [...data.skills, { id: 's' + Date.now(), name: 'Nouvelle Compétence', level: 50 }])} style={S.aBtn}>+ Skill</button>
            <button onClick={resetPositions} style={{ ...S.aBtn, borderColor: '#ffaa0033', color: '#ffaa00' }}>📍 Reset positions</button>
            <button onClick={reset} style={{ ...S.aBtn, borderColor: '#ff444433', color: '#ff4444' }}>↺ Reset tout</button>
            <button onClick={save} style={{ ...S.aSave, background: saved ? '#003300' : '#00ff88', color: saved ? '#00ff88' : '#000', border: saved ? '1px solid #00ff88' : 'none' }}>
              {saved ? '✅ Sauvegardé !' : '💾 Sauvegarder'}
            </button>
            <button onClick={() => setIsAdmin(false)} style={{ ...S.aBtn, borderColor: '#1a1a1a', color: '#333' }}>🔒 Quitter</button>
          </div>
        </div>
      )}

      <nav style={S.nav}>
        <span style={{ ...S.logo, cursor: 'pointer', userSelect: 'none' }} onClick={handleLogoClick}>
          {'<Samuel.Meyisso />'}
        </span>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {data.sectionOrder.map(s => (
            <button key={s} onClick={() => setSection(s)} style={{ ...S.navBtn, color: section === s ? '#00ff88' : '#444', borderBottom: section === s ? '2px solid #00ff88' : '2px solid transparent' }}>
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </nav>

      <main style={S.main}>
        {renderSection(section)}
      </main>

      <footer style={{ textAlign: 'center', color: '#1a1a1a', padding: '20px', borderTop: '1px solid #0f0f0f', fontSize: '0.82rem', marginBottom: A ? '60px' : '0' }}>
        {'< '} Samuel Meyisso · Bachelor Cybersécurité · École 89 {' >'}
      </footer>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; } @media print { body { display: none !important; } }
        .cursor { animation: blink 1s steps(1) infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #00ff8822; }
        [contenteditable]:focus { outline: 1px solid #00ff88 !important; background: #0a140a !important; border-radius: 3px; }
      `}</style>
    </div>
  )
}


const S = {
  root: { minHeight: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: "'Courier New', monospace", paddingBottom: '80px' },
  adminBar: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#060f06', borderTop: '1px solid #00ff8811', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 999, flexWrap: 'wrap', gap: '10px' },
  aBtn: { padding: '7px 13px', background: 'transparent', border: '1px solid #00ff8833', borderRadius: '6px', color: '#00ff88', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.78rem' },
  aSave: { padding: '7px 18px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem', transition: 'all 0.3s' },
  del: { background: 'transparent', border: '1px solid #ff444422', color: '#ff4444', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '0.72rem', fontFamily: 'monospace' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 36px', borderBottom: '1px solid #141414', background: '#0d0d0d', position: 'sticky', top: 0, zIndex: 100, flexWrap: 'wrap', gap: '8px' },
  logo: { color: '#00ff88', fontWeight: 'bold', fontSize: '1rem' },
  navBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '6px 10px', fontSize: '0.72rem', fontFamily: "'Courier New', monospace" },
  main: { maxWidth: '1100px', margin: '0 auto', padding: '36px 24px' },
  badge: { display: 'inline-block', background: '#0a1a0a', border: '1px solid #00ff8822', padding: '6px 16px', borderRadius: '20px', fontSize: '0.82rem' },
  h1: { fontSize: 'clamp(2rem, 5vw, 3.6rem)', fontWeight: 'bold', color: '#00ff88', minHeight: '1.2em' },
  stat: { textAlign: 'center', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '14px 22px' },
  btnG: { background: '#00ff88', color: '#000', border: 'none', padding: '11px 22px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.88rem' },
  btnO: { background: 'transparent', color: '#00ff88', border: '1px solid #00ff8844', padding: '11px 22px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontFamily: "'Courier New', monospace", fontSize: '0.88rem' },
  card: { background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '12px', padding: '18px' },
  cardT: { color: '#00ff88', fontWeight: 'bold', marginBottom: '12px', fontSize: '0.9rem' },
  section: { padding: '16px 0' },
  h2: { fontSize: '1.7rem', color: '#00ff88', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px', display: 'inline-block' },
  h3: { fontSize: '1.1rem', color: '#00aaff' },
  logBox: { background: '#050505', border: '1px solid #111', borderRadius: '8px', padding: '14px', fontFamily: "'Courier New', monospace", fontSize: '0.78rem', height: '240px', overflowY: 'auto' },
  logH: { color: '#00ff88', fontWeight: 'bold', marginBottom: '10px', fontSize: '0.8rem' },
  logLine: { padding: '3px 0', borderBottom: '1px solid #0c0c0c' },
}
