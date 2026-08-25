/**
 * Central registry of every backend API endpoint the frontend expects.
 * When the real backend is ready, you only need to make sure it implements
 * these routes with the shapes described in API_DOCUMENTATION.md — nothing
 * else in the app needs to change.
 *
 * Base URL is prepended by axiosInstance (VITE_API_BASE_URL).
 */

export const ENDPOINTS = {
  // ---------------- AUTH ----------------
  AUTH: {
    REQUEST_OTP: '/auth/request-otp',       // POST  { virtualNumber }
    VERIFY_OTP: '/auth/verify-otp',         // POST  { virtualNumber, otp }
    LOGIN: '/auth/login',                   // POST  { email, password }
    SIGNUP: '/auth/signup',                 // POST  { name, email, password }
    LOGOUT: '/auth/logout',                 // POST
    REFRESH_TOKEN: '/auth/refresh-token',   // POST  { refreshToken }
    ME: '/auth/me',                         // GET   current user + role + tenant
  },

  // ---------------- DASHBOARD ----------------
  DASHBOARD: {
    SUMMARY: '/dashboard/summary',          // GET   totals: campaigns, credits, users
    RECENT_ACTIVITY: '/dashboard/activity', // GET   ?limit=10
    PERFORMANCE_CHART: '/dashboard/performance', // GET ?range=7d|30d|90d
  },

  // ---------------- BROADCAST CAMPAIGNS ("Send via WA") ----------------
  CAMPAIGNS: {
    LIST: '/campaigns',                     // GET   ?page=&limit=&status=&search=
    CREATE: '/campaigns',                   // POST  multipart/form-data (see docs)
    GET_BY_ID: (id) => `/campaigns/${id}`,  // GET
    UPDATE: (id) => `/campaigns/${id}`,     // PUT
    DELETE: (id) => `/campaigns/${id}`,     // DELETE
    START: (id) => `/campaigns/${id}/start`,     // POST
    PAUSE: (id) => `/campaigns/${id}/pause`,     // POST
    RESUME: (id) => `/campaigns/${id}/resume`,   // POST
    CANCEL: (id) => `/campaigns/${id}/cancel`,   // POST
    STATUS: (id) => `/campaigns/${id}/status`,   // GET  live progress (poll or replace w/ WS)
    PREVIEW_RECIPIENTS: '/campaigns/preview-recipients', // POST validated count from uploaded file
  },

  // ---------------- WA HISTORY ----------------
  WA_HISTORY: {
    LIST: '/wa-history',                    // GET  ?page=&limit=&dateFrom=&dateTo=&status=
    DETAIL: (id) => `/wa-history/${id}`,    // GET  full delivery breakdown for one campaign
    EXPORT: '/wa-history/export',           // GET  ?format=excel|pdf&...filters
  },

  // ---------------- SCHEDULED CAMPAIGNS ----------------
  SCHEDULED: {
    LIST: '/campaigns/scheduled',           // GET  ?page=&limit=&status=
    CREATE_SCHEDULE: (campaignId) => `/campaigns/${campaignId}/schedule`, // POST { scheduledAt }
    UPDATE_SCHEDULE: (campaignId) => `/campaigns/${campaignId}/schedule`, // PUT  { scheduledAt }
    CANCEL_SCHEDULE: (campaignId) => `/campaigns/${campaignId}/schedule`, // DELETE
    RUN_NOW: (campaignId) => `/campaigns/${campaignId}/run-now`,          // POST
  },

  // ---------------- CONTACT / USER MANAGEMENT ----------------
  CONTACTS: {
    LIST: '/contacts',                      // GET   ?page=&limit=&groupId=&search=
    CREATE: '/contacts',                    // POST  { name, phone, groupId, ...custom }
    BULK_IMPORT: '/contacts/bulk-import',   // POST  multipart/form-data (csv/xlsx/pdf)
    IMPORT_STATUS: (jobId) => `/contacts/bulk-import/${jobId}`, // GET  validation/dedup progress
    GET_BY_ID: (id) => `/contacts/${id}`,   // GET
    UPDATE: (id) => `/contacts/${id}`,      // PUT
    DELETE: (id) => `/contacts/${id}`,      // DELETE
    BULK_DELETE: '/contacts/bulk-delete',   // POST  { ids: [] }
    GROUPS: '/contacts/groups',             // GET/POST list & create groups
    GROUP_BY_ID: (id) => `/contacts/groups/${id}`, // PUT/DELETE
    TAGS: '/contacts/tags',                 // GET distinct tags
  },

  // ---------------- CREDIT MANAGEMENT ----------------
  CREDITS: {
    WALLET: '/credits/wallet',              // GET   current balance + status
    HISTORY: '/credits/history',            // GET   ?page=&limit=&type=credit|debit
    ADD_CREDIT: '/credits/add',             // POST  { amount, method, reference }  (Super Admin/Reseller)
    TRANSFER: '/credits/transfer',          // POST  { toTenantId, amount }         (Reseller -> Client)
    PRICING: '/credits/pricing',            // GET   per-message cost by type
  },

  // ---------------- MEDIA ----------------
  MEDIA: {
    LIST: '/media',                         // GET   list media
    PRESIGN_UPLOAD: '/media/presign',       // POST  { fileName, fileType } -> { uploadUrl, fileUrl }
    CONFIRM_UPLOAD: '/media/confirm',       // POST  { fileUrl, ... }
    DELETE: (id) => `/media/${id}`,         // DELETE
  },

  // ---------------- NOTIFICATIONS ----------------
  NOTIFICATIONS: {
    LIST: '/notifications',                 // GET   ?unreadOnly=
    MARK_READ: (id) => `/notifications/${id}/read`, // POST
    MARK_ALL_READ: '/notifications/read-all',       // POST
  },

  // ---------------- WHATSAPP CONNECTION / TEMPLATES ----------------
  WHATSAPP: {
    CONFIG: '/whatsapp/config',             // GET masked config+status | POST save credentials
    CONNECT: '/whatsapp/connect',           // POST validate creds with Meta & register
    DISCONNECT: '/whatsapp/disconnect',     // POST
    WEBHOOK_INFO: '/whatsapp/webhook-info', // GET   { callbackUrl, verifyToken }
    TEMPLATES_SYNC: '/whatsapp/templates/sync', // POST pull templates from Meta
    TEMPLATES: '/whatsapp/templates',       // GET   ?status=&category=&search=
    TEMPLATE_CREATE: '/whatsapp/templates', // POST  full payload (see validators)
    TEMPLATE_BY_ID: (id) => `/whatsapp/templates/${id}`, // GET / PUT / DELETE
    TEMPLATE_SUBMIT: (id) => `/whatsapp/templates/${id}/submit`, // POST -> Meta approval
  },
  VARIABLES: {
    LIST: '/variables',                      // GET  ?search=
    CREATE: '/variables',                    // POST
    BY_ID: (id) => `/variables/${id}`,       // PUT / DELETE
  },
  BROADCASTS: {
    LIST: '/broadcasts',                     // GET ?page=&limit=
    CREATE: '/broadcasts',                   // POST create + start sending
    PREVIEW_COUNT: '/broadcasts/preview-count', // POST { audience } -> { count }
    BY_ID: (id) => `/broadcasts/${id}`,      // GET live status
    PAUSE: (id) => `/broadcasts/${id}/pause`,   // POST
    RESUME: (id) => `/broadcasts/${id}/resume`, // POST
  },
};

export default ENDPOINTS;
