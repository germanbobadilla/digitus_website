// Process Timeline Animations
class ProcessTimeline {
  constructor() {
    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupProcessTabs();
    this.setupHoverEffects();
  }

  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateTimeline(entry.target);
        }
      });
    }, observerOptions);

    // Observe all process timelines
    document.querySelectorAll(".process-timeline").forEach((timeline) => {
      observer.observe(timeline);
    });
  }

  animateTimeline(timeline) {
    const steps = timeline.querySelectorAll(".process-step");
    const progressBar = timeline.querySelector(".progress-bar");

    // Reset animation
    steps.forEach((step) => {
      step.classList.remove("animate-in");
    });

    if (progressBar) {
      progressBar.style.width = "0%";
    }

    // Animate steps sequentially
    steps.forEach((step, index) => {
      setTimeout(() => {
        step.classList.add("animate-in");

        // Update progress bar
        if (progressBar) {
          const progress = ((index + 1) / steps.length) * 100;
          progressBar.style.width = `${progress}%`;
        }
      }, index * 300);
    });
  }

  setupProcessTabs() {
    const tabButtons = document.querySelectorAll(".process-tab");
    const processContent = document.querySelectorAll(".process-content");

    tabButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const targetProcess = button.dataset.process;

        // Remove active classes
        tabButtons.forEach((btn) => btn.classList.remove("active"));
        processContent.forEach((content) => content.classList.remove("active"));

        // Add active classes
        button.classList.add("active");
        document.getElementById(targetProcess).classList.add("active");

        // Reset and animate the new timeline
        setTimeout(() => {
          const newTimeline = document.querySelector(
            `#${targetProcess} .process-timeline`
          );
          if (newTimeline) {
            this.animateTimeline(newTimeline);
          }
        }, 100);
      });
    });
  }

  setupHoverEffects() {
    const processSteps = document.querySelectorAll(".process-step");

    processSteps.forEach((step) => {
      step.addEventListener("mouseenter", () => {
        step.classList.add("hover-effect");
      });

      step.addEventListener("mouseleave", () => {
        step.classList.remove("hover-effect");
      });
    });
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ProcessTimeline();
});

// Add CSS animations dynamically
const style = document.createElement("style");
style.textContent = `
    .process-step {
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .process-step.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .process-step.hover-effect {
        transform: translateY(-5px) scale(1.02);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }

    .progress-bar {
        transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .process-tab {
        transition: all 0.3s ease;
    }

    .process-tab.active {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(82, 113, 255, 0.3);
    }

    .process-content {
        display: none;
        animation: fadeInUp 0.6s ease;
    }

    .process-content.active {
        display: block;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .process-icon {
        transition: all 0.3s ease;
    }

    .process-step:hover .process-icon {
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
`;
document.head.appendChild(style);
