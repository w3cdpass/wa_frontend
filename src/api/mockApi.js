/**
 * MOCK API LAYER
 * ----------------
 * Simulates the backend described in API_DOCUMENTATION.md so the UI is
 * fully functional before the real backend exists. Data is persisted to
 * localStorage so it survives refreshes during the demo.
 *
 * When the real backend is ready: delete this file's usage in pages and
 * swap in the matching axiosInstance + ENDPOINTS calls — the shapes
 * returned here intentionally match the documented API responses.
 */

import dayjs from 'dayjs';

const LATENCY = 500;
const delay = (ms = LATENCY) => new Promise((res) => setTimeout(res, ms));

const STORE_KEY = 'wa_mock_store_v1';

const seedData = () => ({
  wallet: {
    balance: 12480,
    status: 'active', // active | suspended
    lowCreditThreshold: 1000,
  },
  creditHistory: [
    { id: 'CR-1006', type: 'credit', amount: 5000, method: 'UPI', reference: 'TXN10293', balanceAfter: 12480, date: '2026-08-12T10:20:00Z' },
    { id: 'CR-1005', type: 'debit', amount: 320, method: 'Campaign Usage', reference: 'CMP-2041', balanceAfter: 7480, date: '2026-08-11T14:05:00Z' },
    { id: 'CR-1004', type: 'debit', amount: 540, method: 'Campaign Usage', reference: 'CMP-2038', balanceAfter: 7800, date: '2026-08-10T09:40:00Z' },
    { id: 'CR-1003', type: 'credit', amount: 3000, method: 'Bank Transfer', reference: 'TXN10122', balanceAfter: 8340, date: '2026-08-08T11:00:00Z' },
    { id: 'CR-1002', type: 'debit', amount: 210, method: 'Campaign Usage', reference: 'CMP-2031', balanceAfter: 5340, date: '2026-08-06T16:22:00Z' },
    { id: 'CR-1001', type: 'credit', amount: 5000, method: 'UPI', reference: 'TXN9981', balanceAfter: 5550, date: '2026-08-01T08:00:00Z' },
  ],
  campaigns: [
    { id: 'CMP-2041', name: 'Diwali Offer Blast', message: 'Get 20% off this Diwali! Shop now before stock runs out.', mediaType: 'image', mediaName: 'diwali-banner.jpg', status: 'completed', type: 'instant', totalContacts: 640, sent: 618, failed: 22, pending: 0, createdAt: '2026-08-11T14:05:00Z', completedAt: '2026-08-11T15:40:00Z', scheduledAt: null },
    { id: 'CMP-2040', name: 'Weekend Flash Sale', message: 'Flash sale is live! 30% off sitewide, today only.', mediaType: 'none', mediaName: null, status: 'processing', type: 'instant', totalContacts: 1200, sent: 740, failed: 12, pending: 448, createdAt: '2026-08-14T10:02:00Z', completedAt: null, scheduledAt: null },
    { id: 'CMP-2039', name: 'New Collection Launch', message: 'Our new winter collection just dropped. Take a look!', mediaType: 'video', mediaName: 'collection-teaser.mp4', status: 'scheduled', type: 'scheduled', totalContacts: 890, sent: 0, failed: 0, pending: 890, createdAt: '2026-08-13T09:15:00Z', completedAt: null, scheduledAt: '2026-08-16T10:00:00Z' },
    { id: 'CMP-2038', name: 'Payment Reminder', message: 'Reminder: your invoice is due in 2 days.', mediaType: 'pdf', mediaName: 'invoice-notice.pdf', status: 'completed', type: 'instant', totalContacts: 540, sent: 540, failed: 0, pending: 0, createdAt: '2026-08-10T09:40:00Z', completedAt: '2026-08-10T10:55:00Z', scheduledAt: null },
    { id: 'CMP-2037', name: 'Feedback Request', message: 'How was your recent purchase? Share your feedback.', mediaType: 'none', mediaName: null, status: 'failed', type: 'instant', totalContacts: 300, sent: 40, failed: 260, pending: 0, createdAt: '2026-08-09T12:00:00Z', completedAt: '2026-08-09T12:30:00Z', scheduledAt: null },
    { id: 'CMP-2036', name: 'Draft — Republic Day Promo', message: 'Celebrate with us — special discount inside.', mediaType: 'image', mediaName: 'rd-promo.jpg', status: 'draft', type: 'draft', totalContacts: 0, sent: 0, failed: 0, pending: 0, createdAt: '2026-08-07T08:00:00Z', completedAt: null, scheduledAt: null },
    { id: 'CMP-2035', name: 'Loyalty Program Update', message: 'Your loyalty points are about to expire. Redeem now!', mediaType: 'none', mediaName: null, status: 'scheduled', type: 'scheduled', totalContacts: 420, sent: 0, failed: 0, pending: 420, createdAt: '2026-08-06T16:22:00Z', completedAt: null, scheduledAt: '2026-08-17T11:30:00Z' },
    { id: 'CMP-2031', name: 'Monsoon Sale', message: 'Monsoon sale is here — up to 40% off.', mediaType: 'image', mediaName: 'monsoon.jpg', status: 'completed', type: 'instant', totalContacts: 700, sent: 690, failed: 10, pending: 0, createdAt: '2026-08-01T08:00:00Z', completedAt: '2026-08-01T09:20:00Z', scheduledAt: null },
  ],
  contacts: [
    { id: 'U-501', name: 'Rohit Sharma', phone: '+91 98765 43210', group: 'VIP Customers', source: 'manual', status: 'valid', addedOn: '2026-08-10T10:00:00Z' },
    { id: 'U-502', name: 'Priya Verma', phone: '+91 98123 45678', group: 'Newsletter', source: 'csv', status: 'valid', addedOn: '2026-08-10T10:00:00Z' },
    { id: 'U-503', name: 'Amit Kumar', phone: '+91 99887 76655', group: 'VIP Customers', source: 'csv', status: 'valid', addedOn: '2026-08-09T09:12:00Z' },
    { id: 'U-504', name: 'Sneha Kapoor', phone: '+91 97654 32109', group: 'Newsletter', source: 'excel', status: 'valid', addedOn: '2026-08-08T13:45:00Z' },
    { id: 'U-505', name: 'Vikram Singh', phone: '+91 90000 11122', group: 'Leads', source: 'manual', status: 'invalid', addedOn: '2026-08-07T15:30:00Z' },
    { id: 'U-506', name: 'Neha Joshi', phone: '+91 98111 22334', group: 'Leads', source: 'csv', status: 'valid', addedOn: '2026-08-06T11:20:00Z' },
    { id: 'U-507', name: 'Karan Mehta', phone: '+91 97222 33445', group: 'VIP Customers', source: 'excel', status: 'duplicate', addedOn: '2026-08-05T09:00:00Z' },
  ],
  groups: [
    { id: 'G-1', name: 'VIP Customers', count: 3 },
    { id: 'G-2', name: 'Newsletter', count: 2 },
    { id: 'G-3', name: 'Leads', count: 2 },
  ],
});

const readStore = () => {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      const seeded = seedData();
      localStorage.setItem(STORE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return JSON.parse(raw);
  } catch {
    return seedData();
  }
};

const writeStore = (store) => localStorage.setItem(STORE_KEY, JSON.stringify(store));

const genId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

// ---------------- DASHBOARD ----------------
export const getDashboardSummary = async () => {
  await delay();
  const store = readStore();
  const c = store.campaigns;
  return {
    totalCampaigns: c.length,
    activeCampaigns: c.filter((x) => x.status === 'processing').length,
    completedCampaigns: c.filter((x) => x.status === 'completed').length,
    scheduledCampaigns: c.filter((x) => x.status === 'scheduled').length,
    failedCampaigns: c.filter((x) => x.status === 'failed').length,
    totalContacts: store.contacts.length,
    availableCredits: store.wallet.balance,
    consumedCredits: store.creditHistory.filter((h) => h.type === 'debit').reduce((s, h) => s + h.amount, 0),
    walletStatus: store.wallet.status,
    messagesSentToday: 740,
    successRate: 96.4,
  };
};

export const getPerformanceChart = async () => {
  await delay(350);
  return [
    { day: 'Mon', sent: 420, failed: 12 },
    { day: 'Tue', sent: 610, failed: 20 },
    { day: 'Wed', sent: 380, failed: 8 },
    { day: 'Thu', sent: 720, failed: 30 },
    { day: 'Fri', sent: 540, failed: 14 },
    { day: 'Sat', sent: 210, failed: 4 },
    { day: 'Sun', sent: 160, failed: 2 },
  ];
};

export const getRecentActivity = async () => {
  await delay(300);
  const store = readStore();
  return store.campaigns
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);
};

// ---------------- CAMPAIGNS / SEND VIA WA ----------------
export const listCampaigns = async ({ status, search } = {}) => {
  await delay();
  const store = readStore();
  let rows = store.campaigns;
  if (status) rows = rows.filter((r) => r.status === status);
  if (search) rows = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
  return rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const createCampaign = async (payload) => {
  await delay(900);
  const store = readStore();

  const cost = (payload.totalContacts || 0) * 0.5; // demo pricing: 0.5 credit / contact
  if (store.wallet.status === 'suspended') {
    const err = { message: 'Your credit wallet is suspended. Contact support.', code: 'CREDIT_SUSPENDED' };
    throw err;
  }
  if (cost > store.wallet.balance) {
    throw { message: 'Insufficient credits to run this campaign.', code: 'INSUFFICIENT_CREDITS' };
  }

  const isScheduled = !!payload.scheduledAt;
  const campaign = {
    id: genId('CMP'),
    name: payload.name,
    message: payload.message,
    mediaType: payload.mediaType || 'none',
    mediaName: payload.mediaName || null,
    status: payload.saveAsDraft ? 'draft' : isScheduled ? 'scheduled' : 'processing',
    type: payload.saveAsDraft ? 'draft' : isScheduled ? 'scheduled' : 'instant',
    totalContacts: payload.totalContacts || 0,
    sent: 0,
    failed: 0,
    pending: payload.totalContacts || 0,
    createdAt: new Date().toISOString(),
    completedAt: null,
    scheduledAt: payload.scheduledAt || null,
  };
  store.campaigns.unshift(campaign);

  if (!payload.saveAsDraft && !isScheduled) {
    store.wallet.balance = Math.max(0, store.wallet.balance - cost);
    store.creditHistory.unshift({
      id: genId('CR'),
      type: 'debit',
      amount: cost,
      method: 'Campaign Usage',
      reference: campaign.id,
      balanceAfter: store.wallet.balance,
      date: new Date().toISOString(),
    });
  }

  writeStore(store);
  return campaign;
};

export const updateCampaignStatus = async (id, status) => {
  await delay(400);
  const store = readStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  if (campaign) {
    campaign.status = status;
    if (status === 'completed') campaign.completedAt = new Date().toISOString();
  }
  writeStore(store);
  return campaign;
};

export const runScheduledNow = async (id) => {
  await delay(400);
  const store = readStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  if (campaign) {
    campaign.status = 'processing';
    campaign.type = 'instant';
    campaign.scheduledAt = null;
  }
  writeStore(store);
  return campaign;
};

export const setCampaignSchedule = async (id, scheduledAt) => {
  await delay(400);
  const store = readStore();
  const campaign = store.campaigns.find((c) => c.id === id);
  if (campaign) {
    campaign.status = 'scheduled';
    campaign.type = 'scheduled';
    campaign.scheduledAt = scheduledAt;
  }
  writeStore(store);
  return campaign;
};

// ---------------- CONTACTS / MANAGE USERS ----------------
export const listContacts = async ({ search, group } = {}) => {
  await delay();
  const store = readStore();
  let rows = store.contacts;
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(s) || r.phone.includes(s));
  }
  if (group) rows = rows.filter((r) => r.group === group);
  return rows.sort((a, b) => new Date(b.addedOn) - new Date(a.addedOn));
};

export const listGroups = async () => {
  await delay(250);
  const store = readStore();
  return store.groups;
};

export const addContact = async (payload) => {
  await delay(400);
  const store = readStore();
  const contact = {
    id: genId('U'),
    name: payload.name,
    phone: payload.phone,
    group: payload.group || 'Uncategorized',
    source: 'manual',
    status: 'valid',
    addedOn: new Date().toISOString(),
  };
  store.contacts.unshift(contact);
  writeStore(store);
  return contact;
};

export const bulkImportContacts = async (rows, source) => {
  await delay(1100);
  const store = readStore();
  const seenPhones = new Set(store.contacts.map((c) => c.phone.replace(/\s/g, '')));
  const imported = [];
  let duplicates = 0;
  let invalid = 0;

  rows.forEach((row) => {
    const phone = String(row.phone || row.Phone || row.mobile || row.Mobile || '').trim();
    const name = String(row.name || row.Name || 'Unknown').trim();
    const normalized = phone.replace(/\s/g, '');
    if (!phone || phone.length < 7) {
      invalid += 1;
      return;
    }
    if (seenPhones.has(normalized)) {
      duplicates += 1;
      return;
    }
    seenPhones.add(normalized);
    const contact = {
      id: genId('U'),
      name,
      phone,
      group: 'Imported',
      source,
      status: 'valid',
      addedOn: new Date().toISOString(),
    };
    imported.push(contact);
  });

  store.contacts.unshift(...imported);
  writeStore(store);

  return {
    totalRows: rows.length,
    imported: imported.length,
    duplicates,
    invalid,
  };
};

export const deleteContact = async (id) => {
  await delay(300);
  const store = readStore();
  store.contacts = store.contacts.filter((c) => c.id !== id);
  writeStore(store);
  return { success: true };
};

// ---------------- CREDITS ----------------
export const getWallet = async () => {
  await delay(300);
  const store = readStore();
  return store.wallet;
};

export const getCreditHistory = async () => {
  await delay();
  const store = readStore();
  return store.creditHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const addCredit = async ({ amount, method, reference }) => {
  await delay(700);
  const store = readStore();
  store.wallet.balance += Number(amount);
  const entry = {
    id: genId('CR'),
    type: 'credit',
    amount: Number(amount),
    method,
    reference: reference || genId('TXN'),
    balanceAfter: store.wallet.balance,
    date: new Date().toISOString(),
  };
  store.creditHistory.unshift(entry);
  writeStore(store);
  return entry;
};

export default {
  getDashboardSummary,
  getPerformanceChart,
  getRecentActivity,
  listCampaigns,
  createCampaign,
  updateCampaignStatus,
  runScheduledNow,
  setCampaignSchedule,
  listContacts,
  listGroups,
  addContact,
  bulkImportContacts,
  deleteContact,
  getWallet,
  getCreditHistory,
  addCredit,
};
