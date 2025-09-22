/*
  App bootstrap. All identifiers are in English; UI text remains Spanish.
*/

document.addEventListener("DOMContentLoaded", () => {
  init_mobile_menu();
  init_smooth_scroll();
  init_contact_form();
  set_current_year();
  init_design_parallax();
  init_enhanced_animations();
  init_interactive_elements();
  init_ripple_effects();
  init_scroll_effects();
  init_contact_modal();
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
  // Handle both original form and modal form
  const forms = document.querySelectorAll("#contact-form");
  forms.forEach((form) => {
    const status =
      form.querySelector("#form-status") ||
      form.querySelector("#modal-form-status");
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
        const subject = encodeURIComponent(
          `Consulta desde Digitus.com.do - ${payload.name}`
        );
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
          status.textContent =
            "Email preparado. Si no se abrió tu cliente de email, por favor envíanos un email a info@digitus.com.do";
          status.classList.remove("text-slate-600");
          status.classList.add("text-green-600");
        }, 1000);
      } catch (err) {
        status.textContent =
          "Error al preparar el email. Por favor contacta a info@digitus.com.do directamente.";
        status.classList.remove("text-slate-600");
        status.classList.add("text-red-600");
        status.setAttribute("aria-live", "assertive");
      }
    });
  });
}

function set_current_year() {
  const el = document.getElementById("year");
  if (el) el.textContent = String(new Date().getFullYear());
}

// Subtle parallax for the Diseño web section background
function init_design_parallax() {
  const designSection = document.getElementById("design");
  if (!designSection) return;
  const onScroll = () => {
    const rect = designSection.getBoundingClientRect();
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;
    // Progress from 0 (below viewport) to 1 (fully above), clamp 0..1
    const visible = Math.max(0, Math.min(1, 1 - rect.top / viewportH));
    // Move background slightly based on scroll progress
    const offset = Math.round((visible - 0.5) * 20); // -10px .. +10px
    designSection.style.setProperty("--parallax-y", `${offset}px`);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// Enhanced animations inspired by marketing folder
function init_enhanced_animations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade-in-up");

        // Add staggered animation for grid items
        if (
          entry.target.classList.contains("service-card") ||
          entry.target.classList.contains("modern-card")
        ) {
          const siblings = Array.from(entry.target.parentNode.children);
          const index = siblings.indexOf(entry.target);
          entry.target.style.animationDelay = `${index * 0.1}s`;
        }
      }
    });
  }, observerOptions);

  // Observe elements for animation
  const animatedElements = document.querySelectorAll(
    ".service-card, .modern-card, .stat-item, .card"
  );
  animatedElements.forEach((el) => observer.observe(el));
}

// Interactive elements with hover effects
function init_interactive_elements() {
  // Add hover effects to cards
  const cards = document.querySelectorAll(".service-card, .card, .modern-card");

  cards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-8px) scale(1.02)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
    });
  });
}

// Ripple effects for buttons
function init_ripple_effects() {
  const buttons = document.querySelectorAll(".btn, .modern-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", function (e) {
      const ripple = document.createElement("span");
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;

      this.style.position = "relative";
      this.style.overflow = "hidden";
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Add CSS for ripple animation
  if (!document.querySelector("#ripple-styles")) {
    const style = document.createElement("style");
    style.id = "ripple-styles";
    style.textContent = `
      @keyframes ripple {
        to {
          transform: scale(4);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Enhanced scroll effects
function init_scroll_effects() {
  const navbar = document.querySelector("header");

  window.addEventListener("scroll", function () {
    if (window.scrollY > 100) {
      navbar.classList.add("scrolled");
    } else {
      navbar.classList.remove("scrolled");
    }
  });
}

// Contact Modal functionality
function init_contact_modal() {
  const openButton = document.getElementById("open-contact-modal");
  const closeButton = document.getElementById("close-contact-modal");
  const modal = document.getElementById("contact-modal");

  if (!openButton || !closeButton || !modal) return;

  // Open modal
  openButton.addEventListener("click", () => {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.style.overflow = "hidden"; // Prevent background scrolling
  });

  // Close modal
  closeButton.addEventListener("click", () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.style.overflow = ""; // Restore scrolling
  });

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = ""; // Restore scrolling
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      document.body.style.overflow = ""; // Restore scrolling
    }
  });
}
