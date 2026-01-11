(function () {
  const messagesEl = document.getElementById("messages");
  const inputEl = document.getElementById("messageInput");
  const sendButtonEl = document.getElementById("sendButton");
  const statusDotEl = document.getElementById("statusDot");
  const statusTextEl = document.getElementById("statusText");
  const settingsButtonEl = document.getElementById("settingsButton");
  const settingsMenuEl = document.getElementById("settingsMenu");
  const qrButtonEl = document.getElementById("qrButton");
  const qrOverlayEl = document.getElementById("qrOverlay");
  const qrCloseButtonEl = document.getElementById("qrCloseButton");
  const fileInputEl = document.getElementById("fileInput");
  const uploadButtonEl = document.getElementById("uploadButton");

  let socket = null;
  let isConnected = false;
  // Track messages we just sent so we can style their echo as outgoing.
  const pendingOutgoing = [];
  let currentTheme = "midnight";

  function setStatus(connected, text) {
    isConnected = connected;
    if (connected) {
      statusDotEl.classList.add("status-dot--connected");
      statusTextEl.textContent = text || "Connected";
      sendButtonEl.disabled = false;
    } else {
      statusDotEl.classList.remove("status-dot--connected");
      statusTextEl.textContent = text || "Disconnected";
      sendButtonEl.disabled = true;
    }
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(text, options) {
    const opts = options || {};
    const el = document.createElement("div");
    el.classList.add("message");
    if (opts.system) {
      el.classList.add("message--system");
    }
    if (opts.outgoing) {
      el.classList.add("message--outgoing");
    }
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollToBottom();
  }

  function connect() {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsUrl = protocol + "://" + window.location.host + "/ws";

    try {
      socket = new WebSocket(wsUrl);
    } catch (e) {
      console.error("Failed to create WebSocket:", e);
      addMessage("[system] Could not create WebSocket connection.", {
        system: true,
      });
      setStatus(false, "Error");
      return;
    }

    setStatus(false, "Connecting…");

    socket.addEventListener("open", () => {
      setStatus(true, "Connected");
      addMessage("[system] Connected to QRConnect.", { system: true });
    });

    socket.addEventListener("message", (event) => {
      const text = String(event.data || "");

      // If this matches a message we just sent, treat it as outgoing.
      let isOutgoing = false;
      if (pendingOutgoing.length > 0 && pendingOutgoing[0] === text) {
        pendingOutgoing.shift();
        isOutgoing = true;
      }

      addMessage(text, { outgoing: isOutgoing });
    });

    socket.addEventListener("close", () => {
      setStatus(false, "Disconnected");
      addMessage("[system] Disconnected from server.", { system: true });
    });

    socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      setStatus(false, "Error");
      addMessage("[system] WebSocket error.", { system: true });
    });
  }

  function sendCurrentMessage() {
    const text = inputEl.value.trim();
    if (!text || !socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    // Remember this text so we can style the echoed message as outgoing.
    pendingOutgoing.push(text);
    socket.send(text);
    inputEl.value = "";
    inputEl.focus();
  }

  uploadButtonEl.addEventListener("click", () => fileInputEl.click());

  fileInputEl.addEventListener("change", async () => {
    if (!fileInputEl.files || fileInputEl.files.length === 0) return;
    const file = fileInputEl.files[0];

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/upload", { method: "POST", body: formData });
    const data = await response.json(); // { url: "/static/uploads/..." }

    // For now: send the URL as a chat message
    pendingOutgoing.push(data.url);
    socket.send(data.url);

    fileInputEl.value = "";
  });

  function applyTheme(theme) {
    currentTheme = theme;
    document.body.classList.remove(
      "theme-midnight",
      "theme-love",
      "theme-terminal",
      "theme-minimal",
      "theme-minimal-dark"
    );
    document.body.classList.add(`theme-${theme}`);
    try {
      window.localStorage.setItem("qrconnect-theme", theme);
    } catch (_) {
      // ignore
    }

    const buttons = settingsMenuEl.querySelectorAll("button[data-theme]");
    buttons.forEach((btn) => {
      if (btn.getAttribute("data-theme") === theme) {
        btn.classList.add("is-active");
      } else {
        btn.classList.remove("is-active");
      }
    });
  }

  function toggleSettingsMenu() {
    settingsMenuEl.classList.toggle("settings-menu--open");
  }

  function closeSettingsMenu() {
    settingsMenuEl.classList.remove("settings-menu--open");
  }

  function openQrOverlay() {
    qrOverlayEl.classList.add("qr-overlay--open");
  }

  function closeQrOverlay() {
    qrOverlayEl.classList.remove("qr-overlay--open");
  }

  sendButtonEl.addEventListener("click", sendCurrentMessage);

  inputEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendCurrentMessage();
    }
  });

  window.addEventListener("load", () => {
    // Theme
    let storedTheme = null;
    try {
      storedTheme = window.localStorage.getItem("qrconnect-theme");
    } catch (_) {
      storedTheme = null;
    }
    applyTheme(storedTheme || "midnight");

    connect();
    inputEl.focus();
  });

  settingsButtonEl.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSettingsMenu();
  });

  settingsMenuEl.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const theme = target.getAttribute("data-theme");
    if (!theme) return;
    applyTheme(theme);
    closeSettingsMenu();
  });

  document.addEventListener("click", (event) => {
    if (!settingsMenuEl.classList.contains("settings-menu--open")) {
      return;
    }
    if (
      !settingsMenuEl.contains(event.target) &&
      event.target !== settingsButtonEl
    ) {
      closeSettingsMenu();
    }
  });

  qrButtonEl.addEventListener("click", (event) => {
    event.stopPropagation();
    openQrOverlay();
  });

  qrCloseButtonEl.addEventListener("click", (event) => {
    event.stopPropagation();
    closeQrOverlay();
  });

  qrOverlayEl.addEventListener("click", (event) => {
    const modal = qrOverlayEl.querySelector(".qr-modal");
    if (modal && !modal.contains(event.target)) {
      closeQrOverlay();
    }
  });
})();
