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
    const isExpanded = button.getAttribute("aria-expanded") === "true";
    menu.classList.toggle("hidden");
    button.setAttribute("aria-expanded", !isExpanded);
    button.setAttribute(
      "aria-label",
      isExpanded ? "Abrir menú" : "Cerrar menú"
    );
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "Preparando email...";
    status.classList.remove("text-red-600");
    status.classList.add("text-slate-600");
    status.setAttribute("aria-live", "polite");

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Basic validation
    if (!payload.name || !payload.email || !payload.message) {
      status.textContent = "Por favor completa los campos requeridos.";
      status.classList.remove("text-slate-600");
      status.classList.add("text-red-600");
      status.setAttribute("aria-live", "assertive");
      return;
    }

    try {
      // Create mailto link with pre-filled content
      const subject = encodeURIComponent(`Consulta desde Digitus.com.do - ${payload.name}`);
      const body = encodeURIComponent(
        `Hola Digitus,\n\n` +
        `Mi nombre es: ${payload.name}\n` +
        `Mi email es: ${payload.email}\n\n` +
        `Mensaje:\n${payload.message}\n\n` +
        `Saludos,\n${payload.name}`
      );
      
      const mailtoLink = `mailto:info@digitus.com.do?subject=${subject}&body=${body}`;
      
      // Open email client
      window.location.href = mailtoLink;
      
      // Update status
      status.textContent = "Abriendo tu cliente de email...";
      status.setAttribute("aria-live", "polite");
      
      // Reset form after a short delay
      setTimeout(() => {
        form.reset();
        status.textContent = "Email preparado. Si no se abrió tu cliente de email, por favor envíanos un email a info@digitus.com.do";
        status.classList.remove("text-slate-600");
        status.classList.add("text-green-600");
      }, 1000);
      
    } catch (err) {
      status.textContent = "Error al preparar el email. Por favor contacta a info@digitus.com.do directamente.";
      status.classList.remove("text-slate-600");
      status.classList.add("text-red-600");
      status.setAttribute("aria-live", "assertive");
    }
  });
}

function set_current_year() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}
