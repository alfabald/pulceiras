const STORAGE_KEY = "gabuHamburgParticipantsV1";
const PRICING_KEY = "gabuPricingV1";
const API_REGISTER = "api/register.php";
const API_PARTICIPANTS = "api/participants.php";
const API_CHECKIN = "api/checkin.php";
const API_CONFIRM_PAYMENT = "api/confirm-payment.php";
const API_PASS = "api/pass.php";
const API_DELETE = "api/delete.php";
const API_LOGIN = "api/login.php";
const API_LOGOUT = "api/logout.php";
const API_SESSION = "api/session.php";
const API_EVENT_CONFIG = "api/event-config.php";
const API_ORGANIZERS = "api/organizers.php";
const API_ORGANIZER_ACTIVITY = "api/organizer-activity.php";
const API_CHANGE_PIN = "api/change-pin.php";
const LOCAL_ADMIN_PIN = "gabu2026";
const CHECKIN_QUEUE_KEY = "gabuCheckinQueueV1";
const SCAN_COOLDOWN_MS = 2000;

const state = {
  participants: [],
  currentPass: null,
  currentCheckin: null,
  isAdmin: false,
  role: "none",
  permissions: [],
  allowedActivities: [],
  organizerUsername: "",
  isOwner: false,
  organizers: [],
  ownActivityProfile: {
    title: "",
    description: "",
    date: "",
    location: "",
    startTime: "",
    endTime: "",
    flyerUrl: "",
    flyerImage: "",
  },
  organizerInvite: null,
  requiresPinChange: false,
  passPollingTimer: null,
  scannerStream: null,
  scannerAnimFrame: null,
  scanLockMap: {},
  checkinSyncBusy: false,
  pricing: { adultPrice: 10, childPrice: 5 },
  eventConfig: {
    eventName: "Passe de Atividades Solidárias",
    eventDate: "",
    eventLocation: "",
    adultPrice: 10,
    childPrice: 5,
    activityCatalog: [],
    teams: [],
  },
  audit: [],
};

const elements = {
  tabs: document.querySelectorAll(".tab"),
  adminOnlyTabs: document.querySelectorAll("[data-admin-only]"),
  organizerTabs: document.querySelectorAll("[data-organizer-tab]"),
  registerWorkGrid: document.querySelector("#register .work-grid"),
  brandTitle: document.querySelector(".brand h1"),
  views: document.querySelectorAll(".view"),
  form: document.querySelector("#signupForm"),
  formStatus: document.querySelector("#formStatus"),
  emptyPass: document.querySelector("#emptyPass"),
  passCard: document.querySelector("#passCard"),
  passSeal: document.querySelector("#passSeal"),
  passStatus: document.querySelector("#passStatus"),
  passName: document.querySelector("#passName"),
  passCode: document.querySelector("#passCode"),
  passContribution: document.querySelector("#passContribution"),
  passActivity: document.querySelector("#passActivity"),
  passMeta: document.querySelector("#passMeta"),
  copyPass: document.querySelector("#copyPass"),
  sharePass: document.querySelector("#sharePass"),
  printPass: document.querySelector("#printPass"),
  confirmedCount: document.querySelector("#confirmedCount"),
  confirmedPassesList: document.querySelector("#confirmedPassesList"),
  confirmedEmpty: document.querySelector("#confirmedEmpty"),
  startScannerBtn: document.querySelector("#startScannerBtn"),
  stopScannerBtn: document.querySelector("#stopScannerBtn"),
  scannerVideo: document.querySelector("#scannerVideo"),
  scannerCanvas: document.querySelector("#scannerCanvas"),
  scannerStatus: document.querySelector("#scannerStatus"),
  adultPriceInput: document.querySelector("#adultPriceInput"),
  childPriceInput: document.querySelector("#childPriceInput"),
  savePricingBtn: document.querySelector("#savePricingBtn"),
  eventNameInput: document.querySelector("#eventNameInput"),
  eventDateInput: document.querySelector("#eventDateInput"),
  eventLocationInput: document.querySelector("#eventLocationInput"),
  activityCatalogInput: document.querySelector("#activityCatalogInput"),
  teamsInput: document.querySelector("#teamsInput"),
  saveEventConfigBtn: document.querySelector("#saveEventConfigBtn"),
  contributionHint: document.querySelector("#contributionHint"),
  activityProfileForm: document.querySelector("#activityProfileForm"),
  activityTitleInput: document.querySelector("#activityTitleInput"),
  activityDescriptionInput: document.querySelector("#activityDescriptionInput"),
  activityDateInput: document.querySelector("#activityDateInput"),
  activityLocationInput: document.querySelector("#activityLocationInput"),
  activityStartTimeInput: document.querySelector("#activityStartTimeInput"),
  activityEndTimeInput: document.querySelector("#activityEndTimeInput"),
  activityFlyerUrlInput: document.querySelector("#activityFlyerUrlInput"),
  activityFlyerImageInput: document.querySelector("#activityFlyerImageInput"),
  activityProfileStatus: document.querySelector("#activityProfileStatus"),
  participantsBody: document.querySelector("#participantsBody"),
  emptyTable: document.querySelector("#emptyTable"),
  participantSearch: document.querySelector("#participantSearch"),
  participantsVisibleCount: document.querySelector("#participantsVisibleCount"),
  participantsPendingCount: document.querySelector("#participantsPendingCount"),
  participantsConfirmedCount: document.querySelector("#participantsConfirmedCount"),
  exportCsv: document.querySelector("#exportCsv"),
  exportAdvancedCsv: document.querySelector("#exportAdvancedCsv"),
  clearLocal: document.querySelector("#clearLocal"),
  checkinForm: document.querySelector("#checkinForm"),
  checkinQuery: document.querySelector("#checkinQuery"),
  checkinActivityFilter: document.querySelector("#checkinActivityFilter"),
  checkinStatus: document.querySelector("#checkinStatus"),
  checkinResult: document.querySelector("#checkinResult"),
  checkinEmptyResult: document.querySelector("#checkinEmptyResult"),
  checkinMatches: document.querySelector("#checkinMatches"),
  checkinMatchList: document.querySelector("#checkinMatchList"),
  checkinBadge: document.querySelector("#checkinBadge"),
  checkinName: document.querySelector("#checkinName"),
  checkinCode: document.querySelector("#checkinCode"),
  checkinGuests: document.querySelector("#checkinGuests"),
  checkinContribution: document.querySelector("#checkinContribution"),
  checkinPaymentStatus: document.querySelector("#checkinPaymentStatus"),
  checkinContact: document.querySelector("#checkinContact"),
  checkinTime: document.querySelector("#checkinTime"),
  checkinPresentCount: document.querySelector("#checkinPresentCount"),
  checkinNoShowCount: document.querySelector("#checkinNoShowCount"),
  checkinLastHourCount: document.querySelector("#checkinLastHourCount"),
  checkinRate: document.querySelector("#checkinRate"),
  confirmCheckin: document.querySelector("#confirmCheckin"),
  undoCheckin: document.querySelector("#undoCheckin"),
  openCheckinPass: document.querySelector("#openCheckinPass"),
  auditList: document.querySelector("#auditList"),
  auditActionFilter: document.querySelector("#auditActionFilter"),
  auditUserFilter: document.querySelector("#auditUserFilter"),
  auditDateFrom: document.querySelector("#auditDateFrom"),
  auditDateTo: document.querySelector("#auditDateTo"),
  clearAuditFilters: document.querySelector("#clearAuditFilters"),
  organizersSection: document.querySelector("#organizersSection"),
  organizerForm: document.querySelector("#organizerForm"),
  organizerName: document.querySelector("#organizerName"),
  organizerUsername: document.querySelector("#organizerUsername"),
  organizerEmail: document.querySelector("#organizerEmail"),
  organizerPhone: document.querySelector("#organizerPhone"),
  organizerRole: document.querySelector("#organizerRole"),
  organizerPin: document.querySelector("#organizerPin"),
  organizerActivities: document.querySelector("#organizerActivities"),
  organizerStatus: document.querySelector("#organizerStatus"),
  organizerInviteBox: document.querySelector("#organizerInviteBox"),
  organizerInviteLink: document.querySelector("#organizerInviteLink"),
  organizerInviteMessage: document.querySelector("#organizerInviteMessage"),
  copyInviteMessage: document.querySelector("#copyInviteMessage"),
  sendInviteWhatsapp: document.querySelector("#sendInviteWhatsapp"),
  sendInviteEmail: document.querySelector("#sendInviteEmail"),
  organizersList: document.querySelector("#organizersList"),
  organizersMonitorCount: document.querySelector("#organizersMonitorCount"),
  organizersActiveCount: document.querySelector("#organizersActiveCount"),
  organizersPendingTotal: document.querySelector("#organizersPendingTotal"),
  organizersConfirmedTotal: document.querySelector("#organizersConfirmedTotal"),
  organizersMonitorList: document.querySelector("#organizersMonitorList"),
  adminStatusLabel: document.querySelector("#adminStatusLabel"),
  adminScopeLabel: document.querySelector("#adminScopeLabel"),
  adminLoginButton: document.querySelector("#adminLoginButton"),
  adminLogoutButton: document.querySelector("#adminLogoutButton"),
  adminDialog: document.querySelector("#adminDialog"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
  adminUser: document.querySelector("#adminUser"),
  adminPin: document.querySelector("#adminPin"),
  adminCancelButton: document.querySelector("#adminCancelButton"),
  adminLoginStatus: document.querySelector("#adminLoginStatus"),
  metricRegistrations: document.querySelector("#metricRegistrations"),
  metricGuests: document.querySelector("#metricGuests"),
  metricCheckedIn: document.querySelector("#metricCheckedIn"),
  metricPledged: document.querySelector("#metricPledged"),
  metricReceived: document.querySelector("#metricReceived"),
  transparencyRegistrations: document.querySelector("#transparencyRegistrations"),
  transparencyGuests: document.querySelector("#transparencyGuests"),
  transparencyPledged: document.querySelector("#transparencyPledged"),
  transparencyReceived: document.querySelector("#transparencyReceived"),
  transparencyCities: document.querySelector("#transparencyCities"),
  transparencyPayment: document.querySelector("#transparencyPayment"),
};

const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("pt-PT", {
  dateStyle: "short",
  timeStyle: "short",
});

let scanAudioContext = null;

function ensureScanAudioContext() {
  if (scanAudioContext) {
    return scanAudioContext;
  }

  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) {
    return null;
  }

  scanAudioContext = new Ctx();
  return scanAudioContext;
}

function playTone(frequency, durationMs, options = {}) {
  const ctx = ensureScanAudioContext();
  if (!ctx) {
    return;
  }

  const {
    type = "sine",
    gainValue = 0.04,
    delayMs = 0,
  } = options;

  const startAt = ctx.currentTime + (delayMs / 1000);
  const stopAt = startAt + (durationMs / 1000);

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.linearRampToValueAtTime(gainValue, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(stopAt + 0.01);
}

function playScanFeedback(type) {
  const ctx = ensureScanAudioContext();
  if (!ctx) {
    return;
  }

  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  if (type === "success") {
    playTone(880, 90, { type: "triangle", gainValue: 0.05 });
    playTone(1175, 110, { type: "triangle", gainValue: 0.05, delayMs: 100 });
    return;
  }

  if (type === "warning") {
    playTone(420, 140, { type: "sawtooth", gainValue: 0.04 });
    return;
  }

  if (type === "info") {
    playTone(640, 100, { type: "sine", gainValue: 0.035 });
    return;
  }

  playTone(230, 180, { type: "square", gainValue: 0.05 });
}

function safeTrim(value) {
  return String(value || "").trim();
}

function isFileMode() {
  return window.location.protocol === "file:";
}

function hasPermission(permission) {
  return state.isAdmin && Array.isArray(state.permissions) && state.permissions.includes(permission);
}

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => safeTrim(item))
    .filter(Boolean);
}

function appBaseUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function organizerAccessUrl(username) {
  const url = new URL(appBaseUrl());
  url.searchParams.set("org", safeTrim(username));
  return url.toString();
}

function organizerInviteMessageText(payload) {
  const name = safeTrim(payload?.name || payload?.username || "Organizador");
  const username = safeTrim(payload?.username || "");
  const pin = safeTrim(payload?.pin || "");
  const link = safeTrim(payload?.link || organizerAccessUrl(username));
  const lines = [
    `Olá ${name},`,
    "Seu acesso de organizador foi criado.",
    `Link: ${link}`,
    `Utilizador: ${username}`,
  ];

  if (pin) {
    lines.push(`Senha inicial: ${pin}`);
  }

  lines.push("No primeiro acesso, altere a senha.");
  return lines.join("\n");
}

function openInviteEmail(payload) {
  const subject = encodeURIComponent("Acesso de organizador");
  const body = encodeURIComponent(organizerInviteMessageText(payload));
  const recipient = safeTrim(payload?.email || "");
  const to = recipient ? encodeURIComponent(recipient) : "";
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

function openInviteWhatsapp(payload) {
  const message = organizerInviteMessageText(payload);
  const phone = safeTrim(payload?.phone || "");
  if (phone) {
    const phoneEncoded = encodeURIComponent(phone.replace(/[^\d+]/g, ""));
    window.open(`https://wa.me/${phoneEncoded}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  } else {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  }
}

function renderOrganizerInvite() {
  if (!elements.organizerInviteBox || !elements.organizerInviteLink || !elements.organizerInviteMessage) {
    return;
  }

  if (!state.organizerInvite) {
    elements.organizerInviteBox.hidden = true;
    elements.organizerInviteLink.value = "";
    elements.organizerInviteMessage.value = "";
    return;
  }

  elements.organizerInviteBox.hidden = false;
  elements.organizerInviteLink.value = state.organizerInvite.link;
  elements.organizerInviteMessage.value = organizerInviteMessageText(state.organizerInvite);
}

function applyOrganizerPrefillFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const organizer = safeTrim(params.get("org"));
  if (!organizer || !elements.adminUser) {
    return;
  }

  elements.adminUser.value = organizer;
}

function isStrongPin(pin) {
  const text = safeTrim(pin);
  return text.length >= 6 && /[a-z]/i.test(text) && /\d/.test(text);
}

function getCheckinQueue() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CHECKIN_QUEUE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setCheckinQueue(items) {
  localStorage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(items));
}

function queueOfflineCheckin(code, checkedInAt) {
  const queue = getCheckinQueue();
  const rest = queue.filter((item) => item.code !== code);
  rest.push({ code, checkedInAt, queuedAt: new Date().toISOString() });
  setCheckinQueue(rest);
}

async function syncCheckinQueue() {
  if (state.checkinSyncBusy || !navigator.onLine || isFileMode() || !hasPermission("confirmEntry")) {
    return;
  }

  const queue = getCheckinQueue();
  if (queue.length === 0) {
    return;
  }

  state.checkinSyncBusy = true;
  const remaining = [];

  for (const item of queue) {
    try {
      const participant = state.participants.find((p) => p.code === item.code) || { code: item.code };
      const updated = await saveCheckin(participant, item.checkedInAt, { allowOfflineQueue: false });
      if (updated) {
        updateParticipant(updated);
      }
    } catch {
      remaining.push(item);
    }
  }

  setCheckinQueue(remaining);
  state.checkinSyncBusy = false;
  renderAll();
}

function isScanLocked(code) {
  const now = Date.now();
  const nextAllowedAt = state.scanLockMap[code] || 0;
  if (nextAllowedAt > now) {
    return true;
  }

  state.scanLockMap[code] = now + SCAN_COOLDOWN_MS;
  return false;
}

async function loadEventConfig() {
  if (isFileMode()) {
    try {
      const raw = JSON.parse(localStorage.getItem("gabuEventConfigV1") || "{}");
      state.eventConfig = { ...state.eventConfig, ...raw };
      state.pricing.adultPrice = Number(state.eventConfig.adultPrice || state.pricing.adultPrice);
      state.pricing.childPrice = Number(state.eventConfig.childPrice || state.pricing.childPrice);
      updateContributionHint();
      renderEventConfigInputs();
      renderCheckinActivityFilter();
    } catch {}
    return;
  }

  try {
    const response = await fetch(API_EVENT_CONFIG, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    if (data?.config) {
      state.eventConfig = {
        ...state.eventConfig,
        ...data.config,
      };
      state.pricing.adultPrice = Number(state.eventConfig.adultPrice || state.pricing.adultPrice);
      state.pricing.childPrice = Number(state.eventConfig.childPrice || state.pricing.childPrice);
      updateContributionHint();
      renderEventConfigInputs();
      renderCheckinActivityFilter();
    }
  } catch {
    // keep local defaults
  }
}

async function saveEventConfig() {
  if (!hasPermission("manageSettings") && !isFileMode()) {
    return;
  }

  const payload = {
    eventName: safeTrim(elements.eventNameInput?.value),
    eventDate: safeTrim(elements.eventDateInput?.value),
    eventLocation: safeTrim(elements.eventLocationInput?.value),
    adultPrice: Number.parseFloat(elements.adultPriceInput?.value || "0") || 0,
    childPrice: Number.parseFloat(elements.childPriceInput?.value || "0") || 0,
    activityCatalog: parseCommaList(elements.activityCatalogInput?.value),
    teams: parseCommaList(elements.teamsInput?.value),
  };

  if (isFileMode()) {
    state.eventConfig = { ...state.eventConfig, ...payload, updatedAt: new Date().toISOString() };
    localStorage.setItem("gabuEventConfigV1", JSON.stringify(state.eventConfig));
    state.pricing.adultPrice = Number(state.eventConfig.adultPrice || state.pricing.adultPrice);
    state.pricing.childPrice = Number(state.eventConfig.childPrice || state.pricing.childPrice);
    savePricing();
    updateContributionHint();
    renderEventConfigInputs();
    renderCheckinActivityFilter();
    return;
  }

  const response = await fetch(API_EVENT_CONFIG, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Não foi possível guardar a configuração do evento.");
  }

  const data = await response.json();
  if (data?.config) {
    state.eventConfig = { ...state.eventConfig, ...data.config };
    state.pricing.adultPrice = Number(state.eventConfig.adultPrice || state.pricing.adultPrice);
    state.pricing.childPrice = Number(state.eventConfig.childPrice || state.pricing.childPrice);
    savePricing();
    updateContributionHint();
    renderEventConfigInputs();
    renderCheckinActivityFilter();
  }
}

function renderEventConfigInputs() {
  if (elements.eventNameInput) elements.eventNameInput.value = state.eventConfig.eventName || "";
  if (elements.eventDateInput) elements.eventDateInput.value = state.eventConfig.eventDate || "";
  if (elements.eventLocationInput) elements.eventLocationInput.value = state.eventConfig.eventLocation || "";
  if (elements.activityCatalogInput) elements.activityCatalogInput.value = (state.eventConfig.activityCatalog || []).join(", ");
  if (elements.teamsInput) elements.teamsInput.value = (state.eventConfig.teams || []).join(", ");
}

function normalizeActivityProfile(profile) {
  return {
    title: safeTrim(profile?.title),
    description: safeTrim(profile?.description),
    date: safeTrim(profile?.date),
    location: safeTrim(profile?.location),
    startTime: safeTrim(profile?.startTime),
    endTime: safeTrim(profile?.endTime),
    flyerUrl: safeTrim(profile?.flyerUrl),
    flyerImage: safeTrim(profile?.flyerImage),
  };
}

function renderOwnActivityProfile() {
  const p = normalizeActivityProfile(state.ownActivityProfile || {});
  if (elements.activityTitleInput) elements.activityTitleInput.value = p.title;
  if (elements.activityDescriptionInput) elements.activityDescriptionInput.value = p.description;
  if (elements.activityDateInput) elements.activityDateInput.value = p.date;
  if (elements.activityLocationInput) elements.activityLocationInput.value = p.location;
  if (elements.activityStartTimeInput) elements.activityStartTimeInput.value = p.startTime;
  if (elements.activityEndTimeInput) elements.activityEndTimeInput.value = p.endTime;
  if (elements.activityFlyerUrlInput) elements.activityFlyerUrlInput.value = p.flyerUrl;
}

function normalizeSearch(value) {
  return safeTrim(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function activityKey(value) {
  return normalizeSearch(value || "");
}

function makeCode() {
  const year = new Date().getFullYear();
  const random = new Uint32Array(1);
  crypto.getRandomValues(random);
  return `GABU-${year}-${random[0].toString(36).toUpperCase().slice(0, 6).padStart(6, "0")}`;
}

function normalizeParticipant(participant) {
  const adultsRaw = Number.parseInt(participant.adults, 10);
  const childrenRaw = Number.parseInt(participant.childrenUnder16, 10);
  const adults = Number.isFinite(adultsRaw) ? Math.max(0, adultsRaw) : Math.max(0, Number.parseInt(participant.guests, 10) || 1);
  const childrenUnder16 = Number.isFinite(childrenRaw) ? Math.max(0, childrenRaw) : 0;
  const guests = Math.max(1, adults + childrenUnder16);
  const autoContribution = adults * state.pricing.adultPrice + childrenUnder16 * state.pricing.childPrice;
  const contribution = Math.max(0, Number.parseFloat(participant.contribution) || 0);
  const contributionValue = contribution > 0 ? contribution : autoContribution;
  const agreedAmount = Math.max(0, Number.parseFloat(participant.agreedAmount ?? contributionValue) || 0);
  const amountConfirmed = Boolean(participant.amountConfirmed);

  return {
    code: safeTrim(participant.code) || makeCode(),
    fullName: safeTrim(participant.fullName),
    phone: safeTrim(participant.phone),
    email: safeTrim(participant.email),
    city: safeTrim(participant.city),
    activityName: safeTrim(participant.activityName) || "Atividade geral",
    adults,
    childrenUnder16,
    guests,
    contribution: contributionValue,
    agreedAmount,
    amountConfirmed,
    amountConfirmedAt: safeTrim(participant.amountConfirmedAt),
    paymentStatus:
      safeTrim(participant.paymentStatus) ||
      (amountConfirmed ? "Confirmado pelo organizador" : "Aguardando confirmação do organizador"),
    paymentProofImage: safeTrim(participant.paymentProofImage),
    paymentProofNote: safeTrim(participant.paymentProofNote),
    note: safeTrim(participant.note),
    checkedInAt: participant.checkedInAt || "",
    createdAt: participant.createdAt || new Date().toISOString(),
  };
}

function participantIsValid(participant) {
  return Boolean(participant?.amountConfirmed);
}

function passStatusText(participant) {
  return participantIsValid(participant) ? "Válido" : "Pendente";
}

function loadPricing() {
  try {
    const saved = JSON.parse(localStorage.getItem(PRICING_KEY) || "{}");
    if (saved.adultPrice > 0) state.pricing.adultPrice = Number(saved.adultPrice);
    if (saved.childPrice >= 0) state.pricing.childPrice = Number(saved.childPrice);
  } catch {}
  updateContributionHint();
}

function savePricing() {
  localStorage.setItem(PRICING_KEY, JSON.stringify(state.pricing));
}

function updateContributionHint() {
  if (elements.contributionHint) {
    elements.contributionHint.textContent = `(${euroFormatter.format(state.pricing.adultPrice)} adulto · ${euroFormatter.format(state.pricing.childPrice)} criança)`;
  }
  if (elements.adultPriceInput) elements.adultPriceInput.value = state.pricing.adultPrice;
  if (elements.childPriceInput) elements.childPriceInput.value = state.pricing.childPrice;
}

function saveLocalParticipants() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.participants));
}

function loadLocalParticipants() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    state.participants = Array.isArray(saved) ? saved.map(normalizeParticipant) : [];
  } catch {
    state.participants = [];
  }
}

function mergeParticipants(participants) {
  const map = new Map(state.participants.map((participant) => [participant.code, participant]));
  participants.map(normalizeParticipant).forEach((participant) => {
    map.set(participant.code, participant);
  });
  state.participants = [...map.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  saveLocalParticipants();
}

async function loadServerParticipants() {
  if (isFileMode() || !state.isAdmin) {
    return;
  }

  try {
    const response = await fetch(API_PARTICIPANTS, { headers: { Accept: "application/json" } });
    if (response.status === 401) {
      setAdminState(false, { clearData: true });
      return;
    }

    if (!response.ok) {
      return;
    }

    const data = await response.json();
    if (Array.isArray(data.participants)) {
      mergeParticipants(data.participants);
      state.audit = Array.isArray(data.audit) ? data.audit : [];
      renderAll();
    }
  } catch {
    // The local-only version remains usable without PHP.
  }
}

async function saveParticipant(participant) {
  if (!isFileMode()) {
    try {
      const payload = {
        ...participant,
      };

      const response = await fetch(API_REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.participant) {
          return normalizeParticipant(data.participant);
        }
      }
    } catch {
      // Fall back to local storage when the PHP API is unavailable.
    }
  }

  return participant;
}

async function saveCheckin(participant, checkedInAt, options = {}) {
  const { allowOfflineQueue = true } = options;
  const updatedParticipant = normalizeParticipant({
    ...participant,
    checkedInAt,
  });

  if (!navigator.onLine && allowOfflineQueue) {
    queueOfflineCheckin(participant.code, checkedInAt);
    return updatedParticipant;
  }

  if (!isFileMode()) {
    try {
      const response = await fetch(API_CHECKIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          code: participant.code,
          checkedInAt,
        }),
      });

      if (response.status === 401) {
        setAdminState(false, { clearData: true });
        throw new Error("Precisas entrar como organizador.");
      }

      if (response.status === 403) {
        throw new Error("O teu perfil não tem permissão para confirmar entrada.");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Não foi possível confirmar a entrada.");
      }

      const data = await response.json();
      if (data.participant) {
        return normalizeParticipant(data.participant);
      }
    } catch {
      if (allowOfflineQueue) {
        queueOfflineCheckin(participant.code, checkedInAt);
        return updatedParticipant;
      }
      throw new Error("Não foi possível confirmar a entrada.");
    }
  }

  return updatedParticipant;
}

async function confirmPayment(participant, agreedAmount, paymentProofImage = "", paymentProofNote = "") {
  const updatedParticipant = normalizeParticipant({
    ...participant,
    agreedAmount,
    contribution: agreedAmount,
    amountConfirmed: true,
    amountConfirmedAt: new Date().toISOString(),
    paymentStatus: "Confirmado pelo organizador",
    paymentProofImage,
    paymentProofNote,
  });

  if (!isFileMode()) {
    const response = await fetch(API_CONFIRM_PAYMENT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        code: participant.code,
        agreedAmount,
        paymentProofImage,
        paymentProofNote,
      }),
    });

    if (response.status === 401) {
      setAdminState(false, { clearData: true });
      throw new Error("Precisas entrar como organizador.");
    }

    if (response.status === 403) {
      throw new Error("O teu perfil não tem permissão para confirmar montante.");
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Não foi possível confirmar o montante.");
    }

    const data = await response.json();
    if (data.participant) {
      return normalizeParticipant(data.participant);
    }
  }

  return updatedParticipant;
}

async function loadPublicPass(code) {
  if (isFileMode()) {
    return null;
  }

  const response = await fetch(`${API_PASS}?code=${encodeURIComponent(code)}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data.participant) {
    return null;
  }

  return normalizeParticipant(data.participant);
}

async function loadPublicPassPayload(code) {
  if (isFileMode()) {
    return null;
  }

  const response = await fetch(`${API_PASS}?code=${encodeURIComponent(code)}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    return null;
  }

  return response.json().catch(() => null);
}

function stopPassWatcher() {
  if (state.passPollingTimer) {
    clearInterval(state.passPollingTimer);
    state.passPollingTimer = null;
  }
}

function startPassWatcher(participant) {
  stopPassWatcher();

  if (!participant || participantIsValid(participant) || isFileMode()) {
    return;
  }

  state.passPollingTimer = setInterval(async () => {
    const fresh = await loadPublicPass(participant.code);
    if (!fresh) {
      return;
    }

    if (!participantIsValid(fresh)) {
      return;
    }

    updateParticipant(fresh);
    renderPass(fresh);
    renderAll();
    stopPassWatcher();

    if (typeof window !== "undefined") {
      window.alert("Passe validado pelo organizador. Já está apto para entrada.");
    }
  }, 15000);
}

function isAdminView(viewId) {
  return viewId === "activity" || viewId === "checkin" || viewId === "participants" || viewId === "organizers" || viewId === "transparency";
}

function activeViewId() {
  const activeView = [...elements.views].find((view) => view.classList.contains("is-active"));
  return activeView ? activeView.id : "register";
}

function canOpenView(viewId) {
  if (!isAdminView(viewId)) {
    return true;
  }

  if (!state.isAdmin) {
    return false;
  }

  if (viewId === "checkin") {
    return hasPermission("confirmEntry");
  }
  if (viewId === "activity") {
    return hasPermission("viewParticipants") || hasPermission("manageSettings");
  }
  if (viewId === "participants") {
    return hasPermission("viewParticipants");
  }
  if (viewId === "organizers") {
    return hasPermission("manageSettings");
  }
  if (viewId === "transparency") {
    return hasPermission("viewParticipants") || hasPermission("manageSettings");
  }

  return true;
}

function setAdminState(isAdmin, options = {}) {
  state.isAdmin = isAdmin;
  state.role = isAdmin ? (options.role || state.role || "admin") : "none";
  state.permissions = isAdmin ? (options.permissions || state.permissions || []) : [];
  state.allowedActivities = isAdmin
    ? (Array.isArray(options.allowedActivities) ? options.allowedActivities : state.allowedActivities)
    : [];
  state.organizerUsername = isAdmin ? safeTrim(options.organizerUsername || state.organizerUsername) : "";
  state.isOwner = isAdmin ? Boolean(options.isOwner) : false;
  state.requiresPinChange = isAdmin ? Boolean(options.requiresPinChange) : false;

  const canEntry = hasPermission("confirmEntry");
  const canViewParticipants = hasPermission("viewParticipants");
  const canViewTransparency = hasPermission("viewParticipants") || hasPermission("manageSettings");

  elements.adminOnlyTabs.forEach((tab) => {
    const view = tab.dataset.view;
    if (!isAdmin) {
      tab.hidden = true;
      return;
    }

    if (view === "checkin") {
      tab.hidden = !canEntry;
      return;
    }

    if (view === "activity") {
      tab.hidden = !(hasPermission("viewParticipants") || hasPermission("manageSettings"));
      return;
    }

    if (view === "participants") {
      tab.hidden = !canViewParticipants;
      return;
    }

    if (view === "organizers") {
      tab.hidden = !hasPermission("manageSettings");
      return;
    }

    if (view === "transparency") {
      tab.hidden = !canViewTransparency;
      return;
    }

    tab.hidden = false;
  });
  elements.organizerTabs.forEach((tab) => {
    tab.hidden = !isAdmin;
  });
  if (elements.registerWorkGrid) {
    elements.registerWorkGrid.classList.toggle("is-single", !isAdmin);
  }
  const statusLabel = state.isOwner ? "Admin Principal" : "Organizador";
  elements.adminStatusLabel.textContent = isAdmin
    ? `${statusLabel} (${state.role}${state.organizerUsername ? ` · ${state.organizerUsername}` : ""})`
    : "Público";
  elements.adminStatusLabel.classList.toggle("is-active", isAdmin);

  if (elements.adminScopeLabel) {
    if (!isAdmin) {
      elements.adminScopeLabel.hidden = true;
      elements.adminScopeLabel.textContent = "";
    } else if (Array.isArray(state.allowedActivities) && state.allowedActivities.length > 0) {
      const list = state.allowedActivities.slice(0, 4).join(", ");
      const suffix = state.allowedActivities.length > 4 ? ` +${state.allowedActivities.length - 4}` : "";
      elements.adminScopeLabel.hidden = false;
      elements.adminScopeLabel.textContent = `Escopo: ${list}${suffix}`;
    } else {
      elements.adminScopeLabel.hidden = false;
      elements.adminScopeLabel.textContent = "Escopo: todas as atividades";
    }
  }

  elements.adminLoginButton.hidden = isAdmin;
  elements.adminLogoutButton.hidden = !isAdmin;

  if (!canOpenView(activeViewId())) {
    showView("register");
  }

  if (!isAdmin && options.clearData) {
    state.participants = [];
    state.audit = [];
    state.organizers = [];
    state.ownActivityProfile = normalizeActivityProfile({});
    state.currentCheckin = null;
    localStorage.removeItem(STORAGE_KEY);
    elements.checkinResult.hidden = true;
    elements.checkinEmptyResult.hidden = false;
    elements.checkinMatches.hidden = true;
    renderAll();
  }
}

function normalizeOrganizer(organizer) {
  return {
    id: safeTrim(organizer?.id),
    name: safeTrim(organizer?.name),
    username: safeTrim(organizer?.username),
    email: safeTrim(organizer?.email),
    phone: safeTrim(organizer?.phone),
    role: safeTrim(organizer?.role) || "viewer",
    allowedActivities: Array.isArray(organizer?.allowedActivities)
      ? organizer.allowedActivities.map((x) => safeTrim(x)).filter(Boolean)
      : [],
    activityProfile: normalizeActivityProfile(organizer?.activityProfile || {}),
    active: Boolean(organizer?.active),
    mustChangePassword: Boolean(organizer?.mustChangePassword),
  };
}

async function changeOwnPin(currentPin, newPin) {
  const response = await fetch(API_CHANGE_PIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ currentPin, newPin }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Não foi possível trocar a senha.");
  }

  return response.json().catch(() => ({}));
}

async function runRequiredPinChange(currentPin) {
  const newPin = safeTrim(window.prompt("Nova senha obrigatória (mínimo 6, com letra e número):") || "");
  if (!newPin) {
    throw new Error("A troca de senha é obrigatória para continuar.");
  }
  if (!isStrongPin(newPin)) {
    throw new Error("Senha fraca. Use pelo menos 6 caracteres com letras e números.");
  }

  const confirmPin = safeTrim(window.prompt("Repete a nova senha:") || "");
  if (newPin !== confirmPin) {
    throw new Error("As senhas não coincidem.");
  }

  await changeOwnPin(currentPin, newPin);
  state.requiresPinChange = false;
}

async function loadOrganizers() {
  if (isFileMode() || !hasPermission("manageSettings")) {
    state.organizers = [];
    renderOrganizers();
    renderOrganizersMonitor();
    return;
  }

  try {
    const response = await fetch(API_ORGANIZERS, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      state.organizers = [];
      renderOrganizers();
      renderOrganizersMonitor();
      return;
    }

    const data = await response.json();
    state.organizers = Array.isArray(data.organizers)
      ? data.organizers.map(normalizeOrganizer)
      : [];
    renderOrganizers();
    renderOrganizersMonitor();
  } catch {
    state.organizers = [];
    renderOrganizers();
    renderOrganizersMonitor();
  }
}

async function loadOwnActivityProfile() {
  if (isFileMode() || !state.isAdmin) {
    state.ownActivityProfile = normalizeActivityProfile({});
    renderOwnActivityProfile();
    return;
  }

  try {
    const response = await fetch(API_ORGANIZER_ACTIVITY, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      renderOwnActivityProfile();
      return;
    }

    const data = await response.json();
    state.ownActivityProfile = normalizeActivityProfile(data.activityProfile || {});
    renderOwnActivityProfile();
  } catch {
    renderOwnActivityProfile();
  }
}

async function saveOwnActivityProfile(profile) {
  if (isFileMode()) {
    state.ownActivityProfile = normalizeActivityProfile(profile);
    renderOwnActivityProfile();
    return;
  }

  const response = await fetch(API_ORGANIZER_ACTIVITY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ activityProfile: normalizeActivityProfile(profile) }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao guardar atividade.");
  }

  const data = await response.json().catch(() => ({}));
  state.ownActivityProfile = normalizeActivityProfile(data.activityProfile || profile);
  renderOwnActivityProfile();
}

async function organizerAction(action, payload = {}) {
  const response = await fetch(API_ORGANIZERS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Falha ao processar organizador.");
  }

  return response.json().catch(() => ({}));
}

function openAdminDialog() {
  elements.adminLoginStatus.textContent = "";
  if (elements.adminUser) {
    const params = new URLSearchParams(window.location.search);
    const organizer = safeTrim(params.get("org"));
    elements.adminUser.value = organizer;
  }
  elements.adminPin.value = "";

  if (typeof elements.adminDialog.showModal === "function") {
    elements.adminDialog.showModal();
  } else {
    elements.adminDialog.hidden = false;
  }

  elements.adminPin.focus();
}

function closeAdminDialog() {
  if (typeof elements.adminDialog.close === "function") {
    elements.adminDialog.close();
  } else {
    elements.adminDialog.hidden = true;
  }
}

async function checkAdminSession() {
  if (isFileMode()) {
    const isAdmin = sessionStorage.getItem("gabuAdmin") === "true";
    setAdminState(isAdmin, {
      role: isAdmin ? "admin" : "none",
      permissions: isAdmin ? ["viewParticipants", "confirmEntry", "confirmPayments", "deleteParticipants", "manageSettings", "viewAudit"] : [],
      allowedActivities: [],
      organizerUsername: isAdmin ? "admin-local" : "",
      isOwner: isAdmin,
    });
    return;
  }

  try {
    const response = await fetch(API_SESSION, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      setAdminState(false);
      return;
    }

    const data = await response.json();
    setAdminState(Boolean(data.isAdmin), {
      role: data.role || "none",
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      allowedActivities: Array.isArray(data.allowedActivities) ? data.allowedActivities : [],
      organizerUsername: data.organizerUsername || "",
      requiresPinChange: Boolean(data.requiresPinChange),
      isOwner: Boolean(data.isOwner),
    });
  } catch {
    setAdminState(false);
  }
}

async function loginAdmin(pin, username = "") {
  if (isFileMode()) {
    const ok = pin === LOCAL_ADMIN_PIN;
    if (ok) {
      sessionStorage.setItem("gabuAdmin", "true");
      setAdminState(true, {
        role: "admin",
        permissions: ["viewParticipants", "confirmEntry", "confirmPayments", "deleteParticipants", "manageSettings", "viewAudit"],
        allowedActivities: [],
        organizerUsername: username || "admin-local",
        isOwner: true,
      });
    }
    return ok;
  }

  const response = await fetch(API_LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ pin, username }),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
  if (Boolean(data.isAdmin)) {
    setAdminState(true, {
      role: data.role || "admin",
      permissions: Array.isArray(data.permissions) ? data.permissions : [],
      allowedActivities: Array.isArray(data.allowedActivities) ? data.allowedActivities : [],
      organizerUsername: data.organizerUsername || safeTrim(username),
      requiresPinChange: Boolean(data.requiresPinChange),
      isOwner: Boolean(data.isOwner),
    });
  }
  return Boolean(data.isAdmin);
}

async function logoutAdmin() {
  if (isFileMode()) {
    sessionStorage.removeItem("gabuAdmin");
    return;
  }

  try {
    await fetch(API_LOGOUT, {
      method: "POST",
      headers: { Accept: "application/json" },
    });
  } catch {
    // The visible logout still happens locally.
  }
}

function updateParticipant(updatedParticipant) {
  const participant = normalizeParticipant(updatedParticipant);
  const index = state.participants.findIndex((item) => item.code === participant.code);

  if (index >= 0) {
    state.participants[index] = participant;
  } else {
    state.participants.unshift(participant);
  }

  state.participants.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  saveLocalParticipants();
  return participant;
}

function getPassUrl(participant) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("code", participant.code);
  return url.toString();
}

function participantText(participant) {
  return [
    "Passe de Atividade",
    `Atividade: ${participant.activityName}`,
    `Nome: ${participant.fullName}`,
    `Código: ${participant.code}`,
    `Pessoas: ${participant.guests} (Adultos: ${participant.adults}, Crianças: ${participant.childrenUnder16})`,
    `Montante acordado: ${euroFormatter.format(participant.agreedAmount || participant.contribution)}`,
    `Validade: ${passStatusText(participant)}`,
    `Link: ${getPassUrl(participant)}`,
  ].join("\n");
}

function downloadFile(file) {
  const blobUrl = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = file.name || "passe-atividade.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

async function generatePassPdfFile(participant) {
  const html2canvasFn = window.html2canvas;
  const jsPdfApi = window.jspdf;
  const jsPdfCtor = jsPdfApi && jsPdfApi.jsPDF;

  if (!html2canvasFn || !jsPdfCtor || !elements.passCard) {
    return null;
  }

  const exportCanvas = await html2canvasFn(elements.passCard, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const pdf = new jsPdfCtor({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const maxWidth = pageWidth - (margin * 2);
  const maxHeight = pageHeight - (margin * 2);
  const imageRatio = exportCanvas.height / exportCanvas.width;

  let imageWidth = maxWidth;
  let imageHeight = imageWidth * imageRatio;
  if (imageHeight > maxHeight) {
    imageHeight = maxHeight;
    imageWidth = imageHeight / imageRatio;
  }

  const x = (pageWidth - imageWidth) / 2;
  const y = (pageHeight - imageHeight) / 2;
  const imageData = exportCanvas.toDataURL("image/png");
  pdf.addImage(imageData, "PNG", x, y, imageWidth, imageHeight, undefined, "FAST");

  const pdfBlob = pdf.output("blob");
  const safeCode = safeTrim(participant.code || "passe").replace(/[^A-Za-z0-9_-]+/g, "-");
  return new File([pdfBlob], `passe-${safeCode}.pdf`, { type: "application/pdf" });
}

async function openPassFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const code = safeTrim(params.get("code"));

  if (!code) {
    return;
  }

  let participant = state.participants.find((item) => item.code === code);

  if (!participant) {
    participant = await loadPublicPass(code);
    if (participant) {
      mergeParticipants([participant]);
    }
  }

  if (!participant) {
    return;
  }

  renderPass(participant);
  showView("pass");
}

function showView(viewId) {
  if (!canOpenView(viewId)) {
    openAdminDialog();
    return;
  }

  elements.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.view === viewId);
  });

  elements.views.forEach((view) => {
    view.classList.toggle("is-active", view.id === viewId);
  });

  // Renderizar conteúdo específico da visualização
  if (viewId === "transparency") {
    renderTransparency();
  }
  if (viewId === "pass") {
    renderConfirmedPasses();
  }
  if (viewId !== "checkin") {
    stopScanner();
  }
}

function renderMetrics() {
  const registrations = state.participants.length;
  const guests = state.participants.reduce((sum, participant) => sum + participant.guests, 0);
  const checkedIn = state.participants.reduce((sum, participant) => {
    return participant.checkedInAt ? sum + participant.guests : sum;
  }, 0);
  const pledged = state.participants.reduce(
    (sum, participant) => sum + (participant.agreedAmount || participant.contribution),
    0
  );
  const received = state.participants
    .filter((participant) => participantIsValid(participant))
    .reduce((sum, participant) => sum + (participant.agreedAmount || participant.contribution), 0);

  elements.metricRegistrations.textContent = registrations;
  elements.metricGuests.textContent = guests;
  elements.metricCheckedIn.textContent = checkedIn;
  elements.metricPledged.textContent = euroFormatter.format(pledged);
  elements.metricReceived.textContent = euroFormatter.format(received);
}

function renderParticipants() {
  const term = safeTrim(elements.participantSearch.value).toLowerCase();
  const canConfirmPayments = hasPermission("confirmPayments");
  const canDeleteParticipants = hasPermission("deleteParticipants");
  const participants = state.participants.filter((participant) => {
    const haystack = [
      participant.code,
      participant.activityName,
      participant.fullName,
      participant.phone,
      participant.email,
      participant.city,
      participant.paymentStatus,
    ].join(" ").toLowerCase();
    return haystack.includes(term);
  });

  elements.participantsBody.innerHTML = "";

  if (elements.participantsVisibleCount) {
    elements.participantsVisibleCount.textContent = String(participants.length);
  }
  if (elements.participantsPendingCount) {
    elements.participantsPendingCount.textContent = String(participants.filter((participant) => !participantIsValid(participant)).length);
  }
  if (elements.participantsConfirmedCount) {
    elements.participantsConfirmedCount.textContent = String(participants.filter((participant) => participantIsValid(participant)).length);
  }

  participants.forEach((participant) => {
    const row = document.createElement("tr");
    const valid = participantIsValid(participant);
    const statusChip = `<span class="status-chip ${valid ? "is-valid" : "is-pending"}">${valid ? "Válido" : "Pendente"}</span>`;
    const agreedAmount = participant.agreedAmount || participant.contribution;
    const actionCell = !canConfirmPayments
      ? "<small>Sem permissão</small>"
      : (valid ? "<small>Confirmado</small>" : `
        <div class="action-inline">
          <input class="confirm-amount" type="number" min="0" step="0.01" value="${agreedAmount}" data-amount-for="${escapeHtml(participant.code)}">
          <input class="confirm-proof-note" type="text" maxlength="120" placeholder="Comprovante (opcional)" data-proof-note-for="${escapeHtml(participant.code)}">
          <input class="confirm-proof-file" type="file" accept="image/*" data-proof-file-for="${escapeHtml(participant.code)}">
          <button type="button" class="secondary-action" data-confirm-code="${escapeHtml(participant.code)}">Confirmar</button>
        </div>`);

    const deleteCell = canDeleteParticipants
      ? `<button type="button" class="danger-action" data-delete-code="${escapeHtml(participant.code)}">Excluir</button>`
      : "<small>Sem permissão</small>";

    row.innerHTML = `
      <td><strong class="code-text">${escapeHtml(participant.code)}</strong></td>
      <td>${escapeHtml(participant.activityName || "Atividade geral")}</td>
      <td>${escapeHtml(participant.fullName)}<br><small>${escapeHtml(participant.city || "-")}</small></td>
      <td>${participant.guests}<br><small>${participant.adults} adulto(s), ${participant.childrenUnder16} criança(s)</small></td>
      <td>${escapeHtml(euroFormatter.format(agreedAmount))}</td>
      <td>${statusChip}</td>
      <td>${escapeHtml(participant.paymentStatus)}</td>
      <td>${renderEntryStatus(participant)}</td>
      <td>${escapeHtml(participant.phone)}${participant.email ? `<br><small>${escapeHtml(participant.email)}</small>` : ""}</td>
      <td>${actionCell}</td>
      <td>${deleteCell}</td>
    `;
    elements.participantsBody.appendChild(row);
  });

  elements.emptyTable.classList.toggle("is-visible", participants.length === 0);
}

function renderTransparency() {
  // Calcular métricas
  const registrations = state.participants.length;
  const guests = state.participants.reduce((sum, participant) => sum + participant.guests, 0);
  const pledged = state.participants.reduce(
    (sum, participant) => sum + (participant.agreedAmount || participant.contribution),
    0
  );
  const received = state.participants
    .filter((participant) => participantIsValid(participant))
    .reduce((sum, participant) => sum + (participant.agreedAmount || participant.contribution), 0);

  // Atualizar métricas
  elements.transparencyRegistrations.textContent = registrations;
  elements.transparencyGuests.textContent = guests;
  elements.transparencyPledged.textContent = euroFormatter.format(pledged);
  elements.transparencyReceived.textContent = euroFormatter.format(received);

  // Calcular distribuição por cidade
  const citiesSummary = {};
  state.participants.forEach((participant) => {
    const city = participant.city || "Não informado";
    if (!citiesSummary[city]) {
      citiesSummary[city] = { count: 0, amount: 0 };
    }
    citiesSummary[city].count += 1;
    citiesSummary[city].amount += participant.contribution;
  });

  // Renderizar cidades
  const citiesList = elements.transparencyCities;
  citiesList.innerHTML = "";

  if (registrations === 0) {
    citiesList.innerHTML = '<p class="empty-state">Sem dados ainda</p>';
  } else {
    const sortedCities = Object.entries(citiesSummary)
      .sort((a, b) => b[1].count - a[1].count);

    sortedCities.forEach(([city, data]) => {
      const item = document.createElement("div");
      item.className = "city-item";
      item.innerHTML = `
        <strong>${escapeHtml(city)}</strong>
        <span>${data.count} pessoa(s) - ${euroFormatter.format(data.amount)}</span>
      `;
      citiesList.appendChild(item);
    });
  }

  // Calcular status de pagamento
  const paymentSummary = {};
  state.participants.forEach((participant) => {
    const status = participant.paymentStatus || "Prometido";
    if (!paymentSummary[status]) {
      paymentSummary[status] = { count: 0, amount: 0 };
    }
    paymentSummary[status].count += 1;
    paymentSummary[status].amount += participant.agreedAmount || participant.contribution;
  });

  // Renderizar status de pagamento
  const paymentList = elements.transparencyPayment;
  paymentList.innerHTML = "";

  if (registrations === 0) {
    paymentList.innerHTML = '<p class="empty-state">Sem dados ainda</p>';
  } else {
    Object.entries(paymentSummary).forEach(([status, data]) => {
      const item = document.createElement("div");
      item.className = `payment-item ${status !== "Prometido" ? "received" : ""}`;
      item.innerHTML = `
        <strong>${escapeHtml(status)}</strong>
        <span>${euroFormatter.format(data.amount)}</span>
      `;
      paymentList.appendChild(item);
    });
  }
}

function renderConfirmedPasses() {
  const confirmed = state.participants.filter((p) => participantIsValid(p));
  if (elements.confirmedCount) elements.confirmedCount.textContent = confirmed.length;
  if (elements.confirmedEmpty) elements.confirmedEmpty.hidden = confirmed.length > 0;
  if (!elements.confirmedPassesList) return;
  elements.confirmedPassesList.innerHTML = "";
  confirmed.forEach((p) => {
    const card = document.createElement("div");
    card.className = "confirmed-pass-card";
    card.dataset.code = p.code;
    card.innerHTML = `
      <strong>${escapeHtml(p.fullName)}</strong>
      <span>${escapeHtml(p.activityName)}</span>
      <span>${p.guests} pessoa(s)</span>
      <button type="button" class="secondary-action compact-action" data-open-pass-code="${escapeHtml(p.code)}">Abrir QR</button>
    `;
    elements.confirmedPassesList.appendChild(card);
  });
}

function renderPass(participant) {
  state.currentPass = participant;
  elements.emptyPass.hidden = true;
  elements.passCard.hidden = false;
  const valid = participantIsValid(participant);
  elements.passName.textContent = participant.fullName;
  elements.passCode.textContent = participant.code;
  elements.passContribution.textContent = euroFormatter.format(participant.agreedAmount || participant.contribution);
  elements.passActivity.textContent = participant.activityName || "Atividade geral";
  elements.passStatus.textContent = valid ? "Válido" : "Pendente";
  elements.passStatus.classList.toggle("is-valid", valid);
  elements.passStatus.classList.toggle("is-pending", !valid);
  elements.passMeta.textContent = `${participant.guests} pessoa(s) (${participant.adults} adulto(s), ${participant.childrenUnder16} criança(s)) - ${participant.paymentStatus}`;
  elements.copyPass.disabled = !valid;
  elements.sharePass.disabled = !valid;
  elements.printPass.disabled = !valid;
  generateQRCode(participant);

  if (participantIsValid(participant)) {
    stopPassWatcher();
  } else {
    startPassWatcher(participant);
  }
}

function renderAll() {
  renderMetrics();
  renderParticipants();
  renderAudit();
  renderOrganizers();
  renderOrganizersMonitor();
  renderOrganizerInvite();
  renderCheckinActivityFilter();
  renderCheckinDashboard();

  if (state.currentCheckin) {
    const refreshedParticipant = state.participants.find((participant) => participant.code === state.currentCheckin.code);
    if (refreshedParticipant) {
      state.currentCheckin = refreshedParticipant;
      renderCheckinResult();
    }
  }
}

function renderAudit() {
  if (!elements.auditList) return;
  if (!state.isAdmin || !hasPermission("viewAudit")) {
    elements.auditList.innerHTML = '<p class="empty-state">Histórico visível apenas para administração.</p>';
    return;
  }

  const logs = Array.isArray(state.audit) ? state.audit.slice(0, 50) : [];
  if (logs.length === 0) {
    elements.auditList.innerHTML = '<p class="empty-state">Sem ações registradas ainda.</p>';
    return;
  }

  elements.auditList.innerHTML = "";
  logs.forEach((item) => {
    const div = document.createElement("div");
    div.className = "audit-item";
    const when = formatDateTime(item.timestamp || "");
    const action = safeTrim(item.action || "-");
    const target = safeTrim(item.targetCode || "-");
    const role = safeTrim(item.actorRole || "-");
    const actionFilter = safeTrim(elements.auditActionFilter?.value || "").toLowerCase();
    const userFilter = safeTrim(elements.auditUserFilter?.value || "").toLowerCase();
    const fromDate = safeTrim(elements.auditDateFrom?.value || "");
    const toDate = safeTrim(elements.auditDateTo?.value || "");
    const timestampMs = Date.parse(item.timestamp || "");

    if (actionFilter && !String(item.action || "").toLowerCase().includes(actionFilter)) {
      return;
    }

    const rawUsername = safeTrim(item.actorUsername || "");
    if (userFilter && !rawUsername.toLowerCase().includes(userFilter)) {
      return;
    }

    if (Number.isFinite(timestampMs)) {
      if (fromDate) {
        const fromMs = Date.parse(`${fromDate}T00:00:00`);
        if (Number.isFinite(fromMs) && timestampMs < fromMs) {
          return;
        }
      }

      if (toDate) {
        const toMs = Date.parse(`${toDate}T23:59:59`);
        if (Number.isFinite(toMs) && timestampMs > toMs) {
          return;
        }
      }
    }

    const username = rawUsername;
    const actor = username ? `${role}/${username}` : role;
    div.textContent = `${when} · ${action} · código ${target} · perfil ${actor}`;
    elements.auditList.appendChild(div);
  });

  if (elements.auditList.children.length === 0) {
    elements.auditList.innerHTML = '<p class="empty-state">Sem ações para os filtros selecionados.</p>';
  }
}

function renderOrganizers() {
  if (!elements.organizersSection || !elements.organizersList) {
    return;
  }

  const canSettings = hasPermission("manageSettings") && !isFileMode();
  elements.organizersSection.hidden = !canSettings;
  if (!canSettings) {
    return;
  }

  if (!state.isOwner) {
    if (elements.organizerForm) elements.organizerForm.hidden = true;
    state.organizerInvite = null;
    renderOrganizerInvite();
    if (elements.organizerStatus) {
      elements.organizerStatus.textContent = "Gestão de organizadores disponível apenas para o Admin Principal.";
    }
    elements.organizersList.innerHTML = '<p class="empty-state">Esta conta não pode criar, desativar ou excluir organizadores.</p>';
    return;
  }

  if (elements.organizerForm) elements.organizerForm.hidden = false;
  if (elements.organizerStatus && elements.organizerStatus.textContent.includes("Admin Principal")) {
    elements.organizerStatus.textContent = "";
  }

  const list = Array.isArray(state.organizers) ? state.organizers : [];
  elements.organizersList.innerHTML = "";
  if (list.length === 0) {
    elements.organizersList.innerHTML = '<p class="empty-state">Sem organizadores criados ainda.</p>';
    return;
  }

  list.forEach((org) => {
    const activities = org.allowedActivities.length > 0
      ? org.allowedActivities.join(", ")
      : "Todas as atividades";
    const profile = normalizeActivityProfile(org.activityProfile || {});
    const item = document.createElement("article");
    item.className = "organizer-item";
    item.dataset.username = org.username;
    item.innerHTML = `
      <div class="organizer-item-head">
        <strong>${escapeHtml(org.name || org.username)}</strong>
        <span class="status-chip ${org.active ? "is-valid" : "chip-danger"}">${org.active ? "Ativo" : "Inativo"}</span>
      </div>
      <div class="organizer-meta">@${escapeHtml(org.username)} · perfil ${escapeHtml(org.role)} · escopo: ${escapeHtml(activities)}</div>
      ${org.email ? `<div class="organizer-meta">Email: ${escapeHtml(org.email)}</div>` : ''}
      ${org.phone ? `<div class="organizer-meta">Telefone: ${escapeHtml(org.phone)}</div>` : ''}
      ${profile.title ? `<div class="organizer-meta">Atividade: ${escapeHtml(profile.title)}</div>` : ''}
      ${profile.date || profile.location ? `<div class="organizer-meta">${escapeHtml([profile.date, profile.location].filter(Boolean).join(" · "))}</div>` : ''}
      ${org.mustChangePassword ? '<div class="organizer-meta">Senha pendente de troca obrigatória</div>' : ''}
      <div class="organizer-actions">
        <button type="button" class="secondary-action compact-action" data-org-invite-whatsapp="${escapeHtml(org.username)}">Convite WhatsApp</button>
        <button type="button" class="secondary-action compact-action" data-org-invite-email="${escapeHtml(org.username)}">Convite Email</button>
        <button type="button" class="secondary-action compact-action" data-org-toggle="${escapeHtml(org.username)}">${org.active ? "Desativar" : "Ativar"}</button>
        <button type="button" class="secondary-action compact-action" data-org-reset="${escapeHtml(org.username)}">Redefinir senha</button>
        <button type="button" class="danger-action compact-action" data-org-delete="${escapeHtml(org.username)}">Excluir</button>
      </div>
    `;
    elements.organizersList.appendChild(item);
  });
}

function renderOrganizersMonitor() {
  if (!elements.organizersMonitorList) {
    return;
  }

  if (!state.isAdmin || !hasPermission("manageSettings")) {
    elements.organizersMonitorList.innerHTML = '<p class="empty-state">Monitorização disponível apenas para o dono do sistema.</p>';
    if (elements.organizersMonitorCount) elements.organizersMonitorCount.textContent = "0";
    if (elements.organizersActiveCount) elements.organizersActiveCount.textContent = "0";
    if (elements.organizersPendingTotal) elements.organizersPendingTotal.textContent = "0";
    if (elements.organizersConfirmedTotal) elements.organizersConfirmedTotal.textContent = "0";
    return;
  }

  const organizers = Array.isArray(state.organizers) ? state.organizers : [];
  const participants = Array.isArray(state.participants) ? state.participants : [];
  const activeCount = organizers.filter((org) => org.active).length;

  if (elements.organizersMonitorCount) elements.organizersMonitorCount.textContent = String(organizers.length);
  if (elements.organizersActiveCount) elements.organizersActiveCount.textContent = String(activeCount);

  let pendingTotal = 0;
  let confirmedTotal = 0;
  elements.organizersMonitorList.innerHTML = "";

  if (organizers.length === 0) {
    elements.organizersMonitorList.innerHTML = '<p class="empty-state">Sem organizadores criados ainda.</p>';
    if (elements.organizersPendingTotal) elements.organizersPendingTotal.textContent = "0";
    if (elements.organizersConfirmedTotal) elements.organizersConfirmedTotal.textContent = "0";
    return;
  }

  organizers.forEach((org) => {
    const allowedActivities = Array.isArray(org.allowedActivities) ? org.allowedActivities : [];
    const profile = normalizeActivityProfile(org.activityProfile || {});
    const allowedKeys = allowedActivities.map((activity) => activityKey(activity)).filter(Boolean);
    const scopedParticipants = participants.filter((participant) => {
      if (allowedKeys.length === 0) {
        return true;
      }

      return allowedKeys.includes(activityKey(participant.activityName));
    });

    const confirmed = scopedParticipants.filter((participant) => participantIsValid(participant)).length;
    const pending = Math.max(0, scopedParticipants.length - confirmed);
    pendingTotal += pending;
    confirmedTotal += confirmed;

    const item = document.createElement("article");
    item.className = "organizer-monitor-item";
    item.innerHTML = `
      <div class="organizer-item-head">
        <strong>${escapeHtml(org.name || org.username)}</strong>
        <span class="status-chip ${org.active ? "is-valid" : "chip-danger"}">${org.active ? "Ativo" : "Inativo"}</span>
      </div>
      <div class="organizer-meta">@${escapeHtml(org.username)} · perfil ${escapeHtml(org.role)}</div>
      <div class="organizer-meta">Escopo: ${escapeHtml(allowedActivities.length > 0 ? allowedActivities.join(", ") : "Todas as atividades")}</div>
      ${profile.title ? `<div class="organizer-meta">Título: ${escapeHtml(profile.title)}</div>` : ''}
      ${profile.description ? `<div class="organizer-meta">Descrição: ${escapeHtml(profile.description.slice(0, 180))}${profile.description.length > 180 ? "..." : ""}</div>` : ''}
      ${profile.date || profile.startTime || profile.endTime || profile.location ? `<div class="organizer-meta">${escapeHtml([profile.date, profile.startTime ? `Início ${profile.startTime}` : "", profile.endTime ? `Fim ${profile.endTime}` : "", profile.location].filter(Boolean).join(" · "))}</div>` : ''}
      ${profile.flyerUrl ? `<div class="organizer-meta">Flyer: <a href="${escapeHtml(profile.flyerUrl)}" target="_blank" rel="noopener">link</a></div>` : ''}
      <div class="participants-summary organizer-monitor-stats">
        <div><span>Total</span><strong>${scopedParticipants.length}</strong></div>
        <div><span>Pendentes</span><strong>${pending}</strong></div>
        <div><span>Confirmados</span><strong>${confirmed}</strong></div>
      </div>
    `;
    elements.organizersMonitorList.appendChild(item);
  });

  if (elements.organizersPendingTotal) elements.organizersPendingTotal.textContent = String(pendingTotal);
  if (elements.organizersConfirmedTotal) elements.organizersConfirmedTotal.textContent = String(confirmedTotal);
}

function renderCheckinDashboard() {
  if (!elements.checkinPresentCount) return;

  const registrations = state.participants.length;
  const checked = state.participants.filter((p) => Boolean(p.checkedInAt));
  const present = checked.length;
  const noShow = Math.max(0, registrations - present);
  const lastHour = checked.filter((p) => {
    const ts = new Date(p.checkedInAt || "").getTime();
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts <= 60 * 60 * 1000;
  }).length;
  const rate = registrations > 0 ? Math.round((present / registrations) * 100) : 0;

  elements.checkinPresentCount.textContent = String(present);
  elements.checkinNoShowCount.textContent = String(noShow);
  elements.checkinLastHourCount.textContent = String(lastHour);
  elements.checkinRate.textContent = `${rate}%`;
}

function renderCheckinActivityFilter() {
  if (!elements.checkinActivityFilter) return;

  const current = elements.checkinActivityFilter.value;
  const catalog = new Set((state.eventConfig.activityCatalog || []).map((x) => safeTrim(x)).filter(Boolean));
  state.participants.forEach((p) => catalog.add(safeTrim(p.activityName)));

  const options = ["", ...[...catalog].sort((a, b) => a.localeCompare(b, "pt"))];
  elements.checkinActivityFilter.innerHTML = "";
  options.forEach((activity) => {
    const option = document.createElement("option");
    option.value = activity;
    option.textContent = activity || "Todas as atividades";
    elements.checkinActivityFilter.appendChild(option);
  });

  const restored = options.includes(current) ? current : "";
  elements.checkinActivityFilter.value = restored;
}

function renderEntryStatus(participant) {
  if (!participant.checkedInAt) {
    return `<span class="entry-status">Pendente</span>`;
  }

  return `<span class="entry-status is-confirmed">Confirmada</span><br><small>${escapeHtml(formatDateTime(participant.checkedInAt))}</small>`;
}

function formatDateTime(value) {
  if (!value) {
    return "Ainda não confirmada";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return dateFormatter.format(date);
}

function findCheckinMatches(query) {
  const term = normalizeSearch(query);
  const compactTerm = term.replaceAll("-", "").replaceAll(" ", "");
  const activityFilter = safeTrim(elements.checkinActivityFilter?.value || "").toLowerCase();

  if (!term) {
    return [];
  }

  const exactMatches = state.participants.filter((participant) => {
    if (activityFilter && normalizeSearch(participant.activityName) !== activityFilter) {
      return false;
    }
    const code = normalizeSearch(participant.code);
    return code === term || code.replaceAll("-", "") === compactTerm;
  });

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  return state.participants
    .filter((participant) => {
      if (activityFilter && normalizeSearch(participant.activityName) !== activityFilter) {
        return false;
      }
      const haystack = [
        participant.code,
        participant.fullName,
        participant.phone,
        participant.email,
        participant.city,
      ].map(normalizeSearch).join(" ");
      return haystack.includes(term);
    })
    .slice(0, 8);
}

function renderCheckinMatches(matches) {
  elements.checkinMatchList.innerHTML = "";
  elements.checkinMatches.hidden = matches.length <= 1;

  matches.forEach((participant) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "match-button";
    button.dataset.code = participant.code;
    button.innerHTML = `
      <strong>${escapeHtml(participant.fullName)}</strong>
      <span>${escapeHtml(participant.code)} · ${participant.guests} pessoa(s)</span>
    `;
    elements.checkinMatchList.appendChild(button);
  });
}

function selectCheckinParticipant(participant) {
  state.currentCheckin = normalizeParticipant(participant);
  elements.checkinEmptyResult.hidden = true;
  elements.checkinResult.hidden = false;
  renderCheckinResult();
}

function renderCheckinResult() {
  const participant = state.currentCheckin;
  if (!participant) {
    elements.checkinResult.hidden = true;
    elements.checkinEmptyResult.hidden = false;
    return;
  }

  const confirmed = Boolean(participant.checkedInAt);
  const canConfirmEntry = hasPermission("confirmEntry");
  elements.checkinBadge.textContent = confirmed ? "Confirmada" : "Pendente";
  elements.checkinBadge.classList.toggle("is-confirmed", confirmed);
  elements.checkinName.textContent = participant.fullName;
  elements.checkinCode.textContent = participant.code;
  elements.checkinGuests.textContent = `${participant.guests} pessoa(s)`;
  elements.checkinContribution.textContent = euroFormatter.format(participant.agreedAmount || participant.contribution);
  elements.checkinPaymentStatus.textContent = participant.paymentStatus;
  elements.checkinContact.textContent = [participant.phone, participant.email].filter(Boolean).join(" · ") || "-";
  elements.checkinTime.textContent = formatDateTime(participant.checkedInAt);
  const valid = participantIsValid(participant);
  elements.confirmCheckin.disabled = !canConfirmEntry || confirmed || !valid;
  elements.confirmCheckin.textContent = confirmed
    ? "Entrada confirmada"
    : valid
      ? "Confirmar entrada"
      : "Aguardando validação";
  elements.undoCheckin.disabled = !canConfirmEntry || !confirmed;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function generateQRCode(participant) {
  const container = elements.passSeal;
  container.innerHTML = "";

  if (!participantIsValid(participant)) {
    const placeholder = document.createElement("div");
    placeholder.className = "pass-placeholder";
    placeholder.innerHTML = "<strong>QR bloqueado</strong><span>O acesso de entrada so fica disponivel depois da confirmacao do organizador.</span>";
    container.appendChild(placeholder);
    return;
  }

  const passUrl = getPassUrl(participant);
  
  // Usar QRCode.js se disponível
  if (typeof QRCode !== "undefined") {
    try {
      // Gerar novo QR code
      new QRCode(container, {
        text: passUrl,
        width: 168,
        height: 168,
        colorDark: "#17212b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    } catch (error) {
      console.warn("Erro ao gerar QR code:", error);
      drawSealFallback(participant.code);
    }
  } else {
    // Fallback: desenhar padrão visual se biblioteca não carregar
    drawSealFallback(participant.code);
  }
}

function drawSealFallback(code) {
  // Padrão visual como fallback se QRCode.js não carregar
  const container = elements.passSeal;
  const canvas = document.createElement("canvas");
  canvas.width = 168;
  canvas.height = 168;
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  
  // Desenhar um padrão simples
  ctx.strokeStyle = "#17212b";
  ctx.lineWidth = 2;
  for (let i = 20; i < size; i += 25) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }
  
  // Adicionar texto
  ctx.fillStyle = "#17212b";
  ctx.font = "bold 12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Código:", size / 2, size / 2 - 20);
  ctx.fillText(code, size / 2, size / 2 + 20);
  
  container.appendChild(canvas);
}

function toCsvValue(value) {
  const text = String(value ?? "");
  // Escape duplas aspas
  let escaped = text.replaceAll('"', '""');
  // Remover quebras de linha e carriage returns (ou preservar escapados)
  escaped = escaped.replaceAll(/[\r\n]+/g, ' ');
  // Se contém caracteres especiais, envolver em aspas
  if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
    return `"${escaped}"`;
  }
  return `"${escaped}"`;
}

async function fileToDataUrl(file) {
  if (!file) return "";
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Falha ao ler ficheiro."));
    reader.readAsDataURL(file);
  });
}

function exportCsv() {
  const header = ["Código", "Atividade", "Nome", "Telefone", "Email", "Cidade", "Adultos", "Crianças<=16", "Pessoas", "Contribuição", "Estado", "Entrada", "Observação"];
  const rows = state.participants.map((participant) => [
    participant.code,
    participant.activityName,
    participant.fullName,
    participant.phone,
    participant.email,
    participant.city,
    participant.adults,
    participant.childrenUnder16,
    participant.guests,
    (participant.agreedAmount || participant.contribution).toFixed(2),
    participant.paymentStatus,
    participant.checkedInAt,
    participant.note,
  ]);
  const csvLines = [header, ...rows].map((row) => row.map(toCsvValue).join(","));
  // Adicionar BOM para UTF-8 (importante para Excel em Windows)
  const csv = "\ufeff" + csvLines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "participantes-gabu-hamburg.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function exportAdvancedCsv() {
  const byActivity = {};
  state.participants.forEach((participant) => {
    const key = participant.activityName || "Atividade geral";
    if (!byActivity[key]) {
      byActivity[key] = [];
    }
    byActivity[key].push(participant);
  });

  const lines = [];
  lines.push(["Resumo por atividade", "Inscrições", "Presentes", "Valor confirmado"]);
  Object.entries(byActivity).forEach(([activity, participants]) => {
    const checked = participants.filter((p) => p.checkedInAt).length;
    const received = participants.reduce((sum, p) => sum + (p.agreedAmount || p.contribution || 0), 0);
    lines.push([activity, participants.length, checked, received.toFixed(2)]);
  });

  lines.push([]);
  lines.push(["Detalhe", "Código", "Nome", "Telefone", "Estado", "Entrada"]);
  Object.entries(byActivity).forEach(([activity, participants]) => {
    participants.forEach((p) => {
      lines.push([activity, p.code, p.fullName, p.phone, p.paymentStatus, p.checkedInAt || ""]);
    });
  });

  const csvLines = lines.map((row) => row.map(toCsvValue).join(","));
  const csv = "\ufeff" + csvLines.join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "participantes-por-atividade.csv";
  link.click();
  URL.revokeObjectURL(url);
}

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

elements.adminLoginButton.addEventListener("click", openAdminDialog);

elements.adminCancelButton.addEventListener("click", closeAdminDialog);

elements.adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = safeTrim(elements.adminUser?.value || "");
  const pin = safeTrim(elements.adminPin.value);

  if (!pin) {
    elements.adminLoginStatus.textContent = "Escreve a senha da organização.";
    return;
  }

  elements.adminLoginStatus.textContent = "A verificar senha...";
  const ok = await loginAdmin(pin, username);

  if (!ok) {
    elements.adminLoginStatus.textContent = "Senha incorreta.";
    return;
  }

  if (state.requiresPinChange && !isFileMode()) {
    try {
      await runRequiredPinChange(pin);
      elements.adminLoginStatus.textContent = "Senha atualizada com sucesso.";
    } catch (error) {
      elements.adminLoginStatus.textContent = error.message || "Não foi possível concluir a troca de senha obrigatória.";
      await logoutAdmin();
      setAdminState(false, { clearData: true });
      return;
    }
  }

  closeAdminDialog();
  await loadServerParticipants();
  await loadOrganizers();
  await loadOwnActivityProfile();
  await loadEventConfig();
  await syncCheckinQueue();
  renderAll();
});

elements.adminLogoutButton.addEventListener("click", async () => {
  await logoutAdmin();
  setAdminState(false, { clearData: true });
  elements.formStatus.textContent = "Sessão de organizador terminada.";
});

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.form);
  const email = safeTrim(formData.get("email"));
  const adults = Math.max(0, Number.parseInt(formData.get("adults"), 10) || 0);
  const childrenUnder16 = Math.max(0, Number.parseInt(formData.get("childrenUnder16"), 10) || 0);
  const guests = adults + childrenUnder16;
  const contribution = adults * state.pricing.adultPrice + childrenUnder16 * state.pricing.childPrice;

  if (guests <= 0) {
    elements.formStatus.textContent = "Informa pelo menos 1 pessoa (adulto ou criança).";
    return;
  }

  const participant = normalizeParticipant({
    code: makeCode(),
    activityName: formData.get("activityName"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email,
    city: formData.get("city"),
    adults,
    childrenUnder16,
    guests,
    contribution,
    agreedAmount: contribution,
    amountConfirmed: false,
    paymentStatus: "Aguardando confirmação do organizador",
    note: formData.get("note"),
  });

  if (!participant.fullName || !participant.phone) {
    elements.formStatus.textContent = "Preenche pelo menos o nome e o contacto.";
    return;
  }

  const submitButton = elements.form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  elements.formStatus.textContent = "A enviar cadastro...";

  const savedParticipant = await saveParticipant(participant);
  mergeParticipants([savedParticipant]);
  renderAll();
  elements.form.reset();
  elements.form.elements.adults.value = "1";
  elements.form.elements.childrenUnder16.value = "0";
  elements.form.elements.contribution.value = contribution.toFixed(2);
  updateContributionHint();
  elements.formStatus.textContent = `Cadastro enviado com sucesso. Codigo de referencia: ${savedParticipant.code}. Vais aguardar a confirmacao da organizacao.`;
  submitButton.disabled = false;
});

function updateContributionFromGuests() {
  const adults = Math.max(0, Number.parseInt(elements.form.elements.adults.value, 10) || 0);
  const childrenUnder16 = Math.max(0, Number.parseInt(elements.form.elements.childrenUnder16.value, 10) || 0);
  const contribution = adults * state.pricing.adultPrice + childrenUnder16 * state.pricing.childPrice;
  elements.form.elements.contribution.value = contribution.toFixed(2);
}

elements.form.elements.adults.addEventListener("input", updateContributionFromGuests);
elements.form.elements.childrenUnder16.addEventListener("input", updateContributionFromGuests);

if (elements.savePricingBtn) {
  elements.savePricingBtn.addEventListener("click", async () => {
    const a = Number.parseFloat(elements.adultPriceInput.value);
    const c = Number.parseFloat(elements.childPriceInput.value);
    if (Number.isFinite(a) && a >= 0) state.pricing.adultPrice = a;
    if (Number.isFinite(c) && c >= 0) state.pricing.childPrice = c;
    savePricing();
    state.eventConfig.adultPrice = state.pricing.adultPrice;
    state.eventConfig.childPrice = state.pricing.childPrice;
    if (hasPermission("manageSettings") && !isFileMode()) {
      try {
        await saveEventConfig();
      } catch {}
    }
    updateContributionHint();
    updateContributionFromGuests();
    elements.savePricingBtn.textContent = "Guardado ✓";
    setTimeout(() => { elements.savePricingBtn.textContent = "Guardar"; }, 1800);
  });
}

elements.checkinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!hasPermission("confirmEntry")) {
    openAdminDialog();
    return;
  }

  const matches = findCheckinMatches(elements.checkinQuery.value);

  if (matches.length === 0) {
    state.currentCheckin = null;
    elements.checkinResult.hidden = true;
    elements.checkinEmptyResult.hidden = false;
    elements.checkinMatches.hidden = true;
    elements.checkinStatus.textContent = "Não encontrei nenhum participante com esses dados.";
    return;
  }

  renderCheckinMatches(matches);
  selectCheckinParticipant(matches[0]);
  elements.checkinStatus.textContent = matches.length === 1
    ? "Participante encontrado."
    : `${matches.length} participantes encontrados. Escolhe o correto na lista.`;
});

elements.checkinMatchList.addEventListener("click", (event) => {
  const button = event.target.closest(".match-button");
  if (!button) {
    return;
  }

  const participant = state.participants.find((item) => item.code === button.dataset.code);
  if (participant) {
    selectCheckinParticipant(participant);
    elements.checkinStatus.textContent = "Participante selecionado.";
  }
});

if (elements.confirmedPassesList) {
  elements.confirmedPassesList.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-open-pass-code], .confirmed-pass-card");
    if (!trigger) {
      return;
    }

    const code = trigger.dataset.openPassCode || trigger.dataset.code;
    if (!code) {
      return;
    }

    const participant = state.participants.find((item) => item.code === code);
    if (!participant) {
      return;
    }

    renderPass(participant);
    showView("pass");
    elements.formStatus.textContent = `QR pronto para ${participant.fullName}.`;
  });
}

elements.participantsBody.addEventListener("click", async (event) => {
  const deleteBtn = event.target.closest("button[data-delete-code]");
  if (deleteBtn) {
    if (!hasPermission("deleteParticipants")) { openAdminDialog(); return; }
    const code = deleteBtn.dataset.deleteCode;
    const participant = state.participants.find((p) => p.code === code);
    const name = participant?.fullName || code;
    if (!window.confirm(`Confirmas a exclusão de "${name}"? Esta ação não pode ser revertida.`)) return;
    await deleteParticipant(code);
    return;
  }

  const button = event.target.closest("button[data-confirm-code]");
  if (!button) {
    return;
  }

  if (!hasPermission("confirmPayments")) {
    openAdminDialog();
    return;
  }

  const code = button.dataset.confirmCode;
  const amountInput = elements.participantsBody.querySelector(`input[data-amount-for="${code}"]`);
  const proofNoteInput = elements.participantsBody.querySelector(`input[data-proof-note-for="${code}"]`);
  const proofFileInput = elements.participantsBody.querySelector(`input[data-proof-file-for="${code}"]`);
  const agreedAmount = Math.max(0, Number.parseFloat(amountInput?.value || "0") || 0);
  const paymentProofNote = safeTrim(proofNoteInput?.value || "");
  const file = proofFileInput?.files?.[0];
  const participant = state.participants.find((item) => item.code === code);

  if (!participant) {
    elements.formStatus.textContent = "Participante não encontrado para confirmar.";
    return;
  }

  try {
    button.disabled = true;
    const paymentProofImage = await fileToDataUrl(file).catch(() => "");
    const updated = await confirmPayment(participant, agreedAmount, paymentProofImage, paymentProofNote);
    updateParticipant(updated);
    renderPass(updated);
    renderAll();
    showView("pass");
    elements.formStatus.textContent = `Montante confirmado para ${updated.fullName}. QR gerado e passe válido.`;
  } catch (error) {
    elements.formStatus.textContent = error.message || "Não foi possível confirmar o montante.";
  } finally {
    button.disabled = false;
  }
});

if (elements.organizerForm) {
  elements.organizerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isFileMode()) {
      elements.organizerStatus.textContent = "Gestão de organizadores disponível apenas quando a API PHP estiver ativa.";
      return;
    }
    if (!hasPermission("manageSettings")) {
      openAdminDialog();
      return;
    }

    const payload = {
      name: safeTrim(elements.organizerName?.value || ""),
      username: safeTrim(elements.organizerUsername?.value || ""),
      email: safeTrim(elements.organizerEmail?.value || ""),
      phone: safeTrim(elements.organizerPhone?.value || ""),
      role: safeTrim(elements.organizerRole?.value || "viewer"),
      pin: safeTrim(elements.organizerPin?.value || ""),
      allowedActivities: parseCommaList(elements.organizerActivities?.value || ""),
    };

    if (payload.username.length < 3) {
      elements.organizerStatus.textContent = "Utilizador deve ter pelo menos 3 caracteres.";
      return;
    }

    if (!isStrongPin(payload.pin)) {
      elements.organizerStatus.textContent = "Senha fraca. Use pelo menos 6 caracteres com letras e números.";
      return;
    }

    try {
      await organizerAction("create", payload);
      state.organizerInvite = {
        name: payload.name || payload.username,
        username: payload.username,
        email: payload.email,
        phone: payload.phone,
        pin: payload.pin,
        link: organizerAccessUrl(payload.username),
      };
      renderOrganizerInvite();
      elements.organizerForm.reset();
      if (elements.organizerRole) elements.organizerRole.value = "viewer";
      elements.organizerStatus.textContent = `Organizador ${payload.username} criado com sucesso.`;
      await loadOrganizers();
      await loadServerParticipants();
    } catch (error) {
      elements.organizerStatus.textContent = error.message || "Falha ao criar organizador.";
    }
  });
}

if (elements.activityProfileForm) {
  elements.activityProfileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!state.isAdmin) {
      openAdminDialog();
      return;
    }

    const flyerFile = elements.activityFlyerImageInput?.files?.[0] || null;
    const flyerImage = flyerFile
      ? await fileToDataUrl(flyerFile).catch(() => "")
      : safeTrim(state.ownActivityProfile?.flyerImage || "");

    const profile = {
      title: safeTrim(elements.activityTitleInput?.value || ""),
      description: safeTrim(elements.activityDescriptionInput?.value || ""),
      date: safeTrim(elements.activityDateInput?.value || ""),
      location: safeTrim(elements.activityLocationInput?.value || ""),
      startTime: safeTrim(elements.activityStartTimeInput?.value || ""),
      endTime: safeTrim(elements.activityEndTimeInput?.value || ""),
      flyerUrl: safeTrim(elements.activityFlyerUrlInput?.value || ""),
      flyerImage,
    };

    try {
      await saveOwnActivityProfile(profile);
      if (elements.activityProfileStatus) {
        elements.activityProfileStatus.textContent = "Atividade guardada com sucesso.";
      }
      if (elements.activityFlyerImageInput) {
        elements.activityFlyerImageInput.value = "";
      }
      await loadOrganizers();
    } catch (error) {
      if (elements.activityProfileStatus) {
        elements.activityProfileStatus.textContent = error.message || "Falha ao guardar atividade.";
      }
    }
  });
}

if (elements.organizersList) {
  elements.organizersList.addEventListener("click", async (event) => {
    if (isFileMode()) {
      elements.organizerStatus.textContent = "Gestão de organizadores disponível apenas quando a API PHP estiver ativa.";
      return;
    }

    const inviteWaButton = event.target.closest("[data-org-invite-whatsapp]");
    if (inviteWaButton) {
      const username = safeTrim(inviteWaButton.dataset.orgInviteWhatsapp);
      const org = state.organizers.find((item) => item.username === username);
      if (!org) return;
      const payload = {
        name: org.name || org.username,
        username: org.username,
        phone: org.phone || "",
        link: organizerAccessUrl(org.username),
      };
      openInviteWhatsapp(payload);
      return;
    }

    const inviteEmailButton = event.target.closest("[data-org-invite-email]");
    if (inviteEmailButton) {
      const username = safeTrim(inviteEmailButton.dataset.orgInviteEmail);
      const org = state.organizers.find((item) => item.username === username);
      if (!org) return;
      const payload = {
        name: org.name || org.username,
        username: org.username,
        email: org.email || "",
        phone: org.phone || "",
        link: organizerAccessUrl(org.username),
      };
      openInviteEmail(payload);
      return;
    }

    const toggleButton = event.target.closest("[data-org-toggle]");
    if (toggleButton) {
      const username = safeTrim(toggleButton.dataset.orgToggle);
      const org = state.organizers.find((item) => item.username === username);
      if (!org) return;
      try {
        await organizerAction("update", { username, active: !org.active });
        elements.organizerStatus.textContent = `Acesso de ${username} atualizado.`;
        await loadOrganizers();
      } catch (error) {
        elements.organizerStatus.textContent = error.message || "Falha ao atualizar organizador.";
      }
      return;
    }

    const resetButton = event.target.closest("[data-org-reset]");
    if (resetButton) {
      const username = safeTrim(resetButton.dataset.orgReset);
      const newPin = safeTrim(window.prompt(`Nova senha para ${username}:`) || "");
      if (!newPin) return;
      if (!isStrongPin(newPin)) {
        elements.organizerStatus.textContent = "Senha fraca. Use pelo menos 6 caracteres com letras e números.";
        return;
      }
      try {
        await organizerAction("resetPin", { username, pin: newPin });
        elements.organizerStatus.textContent = `Senha de ${username} redefinida com sucesso.`;
      } catch (error) {
        elements.organizerStatus.textContent = error.message || "Falha ao redefinir senha.";
      }
      return;
    }

    const deleteButton = event.target.closest("[data-org-delete]");
    if (deleteButton) {
      const username = safeTrim(deleteButton.dataset.orgDelete);
      const confirmed = window.confirm(`Deseja excluir o organizador ${username}?`);
      if (!confirmed) return;
      try {
        await organizerAction("delete", { username });
        elements.organizerStatus.textContent = `Organizador ${username} excluído.`;
        await loadOrganizers();
      } catch (error) {
        elements.organizerStatus.textContent = error.message || "Falha ao excluir organizador.";
      }
    }
  });
}

[elements.auditActionFilter, elements.auditUserFilter, elements.auditDateFrom, elements.auditDateTo]
  .filter(Boolean)
  .forEach((field) => field.addEventListener("input", renderAudit));

if (elements.clearAuditFilters) {
  elements.clearAuditFilters.addEventListener("click", () => {
    if (elements.auditActionFilter) elements.auditActionFilter.value = "";
    if (elements.auditUserFilter) elements.auditUserFilter.value = "";
    if (elements.auditDateFrom) elements.auditDateFrom.value = "";
    if (elements.auditDateTo) elements.auditDateTo.value = "";
    renderAudit();
  });
}

if (elements.copyInviteMessage) {
  elements.copyInviteMessage.addEventListener("click", async () => {
    if (!state.organizerInvite) return;
    await navigator.clipboard.writeText(organizerInviteMessageText(state.organizerInvite));
    elements.copyInviteMessage.textContent = "Copiado";
    setTimeout(() => {
      elements.copyInviteMessage.textContent = "Copiar mensagem";
    }, 1600);
  });
}

if (elements.sendInviteWhatsapp) {
  elements.sendInviteWhatsapp.addEventListener("click", () => {
    if (!state.organizerInvite) return;
    openInviteWhatsapp(state.organizerInvite);
  });
}

if (elements.sendInviteEmail) {
  elements.sendInviteEmail.addEventListener("click", () => {
    if (!state.organizerInvite) return;
    openInviteEmail(state.organizerInvite);
  });
}

async function confirmCurrentCheckinEntry(source = "manual") {
  if (!state.currentCheckin) {
    return;
  }

  const participant = state.currentCheckin;
  const valid = participantIsValid(participant);
  const alreadyCheckedIn = Boolean(participant.checkedInAt);

  if (!valid) {
    elements.checkinStatus.textContent = "Passe pendente. A entrada só pode ser confirmada após validação.";
    if (source === "scan") {
      playScanFeedback("warning");
    }
    renderCheckinResult();
    return;
  }

  if (alreadyCheckedIn) {
    elements.checkinStatus.textContent = "Este participante já tem entrada confirmada.";
    if (source === "scan") {
      playScanFeedback("info");
    }
    renderCheckinResult();
    return;
  }

  try {
    elements.confirmCheckin.disabled = true;
    elements.checkinStatus.textContent = source === "scan"
      ? "QR válido. A confirmar entrada automaticamente..."
      : "A confirmar entrada...";
    const updatedParticipant = await saveCheckin(participant, new Date().toISOString());
    state.currentCheckin = updateParticipant(updatedParticipant);
    renderAll();
    const queuedOffline = !navigator.onLine;
    elements.checkinStatus.textContent = queuedOffline
      ? "Sem internet: entrada guardada localmente e será sincronizada quando voltar conexão."
      : (source === "scan" ? "Entrada confirmada automaticamente via QR." : "Entrada confirmada com sucesso.");
    if (source === "scan") {
      playScanFeedback("success");
    }
  } catch (error) {
    elements.checkinStatus.textContent = error.message || "Não foi possível confirmar a entrada.";
    if (source === "scan") {
      playScanFeedback("error");
    }
    renderCheckinResult();
  }
}

elements.confirmCheckin.addEventListener("click", async () => {
  await confirmCurrentCheckinEntry("manual");
});

elements.undoCheckin.addEventListener("click", async () => {
  if (!state.currentCheckin) {
    return;
  }

  if (!hasPermission("confirmEntry")) {
    openAdminDialog();
    return;
  }

  const confirmed = window.confirm("Queres anular a confirmação de entrada desta pessoa?");
  if (!confirmed) {
    return;
  }

  try {
    elements.undoCheckin.disabled = true;
    elements.checkinStatus.textContent = "A anular entrada...";
    const updatedParticipant = await saveCheckin(state.currentCheckin, "");
    state.currentCheckin = updateParticipant(updatedParticipant);
    renderAll();
    elements.checkinStatus.textContent = "Entrada anulada.";
  } catch (error) {
    elements.checkinStatus.textContent = error.message || "Não foi possível anular a entrada.";
    renderCheckinResult();
  }
});

elements.openCheckinPass.addEventListener("click", () => {
  if (!state.currentCheckin) {
    return;
  }

  renderPass(state.currentCheckin);
  showView("pass");
});

elements.copyPass.addEventListener("click", async () => {
  if (!state.currentPass || !participantIsValid(state.currentPass)) {
    return;
  }

  await navigator.clipboard.writeText(participantText(state.currentPass));
  elements.copyPass.textContent = "Copiado";
  setTimeout(() => {
    elements.copyPass.textContent = "Copiar";
  }, 1600);
});

elements.sharePass.addEventListener("click", async () => {
  if (!state.currentPass || !participantIsValid(state.currentPass)) {
    return;
  }

  const participant = state.currentPass;
  const originalLabel = elements.sharePass.textContent;
  elements.sharePass.disabled = true;
  elements.sharePass.textContent = "A preparar PDF...";

  let pdfFile = null;
  try {
    pdfFile = await generatePassPdfFile(participant);
  } catch {
    pdfFile = null;
  }

  const text = participantText(participant);

  if (navigator.share && pdfFile) {
    const shareData = { title: "Passe de Atividade", text, files: [pdfFile] };
    if (!navigator.canShare || navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        elements.sharePass.disabled = false;
        elements.sharePass.textContent = originalLabel;
        return;
      } catch {
        // Fallback abaixo.
      }
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: "Passe de Atividade", text });
      elements.sharePass.disabled = false;
      elements.sharePass.textContent = originalLabel;
      return;
    } catch {
      // Fallback para WhatsApp.
    }
  }

  if (pdfFile) {
    downloadFile(pdfFile);
  }

  const whatsappText = pdfFile
    ? `${text}\n\nPDF do passe gerado para anexar no WhatsApp.`
    : text;
  window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, "_blank", "noopener");

  elements.sharePass.disabled = false;
  elements.sharePass.textContent = originalLabel;
});

elements.printPass.addEventListener("click", () => {
  if (!state.currentPass || !participantIsValid(state.currentPass)) {
    return;
  }

  showView("pass");
  window.print();
});

elements.participantSearch.addEventListener("input", renderParticipants);
elements.exportCsv.addEventListener("click", exportCsv);
if (elements.exportAdvancedCsv) {
  elements.exportAdvancedCsv.addEventListener("click", exportAdvancedCsv);
}
if (elements.checkinActivityFilter) {
  elements.checkinActivityFilter.addEventListener("change", () => {
    if (safeTrim(elements.checkinQuery.value) !== "") {
      elements.checkinForm.dispatchEvent(new Event("submit", { cancelable: true }));
    }
  });
}
if (elements.saveEventConfigBtn) {
  elements.saveEventConfigBtn.addEventListener("click", async () => {
    try {
      await saveEventConfig();
      elements.formStatus.textContent = "Configuração do evento guardada com sucesso.";
    } catch (error) {
      elements.formStatus.textContent = error.message || "Falha ao guardar configuração do evento.";
    }
  });
}
window.addEventListener("online", () => {
  syncCheckinQueue();
});

async function deleteParticipant(code) {
  if (!isFileMode()) {
    try {
      const response = await fetch(API_DELETE, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!response.ok) {
        const d = await response.json().catch(() => ({}));
        elements.formStatus.textContent = d.error || "Não foi possível excluir.";
        return;
      }
    } catch {
      // fall through to local delete
    }
  }
  const index = state.participants.findIndex((p) => p.code === code);
  if (index >= 0) {
    state.participants.splice(index, 1);
    saveLocalParticipants();
    renderAll();
    elements.formStatus.textContent = "Participante excluído com sucesso.";
  }
}

async function startScanner() {
  if (!elements.scannerVideo) return;
  if (!hasPermission("confirmEntry")) {
    openAdminDialog();
    return;
  }
  try {
    ensureScanAudioContext();
    state.scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    elements.scannerVideo.srcObject = state.scannerStream;
    await elements.scannerVideo.play();
    elements.startScannerBtn.disabled = true;
    elements.stopScannerBtn.disabled = false;
    elements.scannerStatus.textContent = "Câmara ativa. Aponta o QR code.";
    scanLoop();
  } catch (err) {
    elements.scannerStatus.textContent = `Erro ao aceder à câmara: ${err.message}`;
  }
}

function stopScanner() {
  if (state.scannerStream) {
    state.scannerStream.getTracks().forEach((t) => t.stop());
    state.scannerStream = null;
  }
  if (state.scannerAnimFrame) {
    cancelAnimationFrame(state.scannerAnimFrame);
    state.scannerAnimFrame = null;
  }
  if (elements.scannerVideo) elements.scannerVideo.srcObject = null;
  if (elements.startScannerBtn) elements.startScannerBtn.disabled = false;
  if (elements.stopScannerBtn) elements.stopScannerBtn.disabled = true;
  if (elements.scannerStatus) elements.scannerStatus.textContent = "";
}

function scanLoop() {
  if (!state.scannerStream) return;
  const video = elements.scannerVideo;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    const canvas = elements.scannerCanvas;
    canvas.height = video.videoHeight;
    canvas.width = video.videoWidth;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (typeof jsQR !== "undefined") {
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
      if (code) {
        handleScannedCode(code.data);
        stopScanner();
        return;
      }
    }
  }
  state.scannerAnimFrame = requestAnimationFrame(scanLoop);
}

async function handleScannedCode(data) {
  let code = safeTrim(data);
  try {
    const url = new URL(data);
    code = safeTrim(url.searchParams.get("code")) || code;
  } catch {}

  if (isScanLocked(code)) {
    elements.checkinStatus.textContent = "QR lido há instantes. Aguarda 2 segundos para nova validação.";
    playScanFeedback("info");
    return;
  }

  let participant = state.participants.find((p) => p.code === code);
  let payload = null;

  try {
    payload = await loadPublicPassPayload(code);
  } catch {
    payload = null;
  }

  if (payload?.participant) {
    participant = normalizeParticipant(payload.participant);
    mergeParticipants([participant]);
  }

  if (!participant) {
    elements.scannerStatus.textContent = `QR inválido (${code}). Passe não encontrado.`;
    elements.checkinStatus.textContent = "QR inválido. Não existe passe para este código.";
    playScanFeedback("error");
    elements.checkinResult.hidden = true;
    elements.checkinEmptyResult.hidden = false;
    elements.checkinMatches.hidden = true;
    return;
  }

  const eventName = safeTrim(payload?.eventName || state.eventConfig.eventName || "evento atual");
  const isValidQr = payload?.validation
    ? Boolean(payload.validation.isValid)
    : participantIsValid(participant);

  if (!isValidQr) {
    elements.scannerStatus.textContent = `QR inválido para ${eventName}. Passe sem validação do organizador.`;
    elements.checkinStatus.textContent = "QR inválido. Este passe ainda não foi validado pelo organizador.";
    playScanFeedback("warning");
    elements.checkinResult.hidden = true;
    elements.checkinEmptyResult.hidden = false;
    elements.checkinMatches.hidden = true;
    return;
  }

  selectCheckinParticipant(participant);
  const valid = participantIsValid(participant);
  elements.scannerStatus.textContent = `QR válido para ${eventName}: ${participant.fullName}.`;
  elements.checkinStatus.textContent = `QR válido para ${eventName}. Participante carregado para confirmar entrada.`;

  if (valid && !participant.checkedInAt) {
    await confirmCurrentCheckinEntry("scan");
    return;
  }

  if (valid && participant.checkedInAt) {
    elements.checkinStatus.textContent = `QR válido para ${eventName}. Esta entrada já estava confirmada.`;
    playScanFeedback("info");
    return;
  }
}

if (elements.startScannerBtn) elements.startScannerBtn.addEventListener("click", startScanner);
if (elements.stopScannerBtn) elements.stopScannerBtn.addEventListener("click", stopScanner);
elements.clearLocal.addEventListener("click", () => {
  const confirmed = window.confirm("Queres apagar apenas os dados guardados neste navegador?");
  if (!confirmed) {
    return;
  }

  state.participants = [];
  state.currentPass = null;
  state.currentCheckin = null;
  localStorage.removeItem(STORAGE_KEY);
  elements.passCard.hidden = true;
  elements.emptyPass.hidden = false;
  elements.checkinResult.hidden = true;
  elements.checkinEmptyResult.hidden = false;
  elements.checkinMatches.hidden = true;
  renderAll();
});

async function initializeApp() {
  loadPricing();
  applyOrganizerPrefillFromQuery();
  renderEventConfigInputs();
  loadLocalParticipants();
  renderAll();
  setAdminState(false);
  await loadEventConfig();
  await openPassFromQuery();
  await checkAdminSession();

  if (state.isAdmin) {
    await loadServerParticipants();
    await loadOrganizers();
    await loadOwnActivityProfile();
    await syncCheckinQueue();
    renderAll();
  }
}

initializeApp();
