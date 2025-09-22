/**
 * Timeline Component
 * Creates beautiful vertical timelines with alternating content cards
 * Inspired by modern timeline designs with red circular nodes
 */

class Timeline {
  constructor(container, options = {}) {
    this.container =
      typeof container === "string"
        ? document.querySelector(container)
        : container;
    this.options = {
      nodeColor: "#5271ff", // Red color for nodes
      lineColor: "#e5e7eb", // Light gray for timeline line
      cardBackground: "#ffffff",
      cardBorder: "#e5e7eb",
      animationDuration: 300,
      staggerDelay: 100,
      ...options,
    };

    this.init();
  }

  init() {
    if (!this.container) {
      console.error("Timeline container not found");
      return;
    }

    this.createStyles();
    this.setupTimeline();
    this.addAnimations();
  }

  createStyles() {
    if (document.getElementById("timeline-styles")) return;

    const style = document.createElement("style");
    style.id = "timeline-styles";
    style.textContent = `
            .timeline-container {
                position: relative;
                max-width: 1200px;
                margin: 0 auto;
                padding: 2rem 0;
            }

            .timeline-line {
                position: absolute;
                left: 50%;
                top: 0;
                bottom: 0;
                width: 2px;
                background: ${this.options.lineColor};
                transform: translateX(-50%);
                z-index: 1;
            }

            .timeline-item {
                position: relative;
                margin-bottom: 4rem;
                opacity: 0;
                transform: translateY(30px);
                transition: all ${this.options.animationDuration}ms ease-out;
            }

            .timeline-item.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .timeline-node {
                position: absolute;
                left: 50%;
                top: 2rem;
                width: 16px;
                height: 16px;
                background: ${this.options.nodeColor};
                border-radius: 50%;
                transform: translateX(-50%);
                z-index: 2;
                box-shadow: 0 0 0 4px ${this.options.cardBackground}, 0 2px 8px rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            }

            .timeline-node:hover {
                transform: translateX(-50%) scale(1.2);
                box-shadow: 0 0 0 6px ${this.options.cardBackground}, 0 4px 12px rgba(0,0,0,0.15);
            }

            .timeline-card {
                position: relative;
                max-width: 45%;
                background: ${this.options.cardBackground};
                border: 1px solid ${this.options.cardBorder};
                border-radius: 12px;
                padding: 1.5rem;
                box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .timeline-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 8px 24px rgba(0,0,0,0.12);
            }

            .timeline-card.left {
                margin-right: auto;
                margin-left: 0;
            }

            .timeline-card.right {
                margin-left: auto;
                margin-right: 0;
            }

            .timeline-card::before {
                content: '';
                position: absolute;
                top: 1.5rem;
                width: 0;
                height: 0;
                border: 8px solid transparent;
            }

            .timeline-card.left::before {
                right: -16px;
                border-left-color: ${this.options.cardBackground};
                border-right: none;
            }

            .timeline-card.right::before {
                left: -16px;
                border-right-color: ${this.options.cardBackground};
                border-left: none;
            }

            .timeline-card-title {
                font-size: 1.25rem;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 0.5rem;
            }

            .timeline-card-description {
                color: #6b7280;
                line-height: 1.6;
                margin-bottom: 1rem;
            }

            .timeline-card-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .timeline-tag {
                background: #f3f4f6;
                color: #374151;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 500;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .timeline-line {
                    left: 2rem;
                }

                .timeline-node {
                    left: 2rem;
                }

                .timeline-card {
                    max-width: calc(100% - 4rem);
                    margin-left: 4rem !important;
                    margin-right: 0 !important;
                }

                .timeline-card::before {
                    left: -16px !important;
                    right: auto !important;
                    border-right-color: ${this.options.cardBackground} !important;
                    border-left: none !important;
                }
            }
        `;
    document.head.appendChild(style);
  }

  setupTimeline() {
    this.container.classList.add("timeline-container");

    // Create timeline line
    const line = document.createElement("div");
    line.className = "timeline-line";
    this.container.appendChild(line);
  }

  addItem(data, index = 0) {
    const item = document.createElement("div");
    item.className = "timeline-item";

    const isLeft = index % 2 === 0;

    item.innerHTML = `
            <div class="timeline-node"></div>
            <div class="timeline-card ${isLeft ? "left" : "right"}">
                <div class="timeline-card-title">${data.title}</div>
                <div class="timeline-card-description">${data.description}</div>
                ${
                  data.tags
                    ? `<div class="timeline-card-tags">${data.tags
                        .map(
                          (tag) => `<span class="timeline-tag">${tag}</span>`
                        )
                        .join("")}</div>`
                    : ""
                }
            </div>
        `;

    this.container.appendChild(item);

    // Add stagger animation
    setTimeout(() => {
      item.classList.add("visible");
    }, index * this.options.staggerDelay);

    return item;
  }

  addAnimations() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    // Observe all timeline items
    this.container.querySelectorAll(".timeline-item").forEach((item) => {
      observer.observe(item);
    });
  }

  // Method to add multiple items at once
  addItems(items) {
    items.forEach((item, index) => {
      this.addItem(item, index);
    });
  }

  // Method to clear timeline
  clear() {
    this.container.innerHTML = "";
    this.setupTimeline();
  }

  // Method to update options
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.clear();
    this.createStyles();
    this.setupTimeline();
  }
}

// Auto-initialize timelines with data-timeline attribute
document.addEventListener("DOMContentLoaded", function () {
  const timelineElements = document.querySelectorAll("[data-timeline]");

  timelineElements.forEach((element) => {
    const timeline = new Timeline(element);

    // If data is provided via data attribute, parse and add items
    const dataAttr = element.getAttribute("data-timeline-data");
    if (dataAttr) {
      try {
        const data = JSON.parse(dataAttr);
        timeline.addItems(data);
      } catch (e) {
        console.error("Invalid timeline data:", e);
      }
    }
  });
});

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = Timeline;
}
