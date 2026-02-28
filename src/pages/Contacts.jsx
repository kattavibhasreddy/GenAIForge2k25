import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import useCineStore from '../store/useCineStore'
import {
    apiGetContacts, apiCreateContact,
    apiUpdateContact, apiDeleteContact
} from '../api'
import {
    UserPlus, Search, Filter, ArrowUpDown, Trash2, Pencil,
    X, Loader2, User, Phone, Mail, Building2, StickyNote, Upload
} from 'lucide-react'

const CATEGORIES = ['Crew', 'Talent', 'Extras', 'Client', 'Others']
const SORT_OPTIONS = ['Name', 'Category', 'Company', 'Recently Added']

// ─── Avatar placeholder ─────────────────────────────────────
function Avatar({ name, pictureUrl, size = 36 }) {
    if (pictureUrl) {
        return (
            <img src={pictureUrl} alt={name}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(160,110,70,0.15)' }}
            />
        )
    }
    const initial = (name || '?')[0].toUpperCase()
    const colors = ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22', '#34495E']
    const bg = colors[initial.charCodeAt(0) % colors.length]
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', background: bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontSize: size * 0.4, fontWeight: 700,
            flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)',
        }}>
            {initial}
        </div>
    )
}

// ─── Category badge ─────────────────────────────────────────
function CategoryBadge({ category }) {
    const colors = {
        Crew: { bg: 'rgba(52,152,219,0.08)', text: '#2980B9', border: 'rgba(52,152,219,0.2)' },
        Talent: { bg: 'rgba(155,89,182,0.08)', text: '#8E44AD', border: 'rgba(155,89,182,0.2)' },
        Extras: { bg: 'rgba(46,204,113,0.08)', text: '#27AE60', border: 'rgba(46,204,113,0.2)' },
        Client: { bg: 'rgba(243,156,18,0.08)', text: '#E67E22', border: 'rgba(243,156,18,0.2)' },
        Others: { bg: 'rgba(149,165,166,0.08)', text: '#7F8C8D', border: 'rgba(149,165,166,0.2)' },
    }
    const c = colors[category] || colors.Others
    return (
        <span style={{
            padding: '3px 10px', borderRadius: 12, fontSize: 10.5, fontWeight: 600,
            background: c.bg, color: c.text, border: `1px solid ${c.border}`,
            letterSpacing: '0.02em',
        }}>
            {category}
        </span>
    )
}

// ─── Contact Modal (Add / Edit) ─────────────────────────────
function ContactModal({ contact, onSave, onClose, saving }) {
    const [form, setForm] = useState({
        title: '', name: '', mobile: '', alternate_mobile: '',
        email: '', company: '', category: 'Crew', notes: '', picture_url: '',
    })
    const fileRef = useRef(null)

    useEffect(() => {
        if (contact) {
            setForm({
                title: contact.title || '',
                name: contact.name || '',
                mobile: contact.mobile || '',
                alternate_mobile: contact.alternate_mobile || '',
                email: contact.email || '',
                company: contact.company || '',
                category: contact.category || 'Crew',
                notes: contact.notes || '',
                picture_url: contact.picture_url || '',
            })
        }
    }, [contact])

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

    const handlePicture = (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => set('picture_url', ev.target.result)
        reader.readAsDataURL(file)
    }

    const canSave = form.name.trim() && form.email.trim()

    const inputStyle = {
        width: '100%', padding: '11px 14px', fontSize: 13.5,
        border: '1px solid rgba(160,110,70,0.18)', borderRadius: 8,
        outline: 'none', color: '#2A1E14', background: '#FEFCF9',
        fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
        transition: 'border-color 0.15s',
    }

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(10,5,2,0.55)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, animation: 'fadeIn 0.2s ease',
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                background: '#FFFFFF', borderRadius: 18, width: '100%', maxWidth: 560,
                maxHeight: '90vh', overflow: 'auto',
                boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
                animation: 'scaleIn 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid rgba(160,110,70,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#2A1E14', margin: 0 }}>
                        {contact ? 'Edit Contact' : 'Add New Contact'}
                    </h2>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: 4, borderRadius: 6, color: '#A07850',
                    }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '20px 24px' }}>
                    {/* Picture + top fields */}
                    <div style={{ display: 'flex', gap: 24, marginBottom: 20, alignItems: 'flex-start' }}>
                        {/* Avatar / Upload */}
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                            <div style={{
                                width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
                                background: '#F0E8DC', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '3px solid rgba(160,110,70,0.12)', margin: '0 auto 8px',
                            }}>
                                {form.picture_url ? (
                                    <img src={form.picture_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={36} color="#C0A888" />
                                )}
                            </div>
                            <button onClick={() => fileRef.current?.click()} style={{
                                display: 'flex', alignItems: 'center', gap: 4, margin: '0 auto',
                                background: 'none', border: '1px solid rgba(160,110,70,0.2)',
                                borderRadius: 6, padding: '5px 10px', fontSize: 11, color: '#8B5A28',
                                cursor: 'pointer', fontWeight: 600,
                            }}>
                                <Upload size={11} /> Upload
                            </button>
                            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePicture} />
                        </div>

                        {/* Title + Name */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <input placeholder="Title" value={form.title} onChange={(e) => set('title', e.target.value)}
                                    style={inputStyle}
                                    onFocus={(e) => { e.target.style.borderColor = '#C07840' }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(160,110,70,0.18)' }}
                                />
                                <input placeholder="Name *" value={form.name} onChange={(e) => set('name', e.target.value)}
                                    style={{ ...inputStyle, borderColor: !form.name.trim() ? 'rgba(231,76,60,0.3)' : undefined }}
                                    onFocus={(e) => { e.target.style.borderColor = '#C07840' }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(160,110,70,0.18)' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <input placeholder="Mobile" value={form.mobile} onChange={(e) => set('mobile', e.target.value)}
                                    style={inputStyle}
                                    onFocus={(e) => { e.target.style.borderColor = '#C07840' }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(160,110,70,0.18)' }}
                                />
                                <input placeholder="Alternate Mobile" value={form.alternate_mobile} onChange={(e) => set('alternate_mobile', e.target.value)}
                                    style={inputStyle}
                                    onFocus={(e) => { e.target.style.borderColor = '#C07840' }}
                                    onBlur={(e) => { e.target.style.borderColor = 'rgba(160,110,70,0.18)' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email + Company */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                        <input placeholder="Email *" type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                            style={{ ...inputStyle, borderColor: !form.email.trim() ? 'rgba(231,76,60,0.3)' : undefined }}
                            onFocus={(e) => { e.target.style.borderColor = '#C07840' }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(160,110,70,0.18)' }}
                        />
                        <input placeholder="Company" value={form.company} onChange={(e) => set('company', e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => { e.target.style.borderColor = '#C07840' }}
                            onBlur={(e) => { e.target.style.borderColor = 'rgba(160,110,70,0.18)' }}
                        />
                    </div>

                    {/* Category */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: '#A07850', marginBottom: 6, fontWeight: 600 }}>Category</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {CATEGORIES.map((cat) => (
                                <button key={cat} onClick={() => set('category', cat)} style={{
                                    padding: '8px 16px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                                    background: form.category === cat ? '#2A1E14' : 'rgba(160,110,70,0.06)',
                                    color: form.category === cat ? '#FAF7F2' : '#6B4E36',
                                    border: form.category === cat ? 'none' : '1px solid rgba(160,110,70,0.15)',
                                    cursor: 'pointer', transition: 'all 0.15s',
                                }}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <textarea placeholder="Notes" value={form.notes} onChange={(e) => set('notes', e.target.value)}
                        rows={3}
                        style={{
                            ...inputStyle, resize: 'vertical', width: '100%', marginBottom: 8,
                        }}
                        onFocus={(e) => { e.target.style.borderColor = '#C07840' }}
                        onBlur={(e) => { e.target.style.borderColor = 'rgba(160,110,70,0.18)' }}
                    />
                </div>

                {/* Save */}
                <div style={{ padding: '0 24px 20px' }}>
                    <button onClick={() => onSave(form)} disabled={!canSave || saving} style={{
                        width: '100%', padding: '13px 0', borderRadius: 10, fontSize: 14, fontWeight: 700,
                        background: canSave ? 'linear-gradient(135deg,#C07840,#E8A850)' : 'rgba(160,110,70,0.15)',
                        border: 'none', color: canSave ? '#FAF7F2' : '#C0A888',
                        cursor: canSave ? 'pointer' : 'not-allowed',
                        boxShadow: canSave ? '0 4px 20px rgba(192,120,64,0.35)' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s',
                    }}>
                        {saving && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                        {saving ? 'Saving…' : 'Save Contact'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Delete confirm dialog ──────────────────────────────────
function DeleteConfirm({ name, onConfirm, onCancel }) {
    return (
        <div onClick={onCancel} style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(10,5,2,0.5)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                background: '#FFFFFF', borderRadius: 14, padding: '24px 28px',
                maxWidth: 380, width: '100%', textAlign: 'center',
                boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
            }}>
                <Trash2 size={28} color="#E74C3C" style={{ marginBottom: 12 }} />
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#2A1E14', margin: '0 0 8px' }}>Delete Contact?</h3>
                <p style={{ fontSize: 13, color: '#8B5A28', margin: '0 0 20px' }}>
                    Are you sure you want to delete <strong>{name}</strong>? This cannot be undone.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    <button onClick={onCancel} style={{
                        padding: '9px 22px', borderRadius: 8, background: '#FAF7F2',
                        border: '1px solid rgba(160,110,70,0.2)', color: '#6B4E36',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={onConfirm} style={{
                        padding: '9px 22px', borderRadius: 8,
                        background: '#E74C3C', border: 'none', color: '#FFFFFF',
                        fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}>Delete</button>
                </div>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function Contacts() {
    const { projectId } = useParams()
    const projects = useCineStore((s) => s.projects)
    const openProject = useCineStore((s) => s.openProject)
    const project = projects.find((p) => p.id === projectId) ?? {}

    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [toast, setToast] = useState(null)
    const [search, setSearch] = useState('')
    const [filterCat, setFilterCat] = useState('All')
    const [sortBy, setSortBy] = useState('Name')
    const [showSort, setShowSort] = useState(false)
    const [showFilter, setShowFilter] = useState(false)
    const [modalContact, setModalContact] = useState(undefined) // undefined=closed, null=new, object=edit
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [selectedIds, setSelectedIds] = useState(new Set())

    const notify = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2200) }

    // ── Load contacts ────────────────────────────────────────
    useEffect(() => {
        if (!projectId) return
        openProject(projectId)
        let cancelled = false
        setLoading(true)
        apiGetContacts(projectId)
            .then((data) => { if (!cancelled) setContacts(data) })
            .catch(() => { })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [projectId])

    // ── Filter + sort ────────────────────────────────────────
    const filtered = contacts
        .filter((c) => {
            if (filterCat !== 'All' && c.category !== filterCat) return false
            if (!search.trim()) return true
            const q = search.toLowerCase()
            return (c.name || '').toLowerCase().includes(q) ||
                (c.email || '').toLowerCase().includes(q) ||
                (c.company || '').toLowerCase().includes(q) ||
                (c.mobile || '').includes(q)
        })
        .sort((a, b) => {
            if (sortBy === 'Name') return (a.name || '').localeCompare(b.name || '')
            if (sortBy === 'Category') return (a.category || '').localeCompare(b.category || '')
            if (sortBy === 'Company') return (a.company || '').localeCompare(b.company || '')
            if (sortBy === 'Recently Added') return (b.created_at || '').localeCompare(a.created_at || '')
            return 0
        })

    // ── Save (create or update) ──────────────────────────────
    const handleSave = async (form) => {
        setSaving(true)
        try {
            if (modalContact && modalContact.id) {
                const updated = await apiUpdateContact(projectId, modalContact.id, form)
                setContacts((prev) => prev.map((c) => c.id === modalContact.id ? updated : c))
                notify('✅ Contact updated')
            } else {
                const created = await apiCreateContact(projectId, form)
                setContacts((prev) => [...prev, created])
                notify('✅ Contact added')
            }
            setModalContact(undefined)
        } catch (err) {
            console.error(err)
            notify('❌ Save failed')
        } finally {
            setSaving(false)
        }
    }

    // ── Delete ───────────────────────────────────────────────
    const handleDelete = async () => {
        if (!deleteTarget) return
        try {
            await apiDeleteContact(projectId, deleteTarget.id)
            setContacts((prev) => prev.filter((c) => c.id !== deleteTarget.id))
            setSelectedIds((prev) => { const next = new Set(prev); next.delete(deleteTarget.id); return next })
            notify('🗑️ Contact deleted')
        } catch (err) {
            console.error(err)
            notify('❌ Delete failed')
        } finally {
            setDeleteTarget(null)
        }
    }

    // ── Checkbox selection ───────────────────────────────────
    const toggleSelect = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }
    const toggleAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filtered.map((c) => c.id)))
        }
    }

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
                }}>{toast}</div>
            )}

            {/* Modals */}
            {modalContact !== undefined && (
                <ContactModal
                    contact={modalContact}
                    onSave={handleSave}
                    onClose={() => setModalContact(undefined)}
                    saving={saving}
                />
            )}
            {deleteTarget && (
                <DeleteConfirm
                    name={deleteTarget.name}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 48px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>
                            <div style={{ width: 4, height: 26, background: 'linear-gradient(180deg,#C07840,#E8B870)', borderRadius: 2 }} />
                            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, fontWeight: 700, color: '#2A1E14', margin: 0 }}>
                                Contacts
                            </h1>
                            <span style={{ marginLeft: 6, fontSize: 13, color: '#A07850' }}>— {project.title || 'Project'}</span>
                        </div>
                        <p style={{ fontSize: 13, color: '#A07850', margin: '0 0 0 15px' }}>
                            Manage your crew, talent, extras, clients and all project contacts.
                        </p>
                    </div>
                    <button onClick={() => setModalContact(null)} style={{
                        padding: '10px 22px', borderRadius: 10, fontSize: 13.5, fontWeight: 700,
                        background: 'linear-gradient(135deg,#C07840,#E8A850)', border: 'none',
                        color: '#FAF7F2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
                        boxShadow: '0 4px 20px rgba(192,120,64,0.35)', transition: 'all 0.2s',
                    }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(192,120,64,0.45)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(192,120,64,0.35)' }}
                    >
                        <UserPlus size={15} /> Add Contact
                    </button>
                </div>

                {/* Search + Filter bar */}
                <div style={{
                    background: '#FFFFFF', borderRadius: 12, border: '1px solid rgba(160,110,70,0.1)',
                    padding: '12px 18px', marginBottom: 16,
                    display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                }}>
                    {/* Search */}
                    <div style={{
                        flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8,
                        background: '#FAF7F2', borderRadius: 8, padding: '8px 12px',
                        border: '1px solid rgba(160,110,70,0.1)',
                    }}>
                        <Search size={14} color="#C0A888" />
                        <input
                            placeholder="Search contacts…"
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            style={{
                                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                                fontSize: 13, color: '#2A1E14', fontFamily: 'Inter, sans-serif',
                            }}
                        />
                    </div>

                    {/* Filter */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => { setShowFilter(!showFilter); setShowSort(false) }} style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                            background: filterCat !== 'All' ? 'rgba(192,120,64,0.08)' : 'transparent',
                            border: '1px solid rgba(160,110,70,0.15)', color: '#6B4E36',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <Filter size={13} />
                            {filterCat === 'All' ? 'Showing All' : filterCat}
                        </button>
                        {showFilter && (
                            <div style={{
                                position: 'absolute', top: '110%', left: 0, background: '#FFFFFF',
                                border: '1px solid rgba(160,110,70,0.15)', borderRadius: 8, zIndex: 100,
                                minWidth: 140, boxShadow: '0 8px 28px rgba(0,0,0,0.1)', overflow: 'hidden',
                            }}>
                                {['All', ...CATEGORIES].map((cat) => (
                                    <button key={cat} onClick={() => { setFilterCat(cat); setShowFilter(false) }}
                                        style={{
                                            display: 'block', width: '100%', padding: '9px 14px',
                                            background: filterCat === cat ? 'rgba(192,120,64,0.06)' : 'transparent',
                                            border: 'none', color: '#2A1E14', fontSize: 12.5, textAlign: 'left',
                                            cursor: 'pointer', fontWeight: filterCat === cat ? 700 : 400,
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,120,64,0.06)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = filterCat === cat ? 'rgba(192,120,64,0.06)' : 'transparent' }}
                                    >{cat}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sort */}
                    <div style={{ position: 'relative' }}>
                        <button onClick={() => { setShowSort(!showSort); setShowFilter(false) }} style={{
                            padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600,
                            background: 'transparent', border: '1px solid rgba(160,110,70,0.15)',
                            color: '#6B4E36', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                            <ArrowUpDown size={13} /> Sort By
                        </button>
                        {showSort && (
                            <div style={{
                                position: 'absolute', top: '110%', right: 0, background: '#FFFFFF',
                                border: '1px solid rgba(160,110,70,0.15)', borderRadius: 8, zIndex: 100,
                                minWidth: 150, boxShadow: '0 8px 28px rgba(0,0,0,0.1)', overflow: 'hidden',
                            }}>
                                {SORT_OPTIONS.map((opt) => (
                                    <button key={opt} onClick={() => { setSortBy(opt); setShowSort(false) }}
                                        style={{
                                            display: 'block', width: '100%', padding: '9px 14px',
                                            background: sortBy === opt ? 'rgba(192,120,64,0.06)' : 'transparent',
                                            border: 'none', color: '#2A1E14', fontSize: 12.5, textAlign: 'left',
                                            cursor: 'pointer', fontWeight: sortBy === opt ? 700 : 400,
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,120,64,0.06)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = sortBy === opt ? 'rgba(192,120,64,0.06)' : 'transparent' }}
                                    >{opt}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    <span style={{ fontSize: 11.5, color: '#C0A888' }}>
                        {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Contacts Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <Loader2 size={28} color="#C07840" style={{ animation: 'spin 1s linear infinite' }} />
                        <p style={{ color: '#A07850', fontSize: 14, marginTop: 12 }}>Loading contacts…</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '80px 40px',
                        background: '#FFFFFF', borderRadius: 16,
                        border: '1px solid rgba(160,110,70,0.12)',
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'rgba(192,120,64,0.08)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 18px',
                        }}>
                            <User size={28} color="#C0A888" />
                        </div>
                        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, color: '#2A1E14', margin: '0 0 8px' }}>
                            {contacts.length === 0 ? 'No Contacts Yet' : 'No Matches'}
                        </h3>
                        <p style={{ fontSize: 13, color: '#A07850', margin: '0 0 22px', maxWidth: 360, marginLeft: 'auto', marginRight: 'auto' }}>
                            {contacts.length === 0
                                ? 'Add your first contact to start managing your crew, talent, and production team.'
                                : 'Try adjusting your search or filters.'}
                        </p>
                        {contacts.length === 0 && (
                            <button onClick={() => setModalContact(null)} style={{
                                padding: '12px 24px', borderRadius: 10,
                                background: 'linear-gradient(135deg,#C07840,#E8A850)', border: 'none',
                                color: '#FAF7F2', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                boxShadow: '0 3px 16px rgba(192,120,64,0.35)',
                            }}>
                                <UserPlus size={15} /> Add First Contact
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{
                        background: '#FFFFFF', borderRadius: 14, overflow: 'hidden',
                        border: '1px solid rgba(160,110,70,0.1)',
                        boxShadow: '0 2px 12px rgba(100,60,20,0.04)',
                    }}>
                        {/* Table header */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 2fr 2fr 1.5fr 1.2fr 1fr 80px',
                            padding: '12px 20px',
                            background: 'rgba(192,120,64,0.04)',
                            borderBottom: '1px solid rgba(160,110,70,0.1)',
                            alignItems: 'center',
                        }}>
                            <div>
                                <input type="checkbox"
                                    checked={selectedIds.size === filtered.length && filtered.length > 0}
                                    onChange={toggleAll}
                                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#C07840' }}
                                />
                            </div>
                            {['Name', 'Email', 'Phone', 'Company', 'Category'].map((h) => (
                                <span key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#6B4E36', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {h}
                                </span>
                            ))}
                            <span />
                        </div>

                        {/* Rows */}
                        {filtered.map((c) => (
                            <div key={c.id} style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 2fr 2fr 1.5fr 1.2fr 1fr 80px',
                                padding: '14px 20px',
                                borderBottom: '1px solid rgba(160,110,70,0.06)',
                                alignItems: 'center',
                                transition: 'background 0.12s',
                            }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = '#FEFCF9' }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF' }}
                            >
                                <div>
                                    <input type="checkbox"
                                        checked={selectedIds.has(c.id)}
                                        onChange={() => toggleSelect(c.id)}
                                        style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#C07840' }}
                                    />
                                </div>

                                {/* Name + avatar */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <Avatar name={c.name} pictureUrl={c.picture_url} size={32} />
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2A1E14' }}>
                                            {c.title && <span style={{ color: '#A07850' }}>{c.title} </span>}
                                            {c.name}
                                        </div>
                                        <CategoryBadge category={c.category} />
                                    </div>
                                </div>

                                {/* Email */}
                                <div style={{ fontSize: 12.5, color: '#5A3E2A' }}>
                                    {c.email || '—'}
                                </div>

                                {/* Phone */}
                                <div style={{ fontSize: 12.5, color: '#5A3E2A' }}>
                                    {c.mobile && <div>{c.mobile}</div>}
                                    {c.alternate_mobile && <div style={{ fontSize: 11.5, color: '#A07850' }}>{c.alternate_mobile}</div>}
                                    {!c.mobile && !c.alternate_mobile && '—'}
                                </div>

                                {/* Company */}
                                <div style={{ fontSize: 12.5, color: '#5A3E2A' }}>
                                    {c.company || '—'}
                                </div>

                                {/* Category (already shown in name column as badge) */}
                                <div>
                                    <CategoryBadge category={c.category} />
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                                    <button onClick={() => setModalContact(c)} title="Edit" style={{
                                        background: 'none', border: 'none', padding: 6, borderRadius: 6,
                                        cursor: 'pointer', color: '#C07840', transition: 'background 0.1s',
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(192,120,64,0.08)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button onClick={() => setDeleteTarget(c)} title="Delete" style={{
                                        background: 'none', border: 'none', padding: 6, borderRadius: 6,
                                        cursor: 'pointer', color: '#C0392B', transition: 'background 0.1s',
                                    }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(231,76,60,0.06)' }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
            `}</style>
        </div>
    )
}
