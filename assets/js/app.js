const STORAGE_KEY = "gabuHamburgParticipantsV1";
const API_REGISTER = "api/register.php";
const API_PARTICIPANTS = "api/participants.php";
const API_CHECKIN = "api/checkin.php";
const API_LOGIN = "api/login.php";
const API_LOGOUT = "api/logout.php";
const API_SESSION = "api/session.php";
const LOCAL_ADMIN_PIN = "gabu2026";

const state = {
  participants: [],
  currentPass: null,
  currentCheckin: null,
  isAdmin: false,
};

const elements = {
  tabs: document.querySelectorAll(".tab"),
  adminOnlyTabs: document.querySelectorAll("[data-admin-only]"),
  views: document.querySelectorAll(".view"),
  form: document.querySelector("#signupForm"),
  formStatus: document.querySelector("#formStatus"),
  emptyPass: document.querySelector("#emptyPass"),
  passCard: document.querySelector("#passCard"),
  passSeal: document.querySelector("#passSeal"),
  passName: document.querySelector("#passName"),
  passCode: document.querySelector("#passCode"),
  passContribution: document.querySelector("#passContribution"),
  passMeta: document.querySelector("#passMeta"),
  copyPass: document.querySelector("#copyPass"),
  sharePass: document.querySelector("#sharePass"),
  printPass: document.querySelector("#printPass"),
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
  return {
    code: safeTrim(participant.code) || makeCode(),
    fullName: safeTrim(participant.fullName),
    phone: safeTrim(participant.phone),
    email: safeTrim(participant.email),
    city: safeTrim(participant.city),
    guests: Math.max(1, Number.parseInt(participant.guests, 10) || 1),
    contribution: Math.max(0, Number.parseFloat(participant.contribution) || 0),
    paymentStatus: safeTrim(participant.paymentStatus) || "Prometido",
    note: safeTrim(participant.note),
    checkedInAt: participant.checkedInAt || "",
    createdAt: participant.createdAt || new Date().toISOString(),
  };
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
      const response = await fetch(API_REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(participant),
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

      if (response.ok) {
        const data = await response.json();
        if (data.participant) {
          return normalizeParticipant(data.participant);
        }
      }
    } catch {
      // Keep check-in usable even when the PHP API is unavailable.
    }
  }

  return updatedParticipant;
}

function isAdminView(viewId) {
  return viewId === "checkin" || viewId === "participants";
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

function participantText(participant) {
  return [
    "Passe Solidário Gabú Hamburg",
    `Nome: ${participant.fullName}`,
    `Código: ${participant.code}`,
    `Pessoas: ${participant.guests}`,
    `Contribuição: ${euroFormatter.format(participant.contribution)}`,
  ].join("\n");
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
}

function renderMetrics() {
  const registrations = state.participants.length;
  const guests = state.participants.reduce((sum, participant) => sum + participant.guests, 0);
  const checkedIn = state.participants.reduce((sum, participant) => {
    return participant.checkedInAt ? sum + participant.guests : sum;
  }, 0);
  const pledged = state.participants.reduce((sum, participant) => sum + participant.contribution, 0);
  const received = state.participants
    .filter((participant) => participant.paymentStatus !== "Prometido")
    .reduce((sum, participant) => sum + participant.contribution, 0);

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
      participant.fullName,
      participant.phone,
      participant.email,
      participant.city,
      participant.paymentStatus,
    ].join(" ").toLowerCase();
    return haystack.includes(term);
  });

  elements.participantsBody.innerHTML = "";

  participants.forEach((participant) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong class="code-text">${escapeHtml(participant.code)}</strong></td>
      <td>${escapeHtml(participant.fullName)}<br><small>${escapeHtml(participant.city || "-")}</small></td>
      <td>${participant.guests}</td>
      <td>${escapeHtml(euroFormatter.format(participant.contribution))}</td>
      <td>${escapeHtml(participant.paymentStatus)}</td>
      <td>${renderEntryStatus(participant)}</td>
      <td>${escapeHtml(participant.phone)}${participant.email ? `<br><small>${escapeHtml(participant.email)}</small>` : ""}</td>
    `;
    elements.participantsBody.appendChild(row);
  });

  elements.emptyTable.classList.toggle("is-visible", participants.length === 0);
}

function renderTransparency() {
  // Calcular métricas
  const registrations = state.participants.length;
  const guests = state.participants.reduce((sum, participant) => sum + participant.guests, 0);
  const pledged = state.participants.reduce((sum, participant) => sum + participant.contribution, 0);
  const received = state.participants
    .filter((participant) => participant.paymentStatus !== "Prometido")
    .reduce((sum, participant) => sum + participant.contribution, 0);

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
    paymentSummary[status].amount += participant.contribution;
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

function renderPass(participant) {
  state.currentPass = participant;
  elements.emptyPass.hidden = true;
  elements.passCard.hidden = false;
  elements.passName.textContent = participant.fullName;
  elements.passCode.textContent = participant.code;
  elements.passContribution.textContent = euroFormatter.format(participant.contribution);
  elements.passMeta.textContent = `${participant.guests} pessoa(s) - ${participant.paymentStatus}`;
  generateQRCode(participant.code);
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
  elements.checkinContribution.textContent = euroFormatter.format(participant.contribution);
  elements.checkinPaymentStatus.textContent = participant.paymentStatus;
  elements.checkinContact.textContent = [participant.phone, participant.email].filter(Boolean).join(" · ") || "-";
  elements.checkinTime.textContent = formatDateTime(participant.checkedInAt);
  elements.confirmCheckin.disabled = confirmed;
  elements.confirmCheckin.textContent = confirmed ? "Entrada confirmada" : "Confirmar entrada";
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

function generateQRCode(code) {
  const container = elements.passSeal;
  
  // Limpar conteúdo anterior
  container.innerHTML = "";
  
  // Usar QRCode.js se disponível
  if (typeof QRCode !== "undefined") {
    try {
      // Gerar novo QR code
      new QRCode(container, {
        text: code,
        width: 168,
        height: 168,
        colorDark: "#17212b",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    } catch (error) {
      console.warn("Erro ao gerar QR code:", error);
      drawSealFallback(code);
    }
  } else {
    // Fallback: desenhar padrão visual se biblioteca não carregar
    drawSealFallback(code);
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
  const header = ["Código", "Nome", "Telefone", "Email", "Cidade", "Pessoas", "Contribuição", "Estado", "Entrada", "Observação"];
  const rows = state.participants.map((participant) => [
    participant.code,
    participant.fullName,
    participant.phone,
    participant.email,
    participant.city,
    participant.guests,
    participant.contribution.toFixed(2),
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
  const participant = normalizeParticipant({
    code: makeCode(),
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    city: formData.get("city"),
    guests: formData.get("guests"),
    contribution: formData.get("contribution"),
    paymentStatus: formData.get("paymentStatus"),
    note: formData.get("note"),
  });

  if (!participant.fullName || !participant.phone) {
    elements.formStatus.textContent = "Preenche pelo menos o nome e o contacto.";
    return;
  }

  const submitButton = elements.form.querySelector("button[type='submit']");
  submitButton.disabled = true;
  elements.formStatus.textContent = "A criar o passe...";

  const savedParticipant = await saveParticipant(participant);
  mergeParticipants([savedParticipant]);
  renderPass(savedParticipant);
  renderAll();
  showView("pass");
  elements.form.reset();
  elements.form.elements.guests.value = "1";
  elements.form.elements.contribution.value = "10";
  elements.formStatus.textContent = "Passe criado com sucesso.";
  submitButton.disabled = false;
});

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
  if (!state.currentPass) {
    return;
  }

  await navigator.clipboard.writeText(participantText(state.currentPass));
  elements.copyPass.textContent = "Copiado";
  setTimeout(() => {
    elements.copyPass.textContent = "Copiar";
  }, 1600);
});

elements.sharePass.addEventListener("click", () => {
  if (!state.currentPass) {
    return;
  }

  const text = encodeURIComponent(participantText(state.currentPass));
  // Para enviar para um número específico, use:
  // window.open(`https://wa.me/[NUMERO_WHATSAPP_COM_CÓDIGO_PAÍS]/?text=${text}`, "_blank", "noopener");
  // Exemplo: https://wa.me/49123456789/?text=${text} (Alemanha)
  window.open(`https://wa.me/?text=${text}`, "_blank", "noopener");
});

elements.printPass.addEventListener("click", () => {
  showView("pass");
  window.print();
});

elements.participantSearch.addEventListener("input", renderParticipants);
elements.exportCsv.addEventListener("click", exportCsv);
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
  loadLocalParticipants();
  renderAll();
  setAdminState(false);
  await checkAdminSession();

  if (state.isAdmin) {
    await loadServerParticipants();
    renderAll();
  }
}

initializeApp();
