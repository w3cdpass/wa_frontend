import axiosInstance from './axiosInstance';
import { ENDPOINTS } from './endpoints';

const api = {
  // Dashboard
  getDashboardSummary: () => axiosInstance.get(ENDPOINTS.DASHBOARD.SUMMARY),
  getPerformanceChart: (range = '7d') => axiosInstance.get(ENDPOINTS.DASHBOARD.PERFORMANCE_CHART, { params: { range } }),
  getRecentActivity: (limit = 10) => axiosInstance.get(ENDPOINTS.DASHBOARD.RECENT_ACTIVITY, { params: { limit } }),

  // Campaigns
  listCampaigns: (params) => axiosInstance.get(ENDPOINTS.CAMPAIGNS.LIST, { params }),
  createCampaign: (data) => axiosInstance.post(ENDPOINTS.CAMPAIGNS.CREATE, data),
  getCampaign: (id) => axiosInstance.get(ENDPOINTS.CAMPAIGNS.GET_BY_ID(id)),
  updateCampaign: (id, data) => axiosInstance.put(ENDPOINTS.CAMPAIGNS.UPDATE(id), data),
  deleteCampaign: (id) => axiosInstance.delete(ENDPOINTS.CAMPAIGNS.DELETE(id)),
  startCampaign: (id) => axiosInstance.post(ENDPOINTS.CAMPAIGNS.START(id)),
  pauseCampaign: (id) => axiosInstance.post(ENDPOINTS.CAMPAIGNS.PAUSE(id)),
  resumeCampaign: (id) => axiosInstance.post(ENDPOINTS.CAMPAIGNS.RESUME(id)),
  cancelCampaign: (id) => axiosInstance.post(ENDPOINTS.CAMPAIGNS.CANCEL(id)),
  getCampaignStatus: (id) => axiosInstance.get(ENDPOINTS.CAMPAIGNS.STATUS(id)),
  previewRecipients: (data) => axiosInstance.post(ENDPOINTS.CAMPAIGNS.PREVIEW_RECIPIENTS, data),
  runScheduledNow: (campaignId) => axiosInstance.post(ENDPOINTS.SCHEDULED.RUN_NOW(campaignId)),
  scheduleCampaign: (campaignId, scheduledAt) => axiosInstance.post(ENDPOINTS.SCHEDULED.CREATE_SCHEDULE(campaignId), { scheduledAt }),
  updateSchedule: (campaignId, scheduledAt) => axiosInstance.put(ENDPOINTS.SCHEDULED.UPDATE_SCHEDULE(campaignId), { scheduledAt }),
  cancelSchedule: (campaignId) => axiosInstance.delete(ENDPOINTS.SCHEDULED.CANCEL_SCHEDULE(campaignId)),
  getScheduledCampaigns: () => axiosInstance.get(ENDPOINTS.SCHEDULED.LIST),

  // WA History
  listWaHistory: (params) => axiosInstance.get(ENDPOINTS.WA_HISTORY.LIST, { params }),
  getWaHistoryDetail: (id) => axiosInstance.get(ENDPOINTS.WA_HISTORY.DETAIL(id)),
  exportWaHistory: (params) => axiosInstance.get(ENDPOINTS.WA_HISTORY.EXPORT, { params }),

  // Contacts
  listContacts: (params) => axiosInstance.get(ENDPOINTS.CONTACTS.LIST, { params }),
  createContact: (data) => axiosInstance.post(ENDPOINTS.CONTACTS.CREATE, data),
  getContact: (id) => axiosInstance.get(ENDPOINTS.CONTACTS.GET_BY_ID(id)),
  updateContact: (id, data) => axiosInstance.put(ENDPOINTS.CONTACTS.UPDATE(id), data),
  deleteContact: (id) => axiosInstance.delete(ENDPOINTS.CONTACTS.DELETE(id)),
  bulkDeleteContacts: (ids) => axiosInstance.post(ENDPOINTS.CONTACTS.BULK_DELETE, { ids }),
  bulkImportContacts: (rows, source) => axiosInstance.post(ENDPOINTS.CONTACTS.BULK_IMPORT, { rows, source }),
  listGroups: (params) => axiosInstance.get(ENDPOINTS.CONTACTS.GROUPS, { params }),
  createGroup: (name) => axiosInstance.post(ENDPOINTS.CONTACTS.GROUPS, { name }),
  updateGroup: (id, name) => axiosInstance.put(ENDPOINTS.CONTACTS.GROUP_BY_ID(id), { name }),
  deleteGroup: (id) => axiosInstance.delete(ENDPOINTS.CONTACTS.GROUP_BY_ID(id)),

  // Credits
  getWallet: () => axiosInstance.get(ENDPOINTS.CREDITS.WALLET),
  getCreditHistory: (params) => axiosInstance.get(ENDPOINTS.CREDITS.HISTORY, { params }),
  addCredit: (data) => axiosInstance.post(ENDPOINTS.CREDITS.ADD_CREDIT, data),
  transferCredit: (data) => axiosInstance.post(ENDPOINTS.CREDITS.TRANSFER, data),
  getPricing: () => axiosInstance.get(ENDPOINTS.CREDITS.PRICING),

  // Media
  presignUpload: (data) => axiosInstance.post(ENDPOINTS.MEDIA.PRESIGN_UPLOAD, data),
  confirmUpload: (data) => axiosInstance.post(ENDPOINTS.MEDIA.CONFIRM_UPLOAD, data),
  deleteMedia: (id) => axiosInstance.delete(ENDPOINTS.MEDIA.DELETE(id)),
  listMedia: (params) => axiosInstance.get(ENDPOINTS.MEDIA.LIST, { params }),

  // Notifications
  listNotifications: (params) => axiosInstance.get(ENDPOINTS.NOTIFICATIONS.LIST, { params }),
  markAsRead: (id) => axiosInstance.post(ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),
  markAllAsRead: () => axiosInstance.post(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ),

  // WhatsApp connection
  getWaConfig: () => axiosInstance.get(ENDPOINTS.WHATSAPP.CONFIG),
  saveWaConfig: (data) => axiosInstance.post(ENDPOINTS.WHATSAPP.CONFIG, data),
  connectWhatsApp: () => axiosInstance.post(ENDPOINTS.WHATSAPP.CONNECT),
  disconnectWhatsApp: () => axiosInstance.post(ENDPOINTS.WHATSAPP.DISCONNECT),
  getWebhookInfo: () => axiosInstance.get(ENDPOINTS.WHATSAPP.WEBHOOK_INFO),
  syncTemplates: () => axiosInstance.post(ENDPOINTS.WHATSAPP.TEMPLATES_SYNC),
  listTemplates: (params) => axiosInstance.get(ENDPOINTS.WHATSAPP.TEMPLATES, { params }),
};

export default api;