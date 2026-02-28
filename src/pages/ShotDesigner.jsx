import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import useCineStore from '../store/useCineStore'
import {
    apiGetShotDesigns, apiCreateShotDesign,
    apiUpdateShotDesign, apiDeleteShotDesign
} from '../api'
import {
    Camera, User, Lightbulb, Monitor, Box, Plus, Save, Trash2,
    Loader2, RotateCcw, ZoomIn, ZoomOut, MousePointer2,
    ChevronDown, Copy
} from 'lucide-react'

// ─── Element types & colors ─────────────────────────────────
const ELEMENT_TYPES = {
    actor: { label: 'Actor', icon: User, color: '#3498DB', defaultW: 30, defaultH: 30 },
    camera: { label: 'Camera', icon: Camera, color: '#E74C3C', defaultW: 28, defaultH: 28 },
    light: { label: 'Light', icon: Lightbulb, color: '#F39C12', defaultW: 26, defaultH: 26 },
    screen: { label: 'Screen', icon: Monitor, color: '#9B59B6', defaultW: 120, defaultH: 16 },
    prop: { label: 'Prop', icon: Box, color: '#1ABC9C', defaultW: 30, defaultH: 30 },
}

let _idCounter = 1
const uid = () => `el_${Date.now()}_${_idCounter++}`

// ─── Grid / coordinate helpers ──────────────────────────────
const GRID_SIZE = 20
const snap = (v) => Math.round(v / GRID_SIZE) * GRID_SIZE

// ─── Draw functions (Canvas 2D) ─────────────────────────────

function drawGrid(ctx, w, h, zoom, panX, panY) {
    const step = GRID_SIZE * zoom
    ctx.save()
    ctx.strokeStyle = 'rgba(160,140,120,0.12)'
    ctx.lineWidth = 1
    const startX = (panX * zoom) % step
    const startY = (panY * zoom) % step
    for (let x = startX; x < w; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
    }
    for (let y = startY; y < h; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
    }
    ctx.restore()
}

function drawActor(ctx, el, selected) {
    const { x, y, rotation, color, label } = el
    const r = 15
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)

    // Body circle
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = selected ? '#FFFFFF' : color
    ctx.globalAlpha = 0.85
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = selected ? '#FFD700' : 'rgba(0,0,0,0.3)'
    ctx.lineWidth = selected ? 2.5 : 1.5
    ctx.stroke()

    // Facing arrow
    ctx.beginPath()
    ctx.moveTo(r + 4, 0)
    ctx.lineTo(r + 14, 0)
    ctx.lineTo(r + 10, -5)
    ctx.moveTo(r + 14, 0)
    ctx.lineTo(r + 10, 5)
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Inner person icon
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(0, -4, 4.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 7, 7, Math.PI * 1.15, Math.PI * 1.85)
    ctx.fill()

    ctx.restore()

    // Label
    if (label) {
        ctx.save()
        ctx.font = '600 10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#3A2818'
        ctx.fillText(label, x, y + r + 14)
        ctx.restore()
    }
}

function drawCamera(ctx, el, selected) {
    const { x, y, rotation, color, fov = 60, cone_length = 120 } = el
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)

    // FOV cone
    const halfFov = (fov * Math.PI) / 360
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(cone_length * Math.cos(-halfFov), cone_length * Math.sin(-halfFov))
    ctx.lineTo(cone_length * Math.cos(halfFov), cone_length * Math.sin(halfFov))
    ctx.closePath()
    ctx.fillStyle = `${color}18`
    ctx.fill()
    ctx.strokeStyle = `${color}40`
    ctx.lineWidth = 1
    ctx.stroke()

    // Camera body
    const bw = 20, bh = 14
    ctx.fillStyle = selected ? '#FFFFFF' : color
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 3)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = selected ? '#FFD700' : 'rgba(0,0,0,0.3)'
    ctx.lineWidth = selected ? 2.5 : 1.5
    ctx.stroke()

    // Lens detail
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    ctx.arc(bw / 2 - 2, 0, 3.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // Label
    if (el.label) {
        ctx.save()
        ctx.font = '600 10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#3A2818'
        ctx.fillText(el.label, x, y + 22)
        ctx.restore()
    }
}

function drawLight(ctx, el, selected) {
    const { x, y, rotation, color, cone_length = 100 } = el
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)

    // Light cone
    const spread = 35
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(cone_length, -spread)
    ctx.lineTo(cone_length, spread)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, cone_length, 0)
    grad.addColorStop(0, `${color}30`)
    grad.addColorStop(1, `${color}05`)
    ctx.fillStyle = grad
    ctx.fill()

    // Bulb
    const r = 12
    ctx.beginPath()
    ctx.arc(0, 0, r, 0, Math.PI * 2)
    ctx.fillStyle = selected ? '#FFFFFF' : color
    ctx.globalAlpha = 0.9
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = selected ? '#FFD700' : 'rgba(0,0,0,0.3)'
    ctx.lineWidth = selected ? 2.5 : 1.5
    ctx.stroke()

    // Sun rays icon
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4
        ctx.beginPath()
        ctx.moveTo(Math.cos(a) * 5, Math.sin(a) * 5)
        ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9)
        ctx.stroke()
    }

    ctx.restore()

    if (el.label) {
        ctx.save()
        ctx.font = '600 10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#3A2818'
        ctx.fillText(el.label, x, y + 22)
        ctx.restore()
    }
}

function drawScreen(ctx, el, selected) {
    const { x, y, rotation, color, width = 120, height = 16 } = el
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)

    ctx.fillStyle = selected ? '#FFFFFF' : color
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.roundRect(-width / 2, -height / 2, width, height, 4)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = selected ? '#FFD700' : 'rgba(0,0,0,0.3)'
    ctx.lineWidth = selected ? 2.5 : 1.5
    ctx.stroke()

    // Pattern lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'
    ctx.lineWidth = 0.5
    for (let lx = -width / 2 + 10; lx < width / 2; lx += 12) {
        ctx.beginPath(); ctx.moveTo(lx, -height / 2); ctx.lineTo(lx, height / 2); ctx.stroke()
    }

    ctx.restore()

    if (el.label) {
        ctx.save()
        ctx.font = '600 10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#3A2818'
        ctx.fillText(el.label, x, y + height / 2 + 14)
        ctx.restore()
    }
}

function drawProp(ctx, el, selected) {
    const { x, y, rotation, color } = el
    const s = 13
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rotation * Math.PI) / 180)

    ctx.fillStyle = selected ? '#FFFFFF' : color
    ctx.globalAlpha = 0.85
    ctx.beginPath()
    ctx.roundRect(-s, -s, s * 2, s * 2, 5)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = selected ? '#FFD700' : 'rgba(0,0,0,0.3)'
    ctx.lineWidth = selected ? 2.5 : 1.5
    ctx.stroke()

    // Box icon
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(-6, -6, 12, 12, 2)
    ctx.stroke()

    ctx.restore()

    if (el.label) {
        ctx.save()
        ctx.font = '600 10px Inter, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillStyle = '#3A2818'
        ctx.fillText(el.label, x, y + s + 14)
        ctx.restore()
    }
}

const DRAW_FNS = { actor: drawActor, camera: drawCamera, light: drawLight, screen: drawScreen, prop: drawProp }

// ─── Hit testing ────────────────────────────────────────────
function hitTest(el, mx, my) {
    const dx = mx - el.x, dy = my - el.y
    if (el.element_type === 'screen') {
        const hw = (el.width || 120) / 2, hh = (el.height || 16) / 2
        const a = -(el.rotation * Math.PI) / 180
        const rx = dx * Math.cos(a) - dy * Math.sin(a)
        const ry = dx * Math.sin(a) + dy * Math.cos(a)
        return Math.abs(rx) <= hw + 4 && Math.abs(ry) <= hh + 4
    }
    return Math.sqrt(dx * dx + dy * dy) <= 20
}

// ─── Properties Panel ───────────────────────────────────────
function PropsPanel({ element, onChange, onDelete, onDuplicate }) {
    if (!element) return (
        <div style={{
            width: 220, background: '#FFFFFF', borderLeft: '1px solid rgba(160,110,70,0.12)',
            padding: '24px 14px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#C0A888', fontSize: 12.5, textAlign: 'center',
        }}>
            <MousePointer2 size={28} color="#D4C0A8" style={{ marginBottom: 12 }} />
            Select an element to<br />edit its properties
        </div>
    )
    const meta = ELEMENT_TYPES[element.element_type] || {}

    const field = (label, key, type = 'text') => (
        <div key={key} style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 10.5, color: '#A07850', marginBottom: 3, fontWeight: 600, letterSpacing: '0.03em' }}>{label}</label>
            <input
                type={type}
                value={element[key] ?? ''}
                onChange={(e) => onChange(key, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                style={{
                    width: '100%', padding: '6px 9px', fontSize: 12.5, border: '1px solid rgba(160,110,70,0.18)',
                    borderRadius: 6, outline: 'none', color: '#2A1E14', background: '#FEFCF9',
                    fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.target.style.borderColor = '#C07840' }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(160,110,70,0.18)' }}
            />
        </div>
    )

    return (
        <div style={{
            width: 220, background: '#FFFFFF', borderLeft: '1px solid rgba(160,110,70,0.12)',
            padding: '16px 14px', overflowY: 'auto', flexShrink: 0,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: element.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {React.createElement(meta.icon || Box, { size: 12, color: '#FFF' })}
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#2A1E14' }}>{meta.label || 'Element'}</span>
            </div>

            {field('Label', 'label')}
            {field('X', 'x', 'number')}
            {field('Y', 'y', 'number')}
            {field('Rotation (°)', 'rotation', 'number')}

            {element.element_type === 'camera' && (
                <>
                    {field('FOV (°)', 'fov', 'number')}
                    {field('Cone Length', 'cone_length', 'number')}
                </>
            )}
            {element.element_type === 'light' && field('Cone Length', 'cone_length', 'number')}
            {element.element_type === 'screen' && (
                <>
                    {field('Width', 'width', 'number')}
                    {field('Height', 'height', 'number')}
                </>
            )}

            <div style={{ marginTop: 6 }}>
                <label style={{ display: 'block', fontSize: 10.5, color: '#A07850', marginBottom: 3, fontWeight: 600 }}>Color</label>
                <input
                    type="color"
                    value={element.color}
                    onChange={(e) => onChange('color', e.target.value)}
                    style={{ width: 44, height: 28, border: 'none', cursor: 'pointer', borderRadius: 4, background: 'none' }}
                />
            </div>

            {field('Notes', 'notes')}

            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                <button onClick={onDuplicate} style={{
                    flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                    background: 'rgba(192,120,64,0.08)', border: '1px solid rgba(192,120,64,0.2)',
                    color: '#8B5A28', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                    <Copy size={11} /> Duplicate
                </button>
                <button onClick={onDelete} style={{
                    flex: 1, padding: '7px 0', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                    background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)',
                    color: '#C0392B', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                    <Trash2 size={11} /> Delete
                </button>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function ShotDesigner() {
    const { projectId } = useParams()
    const projects = useCineStore((s) => s.projects)
    const openProject = useCineStore((s) => s.openProject)
    const project = projects.find((p) => p.id === projectId) ?? {}

    // ── State ────────────────────────────────────────────────
    const [designs, setDesigns] = useState([])
    const [activeDesignId, setActiveDesignId] = useState(null)
    const [elements, setElements] = useState([])
    const [selectedId, setSelectedId] = useState(null)
    const [tool, setTool] = useState('select')
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)
    const [dragState, setDragState] = useState(null)
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState(null)
    const [shotLabel, setShotLabel] = useState('Shot 1')
    const [showDesignList, setShowDesignList] = useState(false)

    const canvasRef = useRef(null)
    const containerRef = useRef(null)
    const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

    // ── Load designs ─────────────────────────────────────────
    useEffect(() => {
        if (!projectId) return
        openProject(projectId)
        let cancelled = false
        setLoading(true)
        apiGetShotDesigns(projectId)
            .then((data) => {
                if (cancelled) return
                setDesigns(data)
                if (data.length > 0) {
                    const first = data[0]
                    setActiveDesignId(first.id)
                    setElements(first.elements || [])
                    setShotLabel(first.shot_label || 'Shot 1')
                }
            })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [projectId])

    const selectedElement = elements.find((e) => e.element_id === selectedId) || null

    // ── Canvas to world coords ──────────────────────────────
    const canvasToWorld = useCallback((cx, cy) => ({
        x: (cx / zoom) - pan.x,
        y: (cy / zoom) - pan.y,
    }), [zoom, pan])

    // ── Redraw canvas ───────────────────────────────────────
    const redraw = useCallback(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        const w = canvas.width, h = canvas.height

        ctx.clearRect(0, 0, w, h)
        ctx.fillStyle = '#FAF7F2'
        ctx.fillRect(0, 0, w, h)

        drawGrid(ctx, w, h, zoom, pan.x, pan.y)

        ctx.save()
        ctx.scale(zoom, zoom)
        ctx.translate(pan.x, pan.y)

        // Draw elements (unselected first, selected on top)
        elements.forEach((el) => {
            if (el.element_id === selectedId) return
            const fn = DRAW_FNS[el.element_type]
            if (fn) fn(ctx, el, false)
        })
        if (selectedElement) {
            const fn = DRAW_FNS[selectedElement.element_type]
            if (fn) fn(ctx, selectedElement, true)
        }

        ctx.restore()

        // Crosshair center
        ctx.save()
        ctx.strokeStyle = 'rgba(192,120,64,0.15)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
        ctx.restore()
    }, [elements, selectedId, selectedElement, zoom, pan])

    useEffect(() => { redraw() }, [redraw])

    // ── Resize canvas to container ──────────────────────────
    useEffect(() => {
        const resize = () => {
            const canvas = canvasRef.current
            const container = containerRef.current
            if (!canvas || !container) return
            canvas.width = container.clientWidth
            canvas.height = container.clientHeight
            redraw()
        }
        resize()
        window.addEventListener('resize', resize)
        return () => window.removeEventListener('resize', resize)
    }, [redraw])

    // ── Mouse handlers ──────────────────────────────────────
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect()
        const cx = e.clientX - rect.left
        const cy = e.clientY - rect.top
        const { x: wx, y: wy } = canvasToWorld(cx, cy)

        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            setIsPanning(true)
            setPanStart({ x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y })
            return
        }

        if (tool === 'select') {
            let hit = null
            for (let i = elements.length - 1; i >= 0; i--) {
                if (hitTest(elements[i], wx, wy)) { hit = elements[i]; break }
            }
            if (hit) {
                setSelectedId(hit.element_id)
                setDragState({
                    id: hit.element_id,
                    startX: e.clientX, startY: e.clientY,
                    elStartX: hit.x, elStartY: hit.y,
                })
            } else {
                setSelectedId(null)
            }
        } else {
            const meta = ELEMENT_TYPES[tool]
            if (!meta) return
            const count = elements.filter((el) => el.element_type === tool).length + 1
            const newEl = {
                element_id: uid(),
                element_type: tool,
                label: `${meta.label} ${count}`,
                x: snap(wx), y: snap(wy),
                rotation: 0,
                color: meta.color,
                width: meta.defaultW,
                height: meta.defaultH,
                fov: 60,
                cone_length: tool === 'camera' ? 120 : tool === 'light' ? 100 : 0,
                notes: '',
            }
            setElements((prev) => [...prev, newEl])
            setSelectedId(newEl.element_id)
            setTool('select')
        }
    }

    const handleMouseMove = (e) => {
        if (isPanning && panStart) {
            const dx = (e.clientX - panStart.x) / zoom
            const dy = (e.clientY - panStart.y) / zoom
            setPan({ x: panStart.panX + dx, y: panStart.panY + dy })
            return
        }
        if (!dragState) return
        const dx = (e.clientX - dragState.startX) / zoom
        const dy = (e.clientY - dragState.startY) / zoom
        setElements((prev) => prev.map((el) =>
            el.element_id === dragState.id
                ? { ...el, x: snap(dragState.elStartX + dx), y: snap(dragState.elStartY + dy) }
                : el
        ))
    }

    const handleMouseUp = () => {
        setDragState(null)
        setIsPanning(false)
        setPanStart(null)
    }

    const handleWheel = (e) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.08 : 0.08
        setZoom((z) => Math.min(3, Math.max(0.2, z + delta)))
    }

    // ── Element modification ────────────────────────────────
    const handleElementChange = (key, value) => {
        setElements((prev) => prev.map((el) =>
            el.element_id === selectedId ? { ...el, [key]: value } : el
        ))
    }

    const handleDeleteElement = () => {
        setElements((prev) => prev.filter((el) => el.element_id !== selectedId))
        setSelectedId(null)
    }

    const handleDuplicateElement = () => {
        if (!selectedElement) return
        const newEl = { ...selectedElement, element_id: uid(), x: selectedElement.x + 40, y: selectedElement.y + 40, label: selectedElement.label + ' (copy)' }
        setElements((prev) => [...prev, newEl])
        setSelectedId(newEl.element_id)
    }

    // ── Keyboard shortcuts ──────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
            if (e.key === 'Delete' || e.key === 'Backspace') { handleDeleteElement(); e.preventDefault() }
            if (e.key === 'Escape') { setSelectedId(null); setTool('select') }
            if (e.key === 'v' || e.key === 'V') setTool('select')
            if (e.key === 'a' || e.key === 'A') setTool('actor')
            if (e.key === 'c' || e.key === 'C') setTool('camera')
            if (e.key === 'l' || e.key === 'L') setTool('light')
            if (e.key === 'r') {
                if (selectedId) {
                    setElements((prev) => prev.map((el) =>
                        el.element_id === selectedId ? { ...el, rotation: (el.rotation + 15) % 360 } : el
                    ))
                }
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [selectedId])

    // ── Save design ─────────────────────────────────────────
    const handleSave = async () => {
        setSaving(true)
        try {
            const payload = {
                shot_label: shotLabel,
                elements: elements.map(({ element_id, element_type, label, x, y, rotation, color, width, height, fov, cone_length, notes }) => ({
                    element_id, element_type, label, x, y, rotation, color, width, height, fov, cone_length, notes,
                })),
            }
            if (activeDesignId) {
                const updated = await apiUpdateShotDesign(projectId, activeDesignId, payload)
                setDesigns((prev) => prev.map((d) => d.id === activeDesignId ? updated : d))
            } else {
                const created = await apiCreateShotDesign(projectId, { ...payload, scene_name: 'Scene 1' })
                setActiveDesignId(created.id)
                setDesigns((prev) => [...prev, created])
            }
            notify('✅ Shot saved')
        } catch (err) {
            console.error(err)
            notify('❌ Save failed')
        } finally {
            setSaving(false)
        }
    }

    // ── New shot ─────────────────────────────────────────────
    const handleNewShot = async () => {
        const label = `Shot ${designs.length + 1}`
        try {
            const created = await apiCreateShotDesign(projectId, { scene_name: 'Scene 1', shot_label: label, elements: [] })
            setDesigns((prev) => [...prev, created])
            setActiveDesignId(created.id)
            setElements([])
            setShotLabel(label)
            setSelectedId(null)
            notify('✅ New shot created')
        } catch (err) {
            console.error(err)
            notify('❌ Failed to create shot')
        }
    }

    const switchDesign = (design) => {
        setActiveDesignId(design.id)
        setElements(design.elements || [])
        setShotLabel(design.shot_label || 'Shot')
        setSelectedId(null)
        setShowDesignList(false)
    }

    const handleDeleteDesign = async () => {
        if (!activeDesignId) return
        try {
            await apiDeleteShotDesign(projectId, activeDesignId)
            const remaining = designs.filter((d) => d.id !== activeDesignId)
            setDesigns(remaining)
            if (remaining.length > 0) {
                switchDesign(remaining[0])
            } else {
                setActiveDesignId(null)
                setElements([])
                setShotLabel('Shot 1')
            }
            notify('🗑️ Shot deleted')
        } catch (err) {
            console.error(err)
            notify('❌ Delete failed')
        }
    }

    // ── Toolbar items ────────────────────────────────────────
    const toolItems = [
        { id: 'select', icon: MousePointer2, label: 'Select (V)' },
        ...Object.entries(ELEMENT_TYPES).map(([id, meta]) => ({
            id, icon: meta.icon, label: `${meta.label} (${id[0].toUpperCase()})`,
        })),
    ]

    return (
        <div className="page-in" style={{ display: 'flex', minHeight: '100vh', background: '#F5EFE5' }}>
            <Sidebar />

            {toast && (
                <div style={{
                    position: 'fixed', top: 18, right: 24, zIndex: 600,
                    background: '#FFFFFF', border: '1px solid rgba(192,120,64,0.3)',
                    borderRadius: 10, padding: '11px 18px', color: '#8B5A28',
                    fontSize: 13, fontWeight: 500, boxShadow: '0 6px 24px rgba(100,60,20,0.14)',
                }}>{toast}</div>
            )}

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{
                    background: '#FFFFFF', borderBottom: '1px solid rgba(160,110,70,0.12)',
                    padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
                }}>
                    <div style={{ width: 4, height: 22, background: 'linear-gradient(180deg,#C07840,#E8B870)', borderRadius: 2 }} />
                    <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#2A1E14', margin: 0 }}>
                        Shot Designer
                    </h1>
                    <span style={{ color: '#D4C0A8' }}>—</span>
                    <span style={{ fontSize: 13, color: '#A07850' }}>{project.title || 'Project'}</span>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {/* Shot selector */}
                        <div style={{ position: 'relative' }}>
                            <button onClick={() => setShowDesignList(!showDesignList)} style={{
                                padding: '6px 14px', borderRadius: 7, fontSize: 12.5, fontWeight: 600,
                                background: '#FAF7F2', border: '1px solid rgba(160,110,70,0.15)',
                                color: '#2A1E14', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                {shotLabel} <ChevronDown size={12} />
                            </button>
                            {showDesignList && (
                                <div style={{
                                    position: 'absolute', top: '110%', right: 0, background: '#FFFFFF',
                                    border: '1px solid rgba(160,110,70,0.15)', borderRadius: 8, zIndex: 200,
                                    minWidth: 160, boxShadow: '0 8px 28px rgba(0,0,0,0.1)', overflow: 'hidden',
                                }}>
                                    {designs.map((d) => (
                                        <button key={d.id} onClick={() => switchDesign(d)}
                                            style={{
                                                display: 'block', width: '100%', padding: '9px 14px',
                                                background: d.id === activeDesignId ? 'rgba(192,120,64,0.08)' : 'transparent',
                                                border: 'none', color: '#2A1E14', fontSize: 12.5, textAlign: 'left',
                                                cursor: 'pointer', fontWeight: d.id === activeDesignId ? 700 : 400,
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,120,64,0.06)' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = d.id === activeDesignId ? 'rgba(192,120,64,0.08)' : 'transparent' }}
                                        >
                                            {d.shot_label || 'Untitled'}
                                        </button>
                                    ))}
                                    <div style={{ borderTop: '1px solid rgba(160,110,70,0.1)', padding: 4 }}>
                                        <button onClick={handleNewShot} style={{
                                            display: 'flex', alignItems: 'center', gap: 5, width: '100%',
                                            padding: '8px 10px', background: 'transparent', border: 'none',
                                            color: '#C07840', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                        }}>
                                            <Plus size={12} /> New Shot
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button onClick={handleSave} disabled={saving} style={{
                            padding: '7px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                            background: 'linear-gradient(135deg,#C07840,#E8A850)', border: 'none',
                            color: '#FAF7F2', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', gap: 5,
                            boxShadow: '0 3px 14px rgba(192,120,64,0.35)',
                        }}>
                            {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                            {saving ? 'Saving…' : 'Save'}
                        </button>

                        {activeDesignId && (
                            <button onClick={handleDeleteDesign} title="Delete this shot" style={{
                                padding: '7px 10px', borderRadius: 8,
                                background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)',
                                color: '#C0392B', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            }}>
                                <Trash2 size={13} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Toolbar */}
                <div style={{
                    background: '#FFFFFF', borderBottom: '1px solid rgba(160,110,70,0.1)',
                    padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
                    overflowX: 'auto',
                }}>
                    {toolItems.map(({ id, icon: Icon, label: tip }) => {
                        const active = tool === id
                        return (
                            <button
                                key={id}
                                onClick={() => setTool(id)}
                                title={tip}
                                style={{
                                    padding: '7px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                                    background: active ? '#C07840' : 'transparent',
                                    color: active ? '#FAF7F2' : '#6B4E36',
                                    border: active ? 'none' : '1px solid transparent',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(192,120,64,0.06)' }}
                                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = active ? '#C07840' : 'transparent' }}
                            >
                                <Icon size={14} />
                                {ELEMENT_TYPES[id]?.label || (id === 'select' ? 'Select' : id)}
                            </button>
                        )
                    })}

                    <div style={{ width: 1, height: 22, background: '#EDE0C8', margin: '0 8px' }} />

                    <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} title="Zoom In" style={{
                        padding: '6px 8px', borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B4E36',
                    }}>
                        <ZoomIn size={15} />
                    </button>
                    <span style={{ fontSize: 11, color: '#A07850', fontWeight: 600, minWidth: 40, textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))} title="Zoom Out" style={{
                        padding: '6px 8px', borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B4E36',
                    }}>
                        <ZoomOut size={15} />
                    </button>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} title="Reset View" style={{
                        padding: '6px 8px', borderRadius: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: '#6B4E36',
                    }}>
                        <RotateCcw size={14} />
                    </button>

                    <div style={{ width: 1, height: 22, background: '#EDE0C8', margin: '0 8px' }} />
                    <span style={{ fontSize: 11, color: '#C0A888', fontStyle: 'italic' }}>
                        {elements.length} element{elements.length !== 1 ? 's' : ''} • Click canvas to place • R to rotate • Alt+drag to pan
                    </span>
                </div>

                {/* Main area */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {loading ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                            <Loader2 size={28} color="#C07840" style={{ animation: 'spin 1s linear infinite' }} />
                            <p style={{ color: '#A07850', fontSize: 14 }}>Loading shot designer…</p>
                        </div>
                    ) : (
                        <>
                            <div
                                ref={containerRef}
                                style={{
                                    flex: 1, overflow: 'hidden',
                                    cursor: tool === 'select'
                                        ? (dragState ? 'grabbing' : 'default')
                                        : 'crosshair',
                                }}
                            >
                                <canvas
                                    ref={canvasRef}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    onWheel={handleWheel}
                                    style={{ display: 'block', width: '100%', height: '100%' }}
                                />
                            </div>

                            <PropsPanel
                                element={selectedElement}
                                onChange={handleElementChange}
                                onDelete={handleDeleteElement}
                                onDuplicate={handleDuplicateElement}
                            />
                        </>
                    )}
                </div>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    )
}
