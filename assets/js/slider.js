/*
  Accessible slider/carousel. Text/UI in Spanish; code in English.
  Usage (HTML example):
  <div class="slider" data-autoplay="true" data-interval="5000">
    <div class="slide">...</div>
    <div class="slide">...</div>
    <div class="slide">...</div>
  </div>
*/

(function () {
  class Slider {
    /**
     * @param {HTMLElement} root
     */
    constructor(root) {
      this.root = root;
      this.track = document.createElement("div");
      this.track.className = "slider-track";
      this.slides = Array.from(root.querySelectorAll(".slide"));
      this.currentIndex = 0;
      this.autoplay = root.getAttribute("data-autoplay") === "true";
      this.intervalMs = Number(root.getAttribute("data-interval") || 5000);
      this.timer = null;

      this.enhance_structure();
      this.bind_events();
      this.update_ui();

      if (this.autoplay) {
        this.start_autoplay();
      }
    }

    enhance_structure() {
      // Wrap slides in track
      this.slides.forEach((slide) => {
        this.track.appendChild(slide);
      });
      this.root.innerHTML = "";
      this.root.classList.add("relative", "overflow-hidden");
      this.root.setAttribute("role", "region");
      this.root.setAttribute("aria-roledescription", "carrusel");
      this.root.appendChild(this.track);

      // Controls
      this.prevBtn = document.createElement("button");
      this.prevBtn.className =
        "slider-prev absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-brand-600";
      this.prevBtn.setAttribute("aria-label", "Anterior");
      this.prevBtn.innerHTML = svg_chevron_left();

      this.nextBtn = document.createElement("button");
      this.nextBtn.className =
        "slider-next absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-800 rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-brand-600";
      this.nextBtn.setAttribute("aria-label", "Siguiente");
      this.nextBtn.innerHTML = svg_chevron_right();

      this.root.appendChild(this.prevBtn);
      this.root.appendChild(this.nextBtn);

      // Dots
      this.dotsWrap = document.createElement("div");
      this.dotsWrap.className =
        "slider-dots absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2";
      this.dots = this.slides.map((_, i) => {
        const dot = document.createElement("button");
        dot.className =
          "w-2.5 h-2.5 rounded-full bg-white/60 hover:bg-white focus:outline-none focus:ring-2 focus:ring-brand-600";
        dot.setAttribute("aria-label", `Ir al slide ${i + 1}`);
        dot.addEventListener("click", () => this.go_to(i));
        this.dotsWrap.appendChild(dot);
        return dot;
      });
      this.root.appendChild(this.dotsWrap);

      // Basic styles for track/slides (Tailwind-compatible classes)
      this.track.classList.add(
        "flex",
        "transition-transform",
        "duration-500",
        "ease-out"
      );
      this.slides.forEach((s) => s.classList.add("min-w-full", "shrink-0"));
    }

    bind_events() {
      this.prevBtn.addEventListener("click", () => this.prev());
      this.nextBtn.addEventListener("click", () => this.next());

      // Pause autoplay on hover/focus
      this.root.addEventListener("mouseenter", () => this.stop_autoplay());
      this.root.addEventListener("mouseleave", () => this.start_autoplay());
      this.root.addEventListener("focusin", () => this.stop_autoplay());
      this.root.addEventListener("focusout", () => this.start_autoplay());

      // Keyboard support
      this.root.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") this.prev();
        if (e.key === "ArrowRight") this.next();
      });

      // Resize handling
      window.addEventListener("resize", () => this.update_ui());
    }

    update_ui() {
      const offset = -this.currentIndex * this.root.clientWidth;
      this.track.style.transform = `translateX(${offset}px)`;
      this.dots.forEach((d, i) => {
        d.style.opacity = String(i === this.currentIndex ? 1 : 0.6);
      });
      // ARIA current slide
      this.slides.forEach((s, i) => {
        s.setAttribute(
          "aria-hidden",
          i === this.currentIndex ? "false" : "true"
        );
      });
    }

    prev() {
      this.currentIndex =
        (this.currentIndex - 1 + this.slides.length) % this.slides.length;
      this.update_ui();
    }

    next() {
      this.currentIndex = (this.currentIndex + 1) % this.slides.length;
      this.update_ui();
    }

    go_to(index) {
      this.currentIndex = Math.max(0, Math.min(index, this.slides.length - 1));
      this.update_ui();
    }

    start_autoplay() {
      if (!this.autoplay) return;
      this.stop_autoplay();
      this.timer = setInterval(() => this.next(), this.intervalMs);
    }

    stop_autoplay() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
  }

  function svg_chevron_left() {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>';
  }

  function svg_chevron_right() {
    return '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>';
  }

  // Auto-init sliders found on the page
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".slider").forEach((el) => {
      new Slider(el);
    });
  });
})();
