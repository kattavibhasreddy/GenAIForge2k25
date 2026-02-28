import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Clapperboard, ArrowLeft, LogOut, Folder, ChevronLeft, ChevronRight, Sparkles, Film, Users, Camera, DollarSign, Crosshair, Contact } from 'lucide-react'
import useCineStore from '../store/useCineStore'
import useAuthStore from '../store/useAuthStore'

const baseNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/studio', label: 'Story Studio', icon: Sparkles },
]

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()

    const activeProjectId = useCineStore((s) => s.activeProjectId)
    const projects = useCineStore((s) => s.projects)
    const activeProject = projects.find((p) => p.id === activeProjectId)

    return (
        <aside style={{
            width: collapsed ? '64px' : '228px',
            minHeight: '100vh',
            background: '#FFFFFF',
            borderRight: '1px solid rgba(160,110,70,0.13)',
            display: 'flex', flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
            position: 'relative', flexShrink: 0, zIndex: 10,
        }}>
            {/* Logo */}
            <div onClick={() => navigate('/dashboard')} style={{
                padding: collapsed ? '20px 0' : '20px 18px',
                borderBottom: '1px solid rgba(160,110,70,0.1)',
                display: 'flex', alignItems: 'center', gap: 11,
                justifyContent: collapsed ? 'center' : 'flex-start',
                cursor: 'pointer', overflow: 'hidden',
            }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#C07840,#8B5A28)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(192,120,64,0.3)' }}>
                    <Clapperboard size={16} color="#FAF7F2" />
                </div>
                {!collapsed && (
                    <div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 14, fontWeight: 700, color: '#2A1E14', lineHeight: 1.2 }}>Inception</div>
                        <div style={{ fontSize: 9.5, color: '#C07840', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Labs</div>
                    </div>
                )}
            </div>

            {/* Back to Projects */}
            <button onClick={() => navigate('/projects')} title="All Projects" style={{
                display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 8,
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '10px 0' : '9px 16px',
                margin: '10px 8px 0', borderRadius: 8,
                background: 'none', border: '1px solid rgba(160,110,70,0.15)',
                color: '#A07850', fontSize: 12, cursor: 'pointer',
                width: 'calc(100% - 16px)', transition: 'all 0.18s ease',
            }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#FAF7F2'; e.currentTarget.style.color = '#6B4E36' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#A07850' }}
            >
                <ArrowLeft size={13} style={{ flexShrink: 0 }} />
                {!collapsed && <span>All Projects</span>}
            </button>

            {/* Active project info */}
            {!collapsed && activeProject && (
                <div style={{ margin: '8px 10px 2px', padding: '10px 12px', background: '#FAF7F2', borderRadius: 8, border: '1px solid rgba(160,110,70,0.14)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Folder size={11} color="#C07840" />
                        <span style={{ fontSize: 9.5, color: '#A07850', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Active Project</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#2A1E14', fontWeight: 600, marginBottom: 1 }}>{activeProject.title}</div>
                    <div style={{ fontSize: 11, color: '#C07840' }}>{activeProject.genre}</div>
                </div>
            )}

            {/* Nav */}
            <nav style={{ flex: 1, padding: '8px 8px' }}>
                {[
                    ...baseNavItems.slice(0, 1),
                    ...(activeProjectId ? [
                        { path: `/project/${activeProjectId}`, label: 'Project', icon: Film },
                        { path: `/project/${activeProjectId}/callsheet`, label: 'Call Sheet', icon: Users },
                        { path: '/storyboard', label: 'Storyboard', icon: Camera },
                        { path: `/project/${activeProjectId}/budget`, label: 'Budget', icon: DollarSign },
                        { path: `/project/${activeProjectId}/shot-designer`, label: 'Shot Designer', icon: Crosshair },
                        { path: `/project/${activeProjectId}/contacts`, label: 'Contacts', icon: Contact },
                    ] : []),
                    ...baseNavItems.slice(1),
                ].map(({ path, label, icon: Icon }) => {
                    const active = location.pathname === path
                    return (
                        <NavLink key={path} to={path} style={{
                            display: 'flex', alignItems: 'center', gap: 11,
                            padding: collapsed ? '11px 0' : '10px 13px',
                            borderRadius: 8, marginBottom: 3,
                            justifyContent: collapsed ? 'center' : 'flex-start',
                            textDecoration: 'none',
                            color: active ? '#8B5A28' : '#9A7A60',
                            background: active ? 'linear-gradient(90deg,rgba(192,120,64,0.12),transparent)' : 'transparent',
                            borderLeft: active ? '2px solid #C07840' : '2px solid transparent',
                            transition: 'all 0.18s ease',
                        }}
                            onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = '#FAF7F2'; e.currentTarget.style.color = '#5A3E2A' } }}
                            onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A7A60' } }}
                        >
                            <Icon size={17} style={{ flexShrink: 0 }} />
                            {!collapsed && <span style={{ fontSize: 13.5, fontWeight: active ? 700 : 400, whiteSpace: 'nowrap' }}>{label}</span>}
                        </NavLink>
                    )
                })}
            </nav>

            {/* User */}
            <div style={{ borderTop: '1px solid rgba(160,110,70,0.1)', padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', gap: 8 }}>
                {!collapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#C07840,#E8A870)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                            {(() => { const u = useAuthStore.getState().user; const name = u?.name || u?.email?.split('@')[0] || 'U'; return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) })()}
                        </div>
                        <div>
                            <div style={{ fontSize: 12, color: '#2A1E14', fontWeight: 600 }}>
                                {(() => { const u = useAuthStore.getState().user; return u?.name || u?.email?.split('@')[0] || 'User' })()}
                            </div>
                            <div style={{ fontSize: 10, color: '#A07850' }}>Director</div>
                        </div>
                    </div>
                )}
                <button
                    onClick={async () => { await useAuthStore.getState().logout(); navigate('/') }}
                    title="Log out"
                    style={{ background: 'none', border: 'none', color: '#C0A888', cursor: 'pointer', padding: 5 }}
                >
                    <LogOut size={14} />
                </button>
            </div>

            {/* Collapse toggle */}
            <button onClick={() => setCollapsed(!collapsed)} style={{
                position: 'absolute', top: 60, right: -11,
                width: 22, height: 22, borderRadius: '50%',
                background: '#FFFFFF', border: '1px solid rgba(192,120,64,0.3)',
                color: '#C07840', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
            }}>
                {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
            </button>
        </aside>
    )
}
