/*
  Dark Mode Toggle with Persistent Storage
  Handles theme switching and saves user preference
*/

class DarkMode {
  constructor() {
    this.theme = localStorage.getItem("theme") || "light";
    this.toggleButton = null;
    this.init();
  }

  init() {
    // Apply saved theme on page load
    this.applyTheme(this.theme);

    // Create toggle button
    this.createToggleButton();

    // Listen for system theme changes
    this.watchSystemTheme();
  }

  createToggleButton() {
    // Create the dark mode toggle button
    const toggleButton = document.createElement("button");
    toggleButton.id = "dark-mode-toggle";
    toggleButton.className =
      "fixed bottom-6 right-6 z-50 bg-slate-800 hover:bg-slate-900 dark:bg-slate-200 dark:hover:bg-slate-100 text-white dark:text-slate-800 p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110";
    toggleButton.setAttribute("aria-label", "Toggle dark mode");
    toggleButton.setAttribute("title", "Toggle dark mode");

    // Add the icon (sun/moon)
    toggleButton.innerHTML = `
      <svg class="w-6 h-6 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <svg class="w-6 h-6 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    `;

    // Add click event
    toggleButton.addEventListener("click", () => this.toggle());

    // Add to page
    document.body.appendChild(toggleButton);
    this.toggleButton = toggleButton;
  }

  toggle() {
    this.theme = this.theme === "light" ? "dark" : "light";
    this.applyTheme(this.theme);
    this.saveTheme(this.theme);
  }

  applyTheme(theme) {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Update button state
    if (this.toggleButton) {
      this.updateButtonState(theme);
    }
  }

  updateButtonState(theme) {
    const sunIcon = this.toggleButton.querySelector(".dark\\:hidden");
    const moonIcon = this.toggleButton.querySelector(".dark\\:block");

    if (theme === "dark") {
      sunIcon.classList.add("hidden");
      moonIcon.classList.remove("hidden");
    } else {
      sunIcon.classList.remove("hidden");
      moonIcon.classList.add("hidden");
    }
  }

  saveTheme(theme) {
    localStorage.setItem("theme", theme);
  }

  watchSystemTheme() {
    // Watch for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    mediaQuery.addEventListener("change", (e) => {
      // Only apply system theme if user hasn't manually set a preference
      if (!localStorage.getItem("theme")) {
        this.theme = e.matches ? "dark" : "light";
        this.applyTheme(this.theme);
      }
    });
  }

  // Public method to get current theme
  getCurrentTheme() {
    return this.theme;
  }

  // Public method to set theme programmatically
  setTheme(theme) {
    if (theme === "light" || theme === "dark") {
      this.theme = theme;
      this.applyTheme(this.theme);
      this.saveTheme(this.theme);
    }
  }
}

// Initialize dark mode when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.darkMode = new DarkMode();
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = DarkMode;
}
