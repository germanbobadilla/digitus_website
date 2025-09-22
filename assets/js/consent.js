/*
  Consent banner (custom, accessible). Text in Spanish; code in English.
  Stores preferences in localStorage under key: consent.preferences
*/

(function () {
  const STORAGE_KEY = "consent.preferences";
  const REMIND_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

  document.addEventListener("DOMContentLoaded", () => {
    try {
      const existing = get_preferences();
      if (!existing) {
        render_consent_banner();
      } else if (should_reprompt(existing)) {
        render_consent_banner();
      }
    } catch (_) {
      // Fail silent; do not block page
    }
  });

  function should_reprompt(prefs) {
    if (!prefs || !prefs.timestamp) return true;
    const age = Date.now() - Number(prefs.timestamp || 0);
    return age > REMIND_MS;
  }

  function get_preferences() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function save_preferences(prefs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      timestamp: Date.now(),
      ...prefs,
    }));
  }

  function render_consent_banner() {
    const banner = document.createElement("div");
    banner.id = "consent-banner";
    banner.className = "fixed inset-x-0 bottom-0 z-[60] bg-white/95 backdrop-blur border-t border-slate-200";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Preferencias de privacidad");

    banner.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div class="text-sm text-slate-700 leading-6">
            <p class="font-medium text-dark-500 mb-1">Tu privacidad en Digitus</p>
            <p>
              Usamos cookies y tecnologías similares para mejorar tu experiencia, analizar el uso y, con tu
              consentimiento, personalizar contenido y marketing. Consulta nuestra
              <a href="/pages/politicas-de-privacidad.html" class="text-brand-600 hover:text-brand-700 underline">Política de Privacidad</a> para más detalles.
            </p>
          </div>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button id="consent-configure" class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Configurar</button>
            <button id="consent-reject" class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800">Rechazar no esenciales</button>
            <button id="consent-accept" class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white">Aceptar todo</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    const btnAccept = document.getElementById("consent-accept");
    const btnReject = document.getElementById("consent-reject");
    const btnConfigure = document.getElementById("consent-configure");

    btnAccept?.addEventListener("click", () => {
      save_preferences({
        essential: true,
        analytics: true,
        performance: true,
        marketing: true,
      });
      dismiss_banner();
    });

    btnReject?.addEventListener("click", () => {
      save_preferences({
        essential: true,
        analytics: false,
        performance: false,
        marketing: false,
      });
      dismiss_banner();
    });

    btnConfigure?.addEventListener("click", () => {
      open_preferences_modal();
    });
  }

  function dismiss_banner() {
    const el = document.getElementById("consent-banner");
    if (el) el.remove();
  }

  function open_preferences_modal() {
    let modal = document.getElementById("consent-modal");
    if (modal) return;

    const current = get_preferences() || {
      essential: true,
      analytics: false,
      performance: false,
      marketing: false,
    };

    modal = document.createElement("div");
    modal.id = "consent-modal";
    modal.className = "fixed inset-0 z-[70] flex items-end sm:items-center justify-center";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="absolute inset-0 bg-slate-900/40" aria-hidden="true"></div>
      <div class="relative bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        <div class="p-6">
          <h2 class="text-xl font-semibold text-dark-500 mb-1">Preferencias de privacidad</h2>
          <p class="text-sm text-slate-600 mb-4">Administra las categorías de cookies y tecnologías similares.</p>

          <div class="space-y-4">
            <label class="flex items-start gap-3">
              <input type="checkbox" checked disabled class="mt-1">
              <span>
                <span class="font-medium text-slate-800">Esenciales</span>
                <span class="block text-sm text-slate-600">Necesarias para el funcionamiento básico del sitio y la seguridad. Siempre activas.</span>
              </span>
            </label>

            <label class="flex items-start gap-3">
              <input id="consent-analytics" type="checkbox" class="mt-1" ${current.analytics ? "checked" : ""}>
              <span>
                <span class="font-medium text-slate-800">Analítica</span>
                <span class="block text-sm text-slate-600">Ayuda a entender el uso del sitio para mejorarlo.</span>
              </span>
            </label>

            <label class="flex items-start gap-3">
              <input id="consent-performance" type="checkbox" class="mt-1" ${current.performance ? "checked" : ""}>
              <span>
                <span class="font-medium text-slate-800">Rendimiento</span>
                <span class="block text-sm text-slate-600">Optimiza la velocidad y la experiencia del usuario.</span>
              </span>
            </label>

            <label class="flex items-start gap-3">
              <input id="consent-marketing" type="checkbox" class="mt-1" ${current.marketing ? "checked" : ""}>
              <span>
                <span class="font-medium text-slate-800">Marketing</span>
                <span class="block text-sm text-slate-600">Permite personalización y mensajes comerciales relevantes.</span>
              </span>
            </label>
          </div>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button id="consent-cancel" class="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">Cancelar</button>
            <button id="consent-save" class="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white">Guardar preferencias</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const onCancel = () => close_modal();
    const onSave = () => {
      const analytics = /** @type {HTMLInputElement|null} */ (document.getElementById("consent-analytics"));
      const performance = /** @type {HTMLInputElement|null} */ (document.getElementById("consent-performance"));
      const marketing = /** @type {HTMLInputElement|null} */ (document.getElementById("consent-marketing"));
      save_preferences({
        essential: true,
        analytics: !!(analytics && analytics.checked),
        performance: !!(performance && performance.checked),
        marketing: !!(marketing && marketing.checked),
      });
      close_modal();
      dismiss_banner();
    };

    document.getElementById("consent-cancel")?.addEventListener("click", onCancel);
    document.getElementById("consent-save")?.addEventListener("click", onSave);

    // Close on backdrop click
    modal.querySelector(".absolute.inset-0")?.addEventListener("click", onCancel);

    // Esc to close
    document.addEventListener("keydown", handle_escape_once, { once: true });
  }

  function handle_escape_once(e) {
    if (e && e.key === "Escape") {
      close_modal();
    }
  }

  function close_modal() {
    const modal = document.getElementById("consent-modal");
    if (modal) modal.remove();
  }
})();


