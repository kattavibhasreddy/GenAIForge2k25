import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'
import Landing from './pages/Landing'
import Projects from './pages/Projects'
import Dashboard from './pages/Dashboard'
import StoryStudio from './pages/StoryStudio'
import ProjectDashboard from './pages/ProjectDashboard'
import CallSheet from './pages/CallSheet'
import Storyboard from './pages/Storyboard'
import Budget from './pages/Budget'
import ShotDesigner from './pages/ShotDesigner'
import Contacts from './pages/Contacts'

// ── Route guard ──────────────────────────────────────────────
function ProtectedRoute({ children }) {
    const user = useAuthStore((s) => s.user)
    const loading = useAuthStore((s) => s.loading)

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#F5EFE5', fontFamily: 'Inter, sans-serif',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 32, height: 32, border: '3px solid rgba(192,120,64,0.2)',
                        borderTopColor: '#C07840', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite', margin: '0 auto 14px',
                    }} />
                    <p style={{ color: '#A07850', fontSize: 14 }}>Restoring session…</p>
                </div>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        )
    }

    if (!user) return <Navigate to="/" replace />
    return children
}

// ── Routes ───────────────────────────────────────────────────
function AnimatedRoutes() {
    const location = useLocation()
    return (
        <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
            <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/project/:projectId" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
            <Route path="/project/:projectId/callsheet" element={<ProtectedRoute><CallSheet /></ProtectedRoute>} />
            <Route path="/storyboard" element={<ProtectedRoute><Storyboard /></ProtectedRoute>} />
            <Route path="/project/:projectId/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
            <Route path="/project/:projectId/shot-designer" element={<ProtectedRoute><ShotDesigner /></ProtectedRoute>} />
            <Route path="/project/:projectId/contacts" element={<ProtectedRoute><Contacts /></ProtectedRoute>} />
            <Route path="/studio" element={<ProtectedRoute><StoryStudio /></ProtectedRoute>} />
        </Routes>
    )
}

// ── App ──────────────────────────────────────────────────────
export default function App() {
    const loadFromStorage = useAuthStore((s) => s.loadFromStorage)

    useEffect(() => {
        loadFromStorage()
    }, [])

    return (
        <BrowserRouter>
            <AnimatedRoutes />
        </BrowserRouter>
    )
}
