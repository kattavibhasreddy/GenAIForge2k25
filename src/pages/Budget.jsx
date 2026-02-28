import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import useCineStore from '../store/useCineStore'
import { apiGetBudget, apiAddBudgetItem, apiUpdateBudgetItem, apiDeleteBudgetItem } from '../api'
import {
    ChevronDown, ChevronRight, Plus, Trash2,
    Loader2, X, IndianRupee
} from 'lucide-react'

// ─── Default film budget categories (sequential 1–19) ────────
const DEFAULT_CATEGORIES = [
    {
        id: '1', name: 'STORY', items: [
            { id: '1.1', name: 'Writer(s)' },
            { id: '1.2', name: 'Storyboard' },
            { id: '1.3', name: 'Fringe Benefits' },
        ]
    },
    {
        id: '2', name: 'DIRECTOR', items: [
            { id: '2.1', name: 'Director' },
        ]
    },
    {
        id: '3', name: 'CAST', items: [
            { id: '3.1', name: 'Actors' },
        ]
    },
    {
        id: '4', name: 'EXTRAS', items: [
            { id: '4.1', name: 'General Background Performers' },
        ]
    },
    {
        id: '5', name: 'PRODUCTION STAFF', items: [
            { id: '5.1', name: 'Production Manager' },
            { id: '5.2', name: 'Location Manager' },
            { id: '5.3', name: '1st Assistant Director(s)' },
        ]
    },
    {
        id: '6', name: 'DESIGN LABOR', items: [
            { id: '6.1', name: 'Production Designer' },
            { id: '6.2', name: 'Art Director' },
        ]
    },
    {
        id: '7', name: 'CONSTRUCTION LABOR', items: [
            { id: '7.1', name: 'Carpenter(s)' },
            { id: '7.2', name: 'Painter(s)' },
        ]
    },
    {
        id: '8', name: 'SET DRESSING LABOR', items: [
            { id: '8.1', name: 'Set Decorator' },
        ]
    },
    {
        id: '9', name: 'PROPERTY LABOR', items: [
            { id: '9.1', name: 'Property Master' },
        ]
    },
    {
        id: '10', name: 'WARDROBE/COSTUMES', items: [
            { id: '10.1', name: 'Costume Designer' },
        ]
    },
    {
        id: '11', name: 'MAKEUP/HAIR LABOR', items: [
            { id: '11.1', name: 'Head Makeup' },
        ]
    },
    {
        id: '12', name: 'CAMERA LABOR', items: [
            { id: '12.1', name: 'Director of Photography' },
            { id: '12.2', name: 'Camera Operator' },
        ]
    },
    {
        id: '13', name: 'ELECTRICAL LABOR', items: [
            { id: '13.1', name: 'Gaffer' },
            { id: '13.2', name: 'Best Boy' },
        ]
    },
    {
        id: '14', name: 'GRIP LABOR', items: [
            { id: '14.1', name: 'Key Grip' },
            { id: '14.2', name: 'Best Boy Grip' },
        ]
    },
    {
        id: '15', name: 'PRODUCTION SOUND LABOR', items: [
            { id: '15.1', name: 'Mixer/Sound Recordist' },
            { id: '15.2', name: 'Boom Operator' },
        ]
    },
    {
        id: '16', name: 'TRANSPORTATION/VEHICLES', items: [
            { id: '16.1', name: 'Production Cars' },
            { id: '16.2', name: 'Trucks/Vans' },
        ]
    },
    {
        id: '17', name: 'CONSTRUCTION MATERIAL', items: [
            { id: '17.1', name: 'Carpentry Purchases' },
            { id: '17.2', name: 'Painting Purchases' },
        ]
    },
    {
        id: '18', name: 'SET/LOCATION', items: [
            { id: '18.1', name: 'Rentals' },
            { id: '18.2', name: 'Purchases' },
        ]
    },
    {
        id: '19', name: 'PROPS', items: [
            { id: '19.1', name: 'Rentals' },
            { id: '19.2', name: 'Purchases' },
        ]
    },
]

// ─── Amount Input — always visible as an input box ───────────
function AmountInput({ value, onSave, placeholder }) {
    const [val, setVal] = useState(value || '')
    const [focused, setFocused] = useState(false)
    const inputRef = useRef(null)

    // Sync if parent value changes (e.g. after save)
    useEffect(() => { setVal(value || '') }, [value])

    const handleBlur = () => {
        setFocused(false)
        const num = parseFloat(val) || 0
        if (num !== (value || 0)) {
            onSave(num)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur()
        }
    }

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            background: focused ? '#FFF9F0' : '#FAFAF8',
            border: focused ? '1.5px solid #C07840' : '1px solid rgba(160,110,70,0.15)',
            borderRadius: 6, padding: '4px 6px', transition: 'all 0.15s',
            maxWidth: 120,
        }}>
            <span style={{ fontSize: 12, color: '#A07850', flexShrink: 0, userSelect: 'none' }}>₹</span>
            <input
                ref={inputRef}
                type="number"
                step="any"
                value={val}
                placeholder={placeholder || '0'}
                onChange={(e) => setVal(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                style={{
                    width: '100%', border: 'none', outline: 'none',
                    background: 'transparent', fontSize: 12.5,
                    color: '#2A1E14', fontFamily: 'Inter, sans-serif',
                    fontVariantNumeric: 'tabular-nums', textAlign: 'right',
                    padding: '2px 0',
                }}
            />
        </div>
    )
}

// ─── Editable Name — click to rename items ──────────────────
function EditableName({ itemId, name, onSave }) {
    const [editing, setEditing] = useState(false)
    const [draft, setDraft] = useState(name)

    useEffect(() => { setDraft(name) }, [name])

    const commit = () => {
        setEditing(false)
        const trimmed = draft.trim()
        if (trimmed && trimmed !== name) {
            onSave(trimmed)
        } else {
            setDraft(name)
        }
    }

    if (editing) {
        return (
            <div style={{ paddingLeft: 28, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: '#A07850', flexShrink: 0 }}>{itemId} |</span>
                <input
                    type="text"
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(name); setEditing(false) } }}
                    style={{
                        flex: 1, padding: '4px 8px', fontSize: 12.5, border: '1.5px solid #C07840',
                        borderRadius: 5, outline: 'none', fontFamily: 'Inter, sans-serif',
                        background: '#FFF9F0', color: '#2A1E14', maxWidth: 200,
                    }}
                />
            </div>
        )
    }

    return (
        <div
            onClick={() => { setDraft(name); setEditing(true) }}
            style={{
                paddingLeft: 28, cursor: 'pointer', borderRadius: 4,
                padding: '4px 4px 4px 28px', transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,120,64,0.06)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            title="Click to rename"
        >
            <span style={{ fontSize: 12.5, color: '#3A2818' }}>
                {itemId} | {name}
            </span>
        </div>
    )
}

// ─── Confirm Dialog ──────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div style={{
                background: '#FFFFFF', borderRadius: 14, padding: '28px 32px',
                boxShadow: '0 12px 48px rgba(0,0,0,0.2)', maxWidth: 380, width: '90%',
                border: '1px solid rgba(160,110,70,0.15)',
            }}>
                <p style={{ fontSize: 14, color: '#2A1E14', margin: '0 0 20px', lineHeight: 1.5 }}>{message}</p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{
                        padding: '8px 18px', borderRadius: 8, background: '#FAF7F2',
                        border: '1px solid rgba(160,110,70,0.2)', color: '#6B4E36',
                        fontSize: 13, cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        padding: '8px 18px', borderRadius: 8,
                        background: 'linear-gradient(135deg,#C0392B,#E74C3C)',
                        border: 'none', color: '#FFFFFF',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>Delete</button>
                </div>
            </div>
        </div>
    )
}

// ─── Main Budget Component ───────────────────────────────────
export default function Budget() {
    const { projectId } = useParams()
    const projects = useCineStore((s) => s.projects)
    const openProject = useCineStore((s) => s.openProject)
    const project = projects.find((p) => p.id === projectId) ?? {}

    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [collapsed, setCollapsed] = useState({})
    const [hiddenCategories, setHiddenCategories] = useState({})
    const [confirmDialog, setConfirmDialog] = useState(null)
    const [toast, setToast] = useState(null)

    const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

    useEffect(() => {
        if (!projectId) return
        openProject(projectId)
        let cancelled = false
        setLoading(true)
        apiGetBudget(projectId)
            .then((data) => { if (!cancelled) setItems(data) })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [projectId])

    const toggle = (catId) => setCollapsed((prev) => ({ ...prev, [catId]: !prev[catId] }))

    const getItemsForCategory = (catId) => items.filter((it) => it.category_id === catId)

    const getMergedItems = (cat) => {
        const dbItems = getItemsForCategory(cat.id)
        const dbItemIds = new Set(dbItems.map((it) => it.item_id))
        const defaults = cat.items.filter((d) => !dbItemIds.has(d.id)).map((d) => ({
            _isDefault: true,
            item_id: d.id,
            item_name: d.name,
            category_id: cat.id,
            category_name: cat.name,
            estimated: 0, actual: 0, paid: 0,
        }))
        return [...dbItems, ...defaults].sort((a, b) => {
            const na = parseFloat(a.item_id?.split('.').pop()) || 0
            const nb = parseFloat(b.item_id?.split('.').pop()) || 0
            return na - nb
        })
    }

    const getCatTotals = (cat) => {
        const merged = getMergedItems(cat)
        const estimated = merged.reduce((s, i) => s + (i.estimated || 0), 0)
        const actual = merged.reduce((s, i) => s + (i.actual || 0), 0)
        const paid = merged.reduce((s, i) => s + (i.paid || 0), 0)
        return { estimated, actual, paid, payable: actual - paid, variance: estimated - actual }
    }

    const visibleCategories = DEFAULT_CATEGORIES.filter((c) => !hiddenCategories[c.id])

    const getGrandTotals = () => {
        let estimated = 0, actual = 0, paid = 0
        visibleCategories.forEach((cat) => {
            const t = getCatTotals(cat)
            estimated += t.estimated; actual += t.actual; paid += t.paid
        })
        return { estimated, actual, paid, payable: actual - paid, variance: estimated - actual }
    }

    // Save a cell value — create item in DB if it doesn't exist, update if it does
    const handleSaveCell = async (cat, itemDef, field, value) => {
        const existing = items.find((it) => it.category_id === cat.id && it.item_id === itemDef.item_id)
        try {
            if (existing && existing.id) {
                const updated = await apiUpdateBudgetItem(existing.id, { [field]: value })
                setItems((prev) => prev.map((it) => it.id === existing.id ? updated : it))
            } else {
                // First time entering a value on a default item — create it in DB
                const data = {
                    category_id: cat.id,
                    category_name: cat.name,
                    item_id: itemDef.item_id,
                    item_name: field === 'item_name' ? value : itemDef.item_name,
                    estimated: 0, actual: 0, paid: 0,
                    ...(field !== 'item_name' ? { [field]: value } : {}),
                }
                const created = await apiAddBudgetItem(projectId, data)
                setItems((prev) => [...prev, created])
            }
            notify('✅ Saved')
        } catch (err) {
            console.error('Budget save failed:', err)
            notify('❌ Failed to save — ' + (err.message || 'check console'))
        }
    }

    // Add new custom item
    const handleAddItem = async (cat) => {
        const merged = getMergedItems(cat)
        const nextSub = merged.length + 1
        const newId = `${cat.id}.${nextSub}`
        const data = {
            category_id: cat.id, category_name: cat.name,
            item_id: newId, item_name: 'New Item',
            estimated: 0, actual: 0, paid: 0,
        }
        try {
            const created = await apiAddBudgetItem(projectId, data)
            setItems((prev) => [...prev, created])
            notify('✅ Item added')
        } catch (err) {
            console.error('Add item failed:', err)
            notify('❌ Failed to add')
        }
    }

    // Delete single item
    const handleDeleteItem = (item) => {
        if (item._isDefault) return
        setConfirmDialog({
            message: `Delete "${item.item_name}" from the budget?`,
            onConfirm: async () => {
                setConfirmDialog(null)
                try {
                    await apiDeleteBudgetItem(item.id)
                    setItems((prev) => prev.filter((it) => it.id !== item.id))
                    notify('🗑️ Item deleted')
                } catch (err) {
                    console.error('Delete failed:', err)
                    notify('❌ Failed to delete')
                }
            },
        })
    }

    // Delete all items in a category
    const handleDeleteCategory = (cat) => {
        const catItems = items.filter((it) => it.category_id === cat.id)
        setConfirmDialog({
            message: `Remove "${cat.name}" and all its ${catItems.length} item(s) from the budget?`,
            onConfirm: async () => {
                setConfirmDialog(null)
                try {
                    await Promise.all(catItems.map((it) => apiDeleteBudgetItem(it.id)))
                    setItems((prev) => prev.filter((it) => it.category_id !== cat.id))
                    setHiddenCategories((prev) => ({ ...prev, [cat.id]: true }))
                    notify(`🗑️ ${cat.name} removed`)
                } catch (err) {
                    console.error('Delete category failed:', err)
                    notify('❌ Failed to remove category')
                }
            },
        })
    }

    const handleRestoreAll = () => {
        setHiddenCategories({})
        notify('📋 All categories restored')
    }

    const grandTotals = getGrandTotals()
    const hasHidden = Object.values(hiddenCategories).some(Boolean)

    return (
        <div className="page-in" style={{ display: 'flex', minHeight: '100vh', background: '#F5EFE5' }}>
            <Sidebar />

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 18, right: 24, zIndex: 600,
                    background: '#FFFFFF', border: '1px solid rgba(192,120,64,0.3)',
                    borderRadius: 10, padding: '11px 18px', color: '#8B5A28',
                    fontSize: 13, fontWeight: 500, boxShadow: '0 6px 24px rgba(100,60,20,0.14)',
                    animation: 'fadeIn 0.2s ease',
                }}>{toast}</div>
            )}

            {/* Confirm dialog */}
            {confirmDialog && (
                <ConfirmDialog
                    message={confirmDialog.message}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}

            <main style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{
                    background: '#FFFFFF', borderBottom: '1px solid rgba(160,110,70,0.12)',
                    padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
                }}>
                    <div style={{ width: 4, height: 22, background: 'linear-gradient(180deg,#C07840,#E8B870)', borderRadius: 2 }} />
                    <h1 style={{
                        fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700,
                        color: '#2A1E14', margin: 0,
                    }}>Budget</h1>
                    <span style={{ color: '#D4C0A8' }}>—</span>
                    <span style={{ fontSize: 13, color: '#A07850' }}>{project.title || 'Project'}</span>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                            padding: '5px 14px', background: '#FAF7F2', borderRadius: 6,
                            border: '1px solid rgba(160,110,70,0.12)', fontSize: 12.5,
                            color: '#8B5A28', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            <IndianRupee size={12} /> INR
                        </span>

                        {hasHidden && (
                            <button onClick={handleRestoreAll} style={{
                                padding: '6px 14px', borderRadius: 7,
                                background: 'rgba(192,120,64,0.08)', border: '1px solid rgba(192,120,64,0.25)',
                                color: '#8B5A28', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 5,
                            }}>
                                <Plus size={12} /> Restore All
                            </button>
                        )}
                    </div>
                </div>

                {/* Tip bar */}
                <div style={{
                    background: 'rgba(192,120,64,0.06)', padding: '8px 28px',
                    borderBottom: '1px solid rgba(160,110,70,0.08)',
                    fontSize: 12, color: '#A07850', fontStyle: 'italic',
                }}>
                    💡 Type an amount in any ₹ field and press Enter or click away to save it to the database.
                </div>

                {loading ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                        <Loader2 size={28} color="#C07840" style={{ animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: '#A07850', fontSize: 14 }}>Loading budget…</p>
                        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: none } }`}</style>

                        {/* Column headers */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 44px',
                            padding: '10px 20px',
                            background: '#F9F4ED',
                            borderBottom: '2px solid rgba(160,110,70,0.18)',
                            position: 'sticky', top: 0, zIndex: 20,
                        }}>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#6B4E36', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID | Name</span>
                            {['Estimated (₹)', 'Actual (₹)', 'Paid (₹)', 'Due (₹)', 'Variance'].map((c) => (
                                <span key={c} style={{ fontSize: 11, fontWeight: 600, color: '#9A7A60', textAlign: 'center' }}>{c}</span>
                            ))}
                            <span />
                        </div>

                        {/* Categories & Items */}
                        {visibleCategories.map((cat) => {
                            const isOpen = !collapsed[cat.id]
                            const merged = getMergedItems(cat)
                            const totals = getCatTotals(cat)

                            return (
                                <div key={cat.id}>
                                    {/* Category header */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 44px',
                                        padding: '10px 20px',
                                        background: 'linear-gradient(90deg, rgba(170,190,230,0.35), rgba(170,190,230,0.18))',
                                        borderBottom: '1px solid rgba(160,110,70,0.08)',
                                        alignItems: 'center',
                                    }}>
                                        <div
                                            onClick={() => toggle(cat.id)}
                                            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                                        >
                                            {isOpen ? <ChevronDown size={14} color="#5A6B80" /> : <ChevronRight size={14} color="#5A6B80" />}
                                            <span style={{ fontSize: 13, fontWeight: 700, color: '#2A3444' }}>
                                                {cat.id} | {cat.name}
                                            </span>
                                        </div>
                                        <span style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#2A3444' }}>₹{totals.estimated.toFixed(2)}</span>
                                        <span style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#2A3444' }}>₹{totals.actual.toFixed(2)}</span>
                                        <span style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#2A3444' }}>₹{totals.paid.toFixed(2)}</span>
                                        <span style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: totals.payable > 0 ? '#E67E22' : '#2A3444' }}>₹{totals.payable.toFixed(2)}</span>
                                        <span style={{ textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: totals.variance < 0 ? '#C0392B' : totals.variance > 0 ? '#27AE60' : '#2A3444' }}>₹{totals.variance.toFixed(2)}</span>
                                        <div style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDeleteCategory(cat)}
                                                title={`Remove ${cat.name}`}
                                                style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: '#8A9AB0', padding: 3, borderRadius: 4,
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.color = '#C0392B' }}
                                                onMouseLeave={(e) => { e.currentTarget.style.color = '#8A9AB0' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Line items */}
                                    {isOpen && merged.map((item) => {
                                        const payable = (item.actual || 0) - (item.paid || 0)
                                        const variance = (item.estimated || 0) - (item.actual || 0)

                                        return (
                                            <div
                                                key={item.id || item.item_id}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 44px',
                                                    padding: '7px 20px',
                                                    borderBottom: '1px solid rgba(160,110,70,0.06)',
                                                    background: '#FFFFFF',
                                                    alignItems: 'center',
                                                    transition: 'background 0.12s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#FEFCF9' }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF' }}
                                            >
                                                {/* Name — editable */}
                                                <EditableName
                                                    itemId={item.item_id}
                                                    name={item.item_name}
                                                    onSave={(newName) => handleSaveCell(cat, item, 'item_name', newName)}
                                                />

                                                {/* Estimated — editable input */}
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <AmountInput
                                                        value={item.estimated || 0}
                                                        placeholder="Enter"
                                                        onSave={(v) => handleSaveCell(cat, item, 'estimated', v)}
                                                    />
                                                </div>

                                                {/* Actual — editable input */}
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <AmountInput
                                                        value={item.actual || 0}
                                                        placeholder="Enter"
                                                        onSave={(v) => handleSaveCell(cat, item, 'actual', v)}
                                                    />
                                                </div>

                                                {/* Paid — editable input */}
                                                <div style={{ display: 'flex', justifyContent: 'center' }}>
                                                    <AmountInput
                                                        value={item.paid || 0}
                                                        placeholder="Enter"
                                                        onSave={(v) => handleSaveCell(cat, item, 'paid', v)}
                                                    />
                                                </div>

                                                {/* Due (Actual - Paid) */}
                                                <span style={{
                                                    textAlign: 'center', fontSize: 12.5,
                                                    color: payable > 0 ? '#E67E22' : '#6B4E36',
                                                    fontWeight: payable !== 0 ? 600 : 400,
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    ₹{payable.toFixed(2)}
                                                </span>

                                                {/* Variance — computed */}
                                                <span style={{
                                                    textAlign: 'center', fontSize: 12.5,
                                                    color: variance < 0 ? '#C0392B' : variance > 0 ? '#27AE60' : '#6B4E36',
                                                    fontWeight: variance !== 0 ? 600 : 400,
                                                    fontVariantNumeric: 'tabular-nums',
                                                }}>
                                                    ₹{variance.toFixed(2)}
                                                </span>

                                                {/* Delete */}
                                                <div style={{ textAlign: 'center' }}>
                                                    {item.id && !item._isDefault ? (
                                                        <button
                                                            onClick={() => handleDeleteItem(item)}
                                                            title="Delete row"
                                                            style={{
                                                                background: 'none', border: 'none',
                                                                cursor: 'pointer', color: '#D0A080',
                                                                padding: 3, borderRadius: 4,
                                                            }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.color = '#C0392B' }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.color = '#D0A080' }}
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* Add line item */}
                                    {isOpen && (
                                        <div style={{ padding: '5px 20px 9px', background: '#FFFFFF', borderBottom: '1px solid rgba(160,110,70,0.08)' }}>
                                            <button
                                                onClick={() => handleAddItem(cat)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 5,
                                                    background: 'none', border: '1px dashed rgba(192,120,64,0.3)',
                                                    borderRadius: 6, padding: '6px 14px', cursor: 'pointer',
                                                    color: '#C07840', fontSize: 11.5, fontWeight: 500,
                                                    marginLeft: 28, transition: 'all 0.15s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,120,64,0.05)'; e.currentTarget.style.borderColor = 'rgba(192,120,64,0.5)' }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = 'rgba(192,120,64,0.3)' }}
                                            >
                                                <Plus size={12} /> Add Line Item
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {/* Grand Total */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 44px',
                            padding: '14px 20px',
                            background: 'linear-gradient(90deg, rgba(192,120,64,0.14), rgba(192,120,64,0.05))',
                            borderTop: '2px solid rgba(192,120,64,0.3)',
                            position: 'sticky', bottom: 0,
                        }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#2A1E14', fontFamily: 'Playfair Display, serif' }}>
                                GRAND TOTAL
                            </span>
                            <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#2A1E14' }}>₹{grandTotals.estimated.toFixed(2)}</span>
                            <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#2A1E14' }}>₹{grandTotals.actual.toFixed(2)}</span>
                            <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#2A1E14' }}>₹{grandTotals.paid.toFixed(2)}</span>
                            <span style={{
                                textAlign: 'center', fontSize: 13, fontWeight: 700,
                                color: grandTotals.payable > 0 ? '#E67E22' : '#2A1E14',
                            }}>₹{grandTotals.payable.toFixed(2)}</span>
                            <span style={{
                                textAlign: 'center', fontSize: 13, fontWeight: 700,
                                color: grandTotals.variance < 0 ? '#C0392B' : grandTotals.variance > 0 ? '#27AE60' : '#2A1E14',
                            }}>₹{grandTotals.variance.toFixed(2)}</span>
                            <span />
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
