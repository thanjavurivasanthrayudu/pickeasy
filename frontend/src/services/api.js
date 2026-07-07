import axios from 'axios'

const api = axios.create({
    baseURL: '/api/v1',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
})

// ── Request Interceptor — inject access token ──────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// ── Response Interceptor — handle 401 / token refresh ─────────────────
api.interceptors.response.use(
    (res) => res,
    async (err) => {
        const original = err.config
        if (err.response?.status === 401 && !original._retry) {
            original._retry = true
            const refreshToken = localStorage.getItem('refresh_token')
            if (!refreshToken) {
                localStorage.clear()
                window.location.href = '/login'
                return Promise.reject(err)
            }
            try {
                const { data } = await axios.post('/api/v1/auth/refresh', {}, {
                    headers: { Authorization: `Bearer ${refreshToken}` },
                })
                localStorage.setItem('access_token', data.data.access_token)
                localStorage.setItem('refresh_token', data.data.refresh_token)
                original.headers.Authorization = `Bearer ${data.data.access_token}`
                return api(original)
            } catch {
                localStorage.clear()
                window.location.href = '/login'
            }
        }
        return Promise.reject(err)
    }
)

// ── Auth API ───────────────────────────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    refresh: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
    sendOtp: (data) => api.post('/auth/send-otp', data),
    verifyOtp: (data) => api.post('/auth/verify-otp', data),
    forgotPassword: (data) => api.post('/auth/forgot-password', data),
    resetPassword: (data) => api.post('/auth/reset-password', data),
    changePassword: (data) => api.post('/auth/change-password', data),
}

// ── Customer API ───────────────────────────────────────────────────────
export const customerAPI = {
    getProfile: () => api.get('/customers/me'),
    updateProfile: (data) => api.put('/customers/me', data),
    uploadPhoto: (form) => api.post('/customers/me/photo', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
}

// ── Vehicle API ────────────────────────────────────────────────────────
export const vehicleAPI = {
    list: () => api.get('/vehicles'),
    create: (data) => api.post('/vehicles', data),
    update: (id, data) => api.put(`/vehicles/${id}`, data),
    delete: (id) => api.delete(`/vehicles/${id}`),
    brands: () => api.get('/vehicles/brands'),
    models: (brandId) => api.get(`/vehicles/models?brand_id=${brandId}`),
}

// ── Booking API ────────────────────────────────────────────────────────
export const bookingAPI = {
    list: (params) => api.get('/bookings', { params }),
    create: (data) => api.post('/bookings', data),
    get: (id) => api.get(`/bookings/${id}`),
    cancel: (id, d) => api.put(`/bookings/${id}/cancel`, d),
    accept: (id) => api.put(`/bookings/${id}/accept`),
    reject: (id, d) => api.put(`/bookings/${id}/reject`, d),
    updateStatus: (id, d) => api.put(`/bookings/${id}/status`, d),
    track: (id) => api.get(`/bookings/${id}/track`),
}

// ── Service API ────────────────────────────────────────────────────────
export const serviceAPI = {
    categories: () => api.get('/services/categories'),
    packages: (id) => api.get(`/services/categories/${id}/packages`),
    allPackages: () => api.get('/services/packages'),
}

// ── Payment API ────────────────────────────────────────────────────────
export const paymentAPI = {
    createOrder: (data) => api.post('/payments/create-order', data),
    verify: (data) => api.post('/payments/verify', data),
    list: () => api.get('/payments'),
    refund: (id) => api.post(`/payments/${id}/refund`),
}

// ── Review API ─────────────────────────────────────────────────────────
export const reviewAPI = {
    create: (data) => api.post('/reviews', data),
    getForMechanic: (id) => api.get(`/reviews/mechanic/${id}`),
}

// ── Notification API ───────────────────────────────────────────────────
export const notificationAPI = {
    list: (params) => api.get('/notifications', { params }),
    markRead: (id) => api.put(`/notifications/${id}/read`),
    markAllRead: () => api.put('/notifications/read-all'),
}

// ── Admin API ──────────────────────────────────────────────────────────
export const adminAPI = {
    dashboard: () => api.get('/admin/dashboard'),
    customers: (p) => api.get('/admin/customers', { params: p }),
    mechanics: (p) => api.get('/admin/mechanics', { params: p }),
    approveMechanic: (id) => api.put(`/admin/mechanics/${id}/approve`),
    rejectMechanic: (id, data) => api.put(`/admin/mechanics/${id}/reject`, data),
    suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
    activateUser: (id) => api.put(`/admin/users/${id}/activate`),
    allBookings: (p) => api.get('/admin/bookings', { params: p }),
    reports: (p) => api.get('/admin/reports', { params: p }),
    inventory: () => api.get('/inventory'),
    updateInventory: (id, data) => api.put(`/inventory/${id}`, data),
    leaderboard: (p) => api.get('/admin/leaderboard', { params: p }),
}

// ── Coupon API ─────────────────────────────────────────────────────────
export const couponAPI = {
    validate: (code) => api.post('/coupons/validate', { code }),
    list: () => api.get('/coupons'),
    create: (data) => api.post('/coupons', data),
}

// ── Mechanic API ───────────────────────────────────────────────────────
export const mechanicAPI = {
    getProfile: () => api.get('/mechanics/me'),
    updateProfile: (data) => api.put('/mechanics/me', data),
    toggleAvailability: () => api.put('/mechanics/me/availability/toggle'),
    updateLocation: (data) => api.put('/mechanics/me/location', data),
    uploadDocument: (form) => api.post('/mechanics/me/documents', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
    earnings: (p) => api.get('/mechanics/me/earnings', { params: p }),
    leaderboard: () => api.get('/mechanics/leaderboard'),
}

// ── Invoice API ────────────────────────────────────────────────────────
export const invoiceAPI = {
    get: (id) => api.get(`/bookings/${id}/invoice`),
    download: (id) => api.get(`/bookings/${id}/invoice/pdf`, { responseType: 'blob' }),
}

// ── Support API ────────────────────────────────────────────────────────
export const supportAPI = {
    createTicket: (data) => api.post('/support/tickets', data),
    listTickets: () => api.get('/support/tickets'),
    getTicket: (id) => api.get(`/support/tickets/${id}`),
    sendMessage: (id, d) => api.post(`/support/tickets/${id}/messages`, d),
}

export default api
