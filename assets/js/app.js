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
const LOCAL_ADMIN_PIN = "gabu2026";

const state = {
  participants: [],
  currentPass: null,
  currentCheckin: null,
  isAdmin: false,
  passPollingTimer: null,
  scannerStream: null,
  scannerAnimFrame: null,
  pricing: { adultPrice: 10, childPrice: 5 },
};

const elements = {
  tabs: document.querySelectorAll(".tab"),
  adminOnlyTabs: document.querySelectorAll("[data-admin-only]"),
  organizerTabs: document.querySelectorAll("[data-organizer-tab]"),
  registerWorkGrid: document.querySelector("#register .work-grid"),
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
  scannerResultPanel: document.querySelector("#scannerResultPanel"),
  scannerBadge: document.querySelector("#scannerBadge"),
  scannerName: document.querySelector("#scannerName"),
  scannerCode: document.querySelector("#scannerCode"),
  scannerActivity: document.querySelector("#scannerActivity"),
  scannerGuests: document.querySelector("#scannerGuests"),
  scannerContribution: document.querySelector("#scannerContribution"),
  scannerValidity: document.querySelector("#scannerValidity"),
  scannerEntry: document.querySelector("#scannerEntry"),
  scannerEmptyResult: document.querySelector("#scannerEmptyResult"),
  adultPriceInput: document.querySelector("#adultPriceInput"),
  childPriceInput: document.querySelector("#childPriceInput"),
  savePricingBtn: document.querySelector("#savePricingBtn"),
  contributionHint: document.querySelector("#contributionHint"),
  participantsBody: document.querySelector("#participantsBody"),
  emptyTable: document.querySelector("#emptyTable"),
  participantSearch: document.querySelector("#participantSearch"),
  exportCsv: document.querySelector("#exportCsv"),
  clearLocal: document.querySelector("#clearLocal"),
  checkinForm: document.querySelector("#checkinForm"),
  checkinQuery: document.querySelector("#checkinQuery"),
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
  confirmCheckin: document.querySelector("#confirmCheckin"),
  undoCheckin: document.querySelector("#undoCheckin"),
  openCheckinPass: document.querySelector("#openCheckinPass"),
  adminStatusLabel: document.querySelector("#adminStatusLabel"),
  adminLoginButton: document.querySelector("#adminLoginButton"),
  adminLogoutButton: document.querySelector("#adminLogoutButton"),
  adminDialog: document.querySelector("#adminDialog"),
  adminLoginForm: document.querySelector("#adminLoginForm"),
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

function safeTrim(value) {
  return String(value || "").trim();
}

function isFileMode() {
  return window.location.protocol === "file:";
}

function normalizeSearch(value) {
  return safeTrim(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
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
    committeeAgreement: safeTrim(participant.committeeAgreement) || "Padrão da comissão",
    paymentStatus:
      safeTrim(participant.paymentStatus) ||
      (amountConfirmed ? "Confirmado pelo organizador" : "Aguardando confirmação do organizador"),
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
        confirmEmail: participant.email,
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

async function saveCheckin(participant, checkedInAt) {
  const updatedParticipant = normalizeParticipant({
    ...participant,
    checkedInAt,
  });

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Não foi possível confirmar a entrada.");
      }

      const data = await response.json();
      if (data.participant) {
        return normalizeParticipant(data.participant);
      }
    } catch {
      throw new Error("Não foi possível confirmar a entrada.");
    }
  }

  return updatedParticipant;
}

async function confirmPayment(participant, agreedAmount) {
  const updatedParticipant = normalizeParticipant({
    ...participant,
    agreedAmount,
    contribution: agreedAmount,
    amountConfirmed: true,
    amountConfirmedAt: new Date().toISOString(),
    paymentStatus: "Confirmado pelo organizador",
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
      }),
    });

    if (response.status === 401) {
      setAdminState(false, { clearData: true });
      throw new Error("Precisas entrar como organizador.");
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
  return viewId === "checkin" || viewId === "participants" || viewId === "scanner" || viewId === "transparency";
}

function activeViewId() {
  const activeView = [...elements.views].find((view) => view.classList.contains("is-active"));
  return activeView ? activeView.id : "register";
}

function setAdminState(isAdmin, options = {}) {
  state.isAdmin = isAdmin;
  elements.adminOnlyTabs.forEach((tab) => {
    tab.hidden = !isAdmin;
  });
  elements.organizerTabs.forEach((tab) => {
    tab.hidden = !isAdmin;
  });
  if (elements.registerWorkGrid) {
    elements.registerWorkGrid.classList.toggle("is-single", !isAdmin);
  }
  elements.adminStatusLabel.textContent = isAdmin ? "Organizador" : "Público";
  elements.adminStatusLabel.classList.toggle("is-active", isAdmin);
  elements.adminLoginButton.hidden = isAdmin;
  elements.adminLogoutButton.hidden = !isAdmin;

  if (!isAdmin && isAdminView(activeViewId())) {
    showView("register");
  }

  if (!isAdmin && options.clearData) {
    state.participants = [];
    state.currentCheckin = null;
    localStorage.removeItem(STORAGE_KEY);
    elements.checkinResult.hidden = true;
    elements.checkinEmptyResult.hidden = false;
    elements.checkinMatches.hidden = true;
    renderAll();
  }
}

function openAdminDialog() {
  elements.adminLoginStatus.textContent = "";
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
    setAdminState(sessionStorage.getItem("gabuAdmin") === "true");
    return;
  }

  try {
    const response = await fetch(API_SESSION, { headers: { Accept: "application/json" } });
    if (!response.ok) {
      setAdminState(false);
      return;
    }

    const data = await response.json();
    setAdminState(Boolean(data.isAdmin));
  } catch {
    setAdminState(false);
  }
}

async function loginAdmin(pin) {
  if (isFileMode()) {
    const ok = pin === LOCAL_ADMIN_PIN;
    if (ok) {
      sessionStorage.setItem("gabuAdmin", "true");
    }
    return ok;
  }

  const response = await fetch(API_LOGIN, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ pin }),
  });

  if (!response.ok) {
    return false;
  }

  const data = await response.json();
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
    `Acordo: ${participant.committeeAgreement}`,
    `Montante acordado: ${euroFormatter.format(participant.agreedAmount || participant.contribution)}`,
    `Validade: ${passStatusText(participant)}`,
    `Link: ${getPassUrl(participant)}`,
  ].join("\n");
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
  if (isAdminView(viewId) && !state.isAdmin) {
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
  if (viewId !== "scanner") {
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
  const participants = state.participants.filter((participant) => {
    const haystack = [
      participant.code,
      participant.activityName,
      participant.fullName,
      participant.phone,
      participant.email,
      participant.city,
      participant.committeeAgreement,
      participant.paymentStatus,
    ].join(" ").toLowerCase();
    return haystack.includes(term);
  });

  elements.participantsBody.innerHTML = "";

  participants.forEach((participant) => {
    const row = document.createElement("tr");
    const valid = participantIsValid(participant);
    const statusChip = `<span class="status-chip ${valid ? "is-valid" : "is-pending"}">${valid ? "Válido" : "Pendente"}</span>`;
    const agreedAmount = participant.agreedAmount || participant.contribution;

    row.innerHTML = `
      <td><strong class="code-text">${escapeHtml(participant.code)}</strong></td>
      <td>${escapeHtml(participant.activityName || "Atividade geral")}</td>
      <td>${escapeHtml(participant.fullName)}<br><small>${escapeHtml(participant.city || "-")}</small></td>
      <td>${participant.guests}<br><small>${participant.adults} adulto(s), ${participant.childrenUnder16} criança(s)</small></td>
      <td>${escapeHtml(euroFormatter.format(agreedAmount))}</td>
      <td>${statusChip}</td>
      <td>${escapeHtml(participant.paymentStatus)}<br><small>${escapeHtml(participant.committeeAgreement || "-")}</small></td>
      <td>${renderEntryStatus(participant)}</td>
      <td>${escapeHtml(participant.phone)}${participant.email ? `<br><small>${escapeHtml(participant.email)}</small>` : ""}</td>
      <td>
        ${valid ? "<small>Confirmado</small>" : `
        <div class="action-inline">
          <input class="confirm-amount" type="number" min="0" step="0.01" value="${agreedAmount}" data-amount-for="${escapeHtml(participant.code)}">
          <button type="button" class="secondary-action" data-confirm-code="${escapeHtml(participant.code)}">Confirmar</button>
        </div>`}
      </td>
      <td><button type="button" class="danger-action" data-delete-code="${escapeHtml(participant.code)}">Excluir</button></td>
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
    card.innerHTML = `
      <strong>${escapeHtml(p.fullName)}</strong>
      <span>${escapeHtml(p.activityName)}</span>
      <span>${p.guests} pessoa(s)</span>
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
  elements.passMeta.textContent = `${participant.guests} pessoa(s) (${participant.adults} adulto(s), ${participant.childrenUnder16} criança(s)) - ${participant.paymentStatus} - ${participant.committeeAgreement}`;
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

  if (state.currentCheckin) {
    const refreshedParticipant = state.participants.find((participant) => participant.code === state.currentCheckin.code);
    if (refreshedParticipant) {
      state.currentCheckin = refreshedParticipant;
      renderCheckinResult();
    }
  }
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

  if (!term) {
    return [];
  }

  const exactMatches = state.participants.filter((participant) => {
    const code = normalizeSearch(participant.code);
    return code === term || code.replaceAll("-", "") === compactTerm;
  });

  if (exactMatches.length > 0) {
    return exactMatches;
  }

  return state.participants
    .filter((participant) => {
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
  elements.confirmCheckin.disabled = confirmed || !valid;
  elements.confirmCheckin.textContent = confirmed
    ? "Entrada confirmada"
    : valid
      ? "Confirmar entrada"
      : "Aguardando validação";
  elements.undoCheckin.disabled = !confirmed;
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

function exportCsv() {
  const header = ["Código", "Atividade", "Nome", "Telefone", "Email", "Cidade", "Adultos", "Crianças<=16", "Pessoas", "Contribuição", "Acordo comissão", "Estado", "Entrada", "Observação"];
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
    participant.committeeAgreement,
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

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => showView(tab.dataset.view));
});

elements.adminLoginButton.addEventListener("click", openAdminDialog);

elements.adminCancelButton.addEventListener("click", closeAdminDialog);

elements.adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const pin = safeTrim(elements.adminPin.value);

  if (!pin) {
    elements.adminLoginStatus.textContent = "Escreve a senha da organização.";
    return;
  }

  elements.adminLoginStatus.textContent = "A verificar senha...";
  const ok = await loginAdmin(pin);

  if (!ok) {
    elements.adminLoginStatus.textContent = "Senha incorreta.";
    return;
  }

  setAdminState(true);
  closeAdminDialog();
  await loadServerParticipants();
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
  const confirmEmail = safeTrim(formData.get("confirmEmail"));
  const adults = Math.max(0, Number.parseInt(formData.get("adults"), 10) || 0);
  const childrenUnder16 = Math.max(0, Number.parseInt(formData.get("childrenUnder16"), 10) || 0);
  const guests = adults + childrenUnder16;
  const contribution = adults * 10 + childrenUnder16 * 5;

  if (email && confirmEmail && email.toLowerCase() !== confirmEmail.toLowerCase()) {
    elements.formStatus.textContent = "Email e confirmação de email não coincidem.";
    return;
  }

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
    confirmEmail,
    city: formData.get("city"),
    adults,
    childrenUnder16,
    guests,
    contribution,
    agreedAmount: contribution,
    committeeAgreement: formData.get("committeeAgreement"),
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
  elements.form.elements.contribution.value = "10";
  elements.form.elements.committeeAgreement.value = "Padrão da comissão";
  elements.formStatus.textContent = `Cadastro enviado com sucesso. Codigo de referencia: ${savedParticipant.code}. Vais aguardar a confirmacao da organizacao para receber o QR de entrada.`;
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
  elements.savePricingBtn.addEventListener("click", () => {
    const a = Number.parseFloat(elements.adultPriceInput.value);
    const c = Number.parseFloat(elements.childPriceInput.value);
    if (Number.isFinite(a) && a >= 0) state.pricing.adultPrice = a;
    if (Number.isFinite(c) && c >= 0) state.pricing.childPrice = c;
    savePricing();
    updateContributionHint();
    updateContributionFromGuests();
    elements.savePricingBtn.textContent = "Guardado ✓";
    setTimeout(() => { elements.savePricingBtn.textContent = "Guardar"; }, 1800);
  });
}

elements.checkinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!state.isAdmin) {
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

elements.participantsBody.addEventListener("click", async (event) => {
  const deleteBtn = event.target.closest("button[data-delete-code]");
  if (deleteBtn) {
    if (!state.isAdmin) { openAdminDialog(); return; }
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

  if (!state.isAdmin) {
    openAdminDialog();
    return;
  }

  const code = button.dataset.confirmCode;
  const amountInput = elements.participantsBody.querySelector(`input[data-amount-for="${code}"]`);
  const agreedAmount = Math.max(0, Number.parseFloat(amountInput?.value || "0") || 0);
  const participant = state.participants.find((item) => item.code === code);

  if (!participant) {
    elements.formStatus.textContent = "Participante não encontrado para confirmar.";
    return;
  }

  try {
    button.disabled = true;
    const updated = await confirmPayment(participant, agreedAmount);
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

elements.confirmCheckin.addEventListener("click", async () => {
  if (!state.currentCheckin) {
    return;
  }

  try {
    elements.confirmCheckin.disabled = true;
    elements.checkinStatus.textContent = "A confirmar entrada...";
    const updatedParticipant = await saveCheckin(state.currentCheckin, new Date().toISOString());
    state.currentCheckin = updateParticipant(updatedParticipant);
    renderAll();
    elements.checkinStatus.textContent = "Entrada confirmada com sucesso.";
  } catch (error) {
    elements.checkinStatus.textContent = error.message || "Não foi possível confirmar a entrada.";
    renderCheckinResult();
  }
});

elements.undoCheckin.addEventListener("click", async () => {
  if (!state.currentCheckin) {
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

  const text = participantText(state.currentPass);
  const canvas = elements.passSeal.querySelector("canvas");

  if (navigator.share && canvas) {
    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File([blob], "passe-qr.png", { type: "image/png" });
        const shareData = { title: "Passe de Atividade", text, files: [file] };
        if (navigator.canShare && navigator.canShare(shareData)) {
          try { await navigator.share(shareData); return; } catch {}
        }
      }
      try { await navigator.share({ title: "Passe de Atividade", text }); return; } catch {}
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    });
    return;
  }

  if (navigator.share) {
    try { await navigator.share({ title: "Passe de Atividade", text }); return; } catch {}
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
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
  try {
    state.scannerStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    elements.scannerVideo.srcObject = state.scannerStream;
    await elements.scannerVideo.play();
    elements.startScannerBtn.disabled = true;
    elements.stopScannerBtn.disabled = false;
    elements.scannerStatus.textContent = "Câmara ativa. Aponta o QR code.";
    elements.scannerEmptyResult.hidden = false;
    elements.scannerResultPanel.hidden = true;
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

  let participant = state.participants.find((p) => p.code === code);
  if (!participant) {
    participant = await loadPublicPass(code);
    if (participant) mergeParticipants([participant]);
  }

  elements.scannerEmptyResult.hidden = true;
  elements.scannerResultPanel.hidden = false;

  if (!participant) {
    elements.scannerBadge.textContent = "Não encontrado";
    elements.scannerBadge.className = "scanner-badge is-invalid";
    elements.scannerName.textContent = "Participante desconhecido";
    elements.scannerCode.textContent = code;
    elements.scannerActivity.textContent = "-";
    elements.scannerGuests.textContent = "-";
    elements.scannerContribution.textContent = "-";
    elements.scannerValidity.textContent = "Inválido";
    elements.scannerEntry.textContent = "-";
    elements.scannerStatus.textContent = `Código scaneado: ${code}. Passe não encontrado.`;
    return;
  }

  const valid = participantIsValid(participant);
  elements.scannerBadge.textContent = valid ? (participant.checkedInAt ? "✅ Já deu entrada" : "✅ Válido - pode entrar") : "❌ Pendente - sem validade";
  elements.scannerBadge.className = `scanner-badge ${valid ? "is-valid" : "is-invalid"}`;
  elements.scannerName.textContent = participant.fullName;
  elements.scannerCode.textContent = participant.code;
  elements.scannerActivity.textContent = participant.activityName;
  elements.scannerGuests.textContent = `${participant.guests} pessoa(s) (${participant.adults} adulto(s), ${participant.childrenUnder16} criança(s))`;
  elements.scannerContribution.textContent = euroFormatter.format(participant.agreedAmount || participant.contribution);
  elements.scannerValidity.textContent = valid ? "Válido" : "Pendente";
  elements.scannerEntry.textContent = participant.checkedInAt ? formatDateTime(participant.checkedInAt) : "Ainda não confirmada";
  elements.scannerStatus.textContent = `Scan concluído: ${participant.fullName}`;
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
  loadLocalParticipants();
  renderAll();
  setAdminState(false);
  await openPassFromQuery();
  await checkAdminSession();

  if (state.isAdmin) {
    await loadServerParticipants();
    renderAll();
  }
}

initializeApp();
