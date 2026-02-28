/**
 * CineForge AI — API Client
 * Centralized fetch wrapper for the FastAPI backend.
 */

const BASE_URL = 'http://localhost:8000'

// ── Helper ────────────────────────────────────────────────────
async function request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('cf_access_token')
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    // 204 No Content
    if (res.status === 204) return null

    const data = await res.json()
    if (!res.ok) {
        throw new Error(data.detail || `Request failed (${res.status})`)
    }
    return data
}

// ── Auth ──────────────────────────────────────────────────────

export async function apiSignup(email, password, name) {
    const data = await request('POST', '/auth/signup', { email, password, name })
    // Persist tokens
    localStorage.setItem('cf_access_token', data.access_token)
    localStorage.setItem('cf_refresh_token', data.refresh_token)
    return data
}

export async function apiLogin(email, password) {
    const data = await request('POST', '/auth/login', { email, password })
    localStorage.setItem('cf_access_token', data.access_token)
    localStorage.setItem('cf_refresh_token', data.refresh_token)
    return data
}

export async function apiLogout() {
    try {
        await request('POST', '/auth/logout')
    } catch {
        // best-effort
    }
    localStorage.removeItem('cf_access_token')
    localStorage.removeItem('cf_refresh_token')
}

export async function apiRefreshToken() {
    const refreshToken = localStorage.getItem('cf_refresh_token')
    if (!refreshToken) throw new Error('No refresh token')
    const data = await request('POST', '/auth/refresh', { refresh_token: refreshToken })
    localStorage.setItem('cf_access_token', data.access_token)
    localStorage.setItem('cf_refresh_token', data.refresh_token)
    return data
}

export async function apiGetMe() {
    return request('GET', '/auth/me')
}

// ── Projects ─────────────────────────────────────────────────

export async function apiListProjects() {
    const data = await request('GET', '/projects')
    return data.projects || []
}

export async function apiCreateProject(projectData) {
    return request('POST', '/projects', projectData)
}

export async function apiUpdateProject(projectId, projectData) {
    return request('PATCH', `/projects/${projectId}`, projectData)
}

export async function apiDeleteProject(projectId) {
    return request('DELETE', `/projects/${projectId}`)
}

// ── Generation ───────────────────────────────────────────────

export async function apiGenerate(projectId, story) {
    return request('POST', '/generate', { project_id: projectId, story })
}

export async function apiGetLatestGeneration(projectId) {
    return request('GET', `/generate/${projectId}/latest`)
}

export async function apiEditScript(script, action, tone = null) {
    const body = { script, action }
    if (tone) body.tone = tone
    return request('POST', '/generate/edit-script', body)
}

export async function apiGetGenerationHistory(projectId) {
    return request('GET', `/generate/${projectId}/history`)
}

// ── Call Sheet ────────────────────────────────────────────────
export async function apiGetCallSheet(projectId) {
    return request('GET', `/callsheet/${projectId}`)
}

export async function apiAddCallSheetEntry(projectId, data) {
    return request('POST', `/callsheet/${projectId}`, data)
}

export async function apiUpdateCallSheetEntry(entryId, data) {
    return request('PUT', `/callsheet/entry/${entryId}`, data)
}

export async function apiDeleteCallSheetEntry(entryId) {
    return request('DELETE', `/callsheet/entry/${entryId}`)
}

// ── Storyboard ───────────────────────────────────────────────
export async function apiGenerateStoryboard(shotDesign) {
    return request('POST', '/generate/storyboard', { shot_design: shotDesign })
}

// ── Screenplay Save ──────────────────────────────────────────
export async function apiSaveScreenplay(generationId, screenplay) {
    return request('PUT', `/generate/${generationId}/screenplay`, { screenplay })
}

// ── Budget ───────────────────────────────────────────────────
export async function apiGetBudget(projectId) {
    const data = await request('GET', `/budget/${projectId}`)
    return data.items || []
}

export async function apiAddBudgetItem(projectId, data) {
    return request('POST', `/budget/${projectId}`, data)
}

export async function apiUpdateBudgetItem(itemId, data) {
    return request('PUT', `/budget/item/${itemId}`, data)
}

export async function apiDeleteBudgetItem(itemId) {
    return request('DELETE', `/budget/item/${itemId}`)
}

// ── Shot Design ─────────────────────────────────────────────
export async function apiGetShotDesigns(projectId) {
    const data = await request('GET', `/shot-design/${projectId}`)
    return data.designs || []
}

export async function apiCreateShotDesign(projectId, data) {
    return request('POST', `/shot-design/${projectId}`, data)
}

export async function apiUpdateShotDesign(projectId, designId, data) {
    return request('PUT', `/shot-design/${projectId}/${designId}`, data)
}

export async function apiDeleteShotDesign(projectId, designId) {
    return request('DELETE', `/shot-design/${projectId}/${designId}`)
}

// ── Contacts ────────────────────────────────────────────────
export async function apiGetContacts(projectId) {
    const data = await request('GET', `/contacts/${projectId}`)
    return data.contacts || []
}

export async function apiCreateContact(projectId, data) {
    return request('POST', `/contacts/${projectId}`, data)
}

export async function apiUpdateContact(projectId, contactId, data) {
    return request('PUT', `/contacts/${projectId}/${contactId}`, data)
}

export async function apiDeleteContact(projectId, contactId) {
    return request('DELETE', `/contacts/${projectId}/${contactId}`)
}
