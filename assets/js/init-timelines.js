/**
 * Initialize Timelines for Process Section
 * This file sets up the three timelines with their respective data
 */

document.addEventListener("DOMContentLoaded", function () {
  // SDLC Timeline Data
  const sdlcData = [
    {
      title: "Planificación & Análisis",
      description: "Definimos requisitos, alcance y arquitectura del sistema",
      tags: [
        "Gathering Requirements",
        "Technical Architecture",
        "Project Planning",
      ],
    },
    {
      title: "Diseño & Prototipado",
      description: "Creamos wireframes, mockups y prototipos interactivos",
      tags: ["UI/UX Design", "Database Design", "API Design"],
    },
    {
      title: "Desarrollo & Testing",
      description: "Implementación ágil con testing continuo y CI/CD",
      tags: ["Agile Development", "Unit Testing", "Integration Testing"],
    },
    {
      title: "Despliegue & Monitoreo",
      description:
        "Deploy automatizado con monitoreo y métricas en tiempo real",
      tags: ["CI/CD Pipeline", "Monitoring & Logs", "Performance Optimization"],
    },
  ];

  // ADDIE Timeline Data
  const addieData = [
    {
      title: "A - Análisis",
      description:
        "Identificamos necesidades de aprendizaje y audiencia objetivo",
      tags: ["Needs Assessment", "Learner Analysis", "Goal Definition"],
    },
    {
      title: "D - Diseño",
      description:
        "Estructuramos objetivos, contenido y estrategias de evaluación",
      tags: ["Learning Objectives", "Content Structure", "Assessment Strategy"],
    },
    {
      title: "D - Desarrollo",
      description: "Creamos materiales, actividades y recursos de aprendizaje",
      tags: [
        "Content Creation",
        "Interactive Activities",
        "Multimedia Resources",
      ],
    },
    {
      title: "I - Implementación",
      description: "Desplegamos y facilitamos la experiencia de aprendizaje",
      tags: ["Course Delivery", "Instructor Support", "Technical Support"],
    },
    {
      title: "E - Evaluación",
      description: "Medimos efectividad y recopilamos feedback para mejoras",
      tags: [
        "Learning Analytics",
        "Feedback Collection",
        "Continuous Improvement",
      ],
    },
  ];

  // Content Creation Timeline Data
  const contentData = [
    {
      title: "Estrategia & Planificación",
      description: "Definimos objetivos, audiencia y estrategia de contenido",
      tags: ["Content Strategy", "Audience Research", "Content Planning"],
    },
    {
      title: "Investigación & Recopilación",
      description: "Recopilamos información, recursos y referencias relevantes",
      tags: ["Research & Analysis", "Resource Gathering", "Expert Interviews"],
    },
    {
      title: "Creación & Desarrollo",
      description: "Desarrollamos contenido multimedia y recursos interactivos",
      tags: [
        "Content Writing",
        "Multimedia Production",
        "Interactive Elements",
      ],
    },
    {
      title: "Revisión & Optimización",
      description:
        "Revisamos, editamos y optimizamos el contenido para máxima efectividad",
      tags: ["Content Review", "Quality Assurance", "SEO Optimization"],
    },
    {
      title: "Publicación & Distribución",
      description:
        "Desplegamos el contenido y lo distribuimos a través de canales apropiados",
      tags: [
        "Content Publishing",
        "Multi-channel Distribution",
        "Performance Tracking",
      ],
    },
  ];

  // Initialize SDLC Timeline
  const sdlcTimeline = new Timeline("#sdlc-timeline", {
    nodeColor: "#5271ff", // Brand accent color
    lineColor: "#e5e7eb",
    cardBackground: "#ffffff",
    cardBorder: "#e5e7eb",
  });
  sdlcTimeline.addItems(sdlcData);

  // Initialize ADDIE Timeline
  const addieTimeline = new Timeline("#addie-timeline", {
    nodeColor: "#5271ff", // Brand accent color
    lineColor: "#e5e7eb",
    cardBackground: "#ffffff",
    cardBorder: "#e5e7eb",
  });
  addieTimeline.addItems(addieData);

  // Initialize Content Creation Timeline
  const contentTimeline = new Timeline("#content-timeline", {
    nodeColor: "#5271ff", // Brand accent color
    lineColor: "#e5e7eb",
    cardBackground: "#ffffff",
    cardBorder: "#e5e7eb",
  });
  contentTimeline.addItems(contentData);
});
