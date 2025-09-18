/*
  App bootstrap. All identifiers are in English; UI text remains Spanish.
*/

document.addEventListener("DOMContentLoaded", () => {
  init_mobile_menu();
  init_smooth_scroll();
  init_contact_form();
  set_current_year();
});

function init_mobile_menu() {
  const button = document.getElementById("mobile-menu-button");
  const menu = document.getElementById("mobile-menu");
  if (!button || !menu) return;
  button.addEventListener("click", () => {
    menu.classList.toggle("hidden");
  });
}

function init_smooth_scroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener("click", (e) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      const mobileMenu = document.getElementById("mobile-menu");
      if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
        mobileMenu.classList.add("hidden");
      }
    });
  });
}

function init_contact_form() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Enviando…";
    status.classList.remove("text-red-600");
    status.classList.add("text-slate-600");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Basic validation
    if (!payload.name || !payload.email || !payload.message) {
      status.textContent = "Por favor completa los campos requeridos.";
      status.classList.remove("text-slate-600");
      status.classList.add("text-red-600");
      return;
    }

    try {
      // Demo: simulate async submit
      await new Promise((resolve) => setTimeout(resolve, 800));
      status.textContent = "Gracias. Te contactaremos en breve.";
      form.reset();
    } catch (err) {
      status.textContent = "Ocurrió un error. Intenta nuevamente.";
      status.classList.remove("text-slate-600");
      status.classList.add("text-red-600");
    }
  });
}

function set_current_year() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}
