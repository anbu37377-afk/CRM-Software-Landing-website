"use strict";

const THEME_KEY = "pulsecrm_dashboard_theme";
const charts = {};

function restorePageScroll() {
  document.documentElement.style.removeProperty("overflow");
  document.documentElement.style.removeProperty("height");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("height");
}

function createId() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const state = {
  tasks: [
    { id: createId(), title: "Review Q1 enterprise pipeline", done: false },
    { id: createId(), title: "Finalize onboarding checklist", done: true },
    { id: createId(), title: "Follow up with Northwind sponsor", done: false }
  ],
  activity: [
    { name: "Daniel King", action: "launched nurture campaign for APAC", time: "6 min ago" },
    { name: "Alana Brooks", action: "closed renewal with WellnessWorks", time: "2 min ago" },
    { name: "Ravi Kapoor", action: "updated pipeline forecast for Q2", time: "12 min ago" }
  ]
};

window.addEventListener("DOMContentLoaded", () => {
  restorePageScroll();
  initTheme();
  initMenu();
  initMetrics();
  initCharts();
  initTasks();
  initActivityFeed();
});

function initTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  const theme = stored === "dark" ? "dark" : "light";
  setTheme(theme);

  document.querySelectorAll("[data-theme-toggle]").forEach((toggle) => {
    toggle.checked = theme === "dark";
    toggle.addEventListener("change", () => {
      setTheme(toggle.checked ? "dark" : "light");
      document.querySelectorAll("[data-theme-toggle]").forEach((el) => {
        el.checked = toggle.checked;
      });
      initCharts();
    });
  });
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function initMenu() {
  const openBtn = document.querySelector("[data-menu-toggle]");
  const closeBtn = document.querySelector("[data-menu-close]");
  const menu = document.getElementById("mobile-menu");
  const overlay = document.querySelector("[data-overlay]");

  if (!openBtn || !menu) return;

  menu.classList.remove("is-open");
  menu.setAttribute("aria-hidden", "true");
  overlay?.classList.remove("is-open");
  openBtn.setAttribute("aria-expanded", "false");
  restorePageScroll();

  const openMenu = () => {
    menu.classList.add("is-open");
    overlay?.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    openBtn.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    menu.classList.remove("is-open");
    overlay?.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    openBtn.setAttribute("aria-expanded", "false");
    restorePageScroll();
  };

  openBtn.addEventListener("click", openMenu);
  closeBtn?.addEventListener("click", closeMenu);
  overlay?.addEventListener("click", closeMenu);
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu.classList.contains("is-open")) {
      closeMenu();
    }
  });
}

function initMetrics() {
  document.querySelectorAll("[data-metric-target]").forEach((metric) => {
    const target = Number(metric.dataset.metricTarget || 0);
    const format = metric.dataset.metricFormat || "number";
    animateCounter(metric, target, format);
  });
}

function animateCounter(el, target, format) {
  const steps = 50;
  const duration = 1300;
  let current = 0;
  const stepValue = target / steps;
  const interval = duration / steps;

  const timer = setInterval(() => {
    current += stepValue;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = formatMetric(current, format);
  }, interval);
}

function formatMetric(value, format) {
  if (format === "currency") return `$${Math.round(value).toLocaleString()}`;
  if (format === "percent") return `${value.toFixed(1)}%`;
  return Math.round(value).toLocaleString();
}

function initCharts() {
  if (!window.Chart) return;

  Object.values(charts).forEach((chart) => chart.destroy());

  const styles = getComputedStyle(document.documentElement);
  const textColor = styles.getPropertyValue("--text").trim();
  const mutedColor = styles.getPropertyValue("--muted").trim();
  const gridColor = styles.getPropertyValue("--border").trim();

  const sharedScaleOptions = {
    ticks: { color: mutedColor, font: { size: 11 } },
    grid: { color: gridColor }
  };

  const sharedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    events: ["mousemove", "mouseout", "click", "touchstart"]
  };

  const sales = document.getElementById("salesChart");
  if (sales) {
    charts.sales = new Chart(sales, {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
        datasets: [
          {
            label: "Revenue ($K)",
            data: [72, 84, 79, 95, 104, 113, 126, 139],
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.14)",
            fill: true,
            tension: 0.34,
            borderWidth: 2.5,
            pointRadius: 2.5
          }
        ]
      },
      options: {
        ...sharedChartOptions,
        plugins: {
          legend: { display: false },
          tooltip: { mode: "index", intersect: false }
        },
        scales: {
          x: { ...sharedScaleOptions, grid: { display: false } },
          y: {
            ...sharedScaleOptions,
            ticks: {
              ...sharedScaleOptions.ticks,
              callback: (val) => `$${val}k`
            }
          }
        }
      }
    });
  }

  const pipeline = document.getElementById("pipelineChart");
  if (pipeline) {
    charts.pipeline = new Chart(pipeline, {
      type: "bar",
      data: {
        labels: ["Prospect", "Qualified", "Discovery", "Proposal", "Negotiation"],
        datasets: [
          {
            label: "Pipeline ($K)",
            data: [58, 74, 66, 82, 47],
            backgroundColor: "rgba(124, 58, 237, 0.68)",
            borderRadius: 8,
            borderSkipped: false
          }
        ]
      },
      options: {
        ...sharedChartOptions,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { ...sharedScaleOptions, grid: { display: false } },
          y: {
            ...sharedScaleOptions,
            ticks: {
              ...sharedScaleOptions.ticks,
              callback: (val) => `$${val}k`
            }
          }
        }
      }
    });
  }

  const lead = document.getElementById("leadChart");
  if (lead) {
    charts.lead = new Chart(lead, {
      type: "doughnut",
      data: {
        labels: ["Inbound", "Outbound", "Partners", "Events"],
        datasets: [
          {
            data: [42, 27, 18, 13],
            backgroundColor: ["#2563eb", "#06b6d4", "#7c3aed", "#f59e0b"],
            borderWidth: 0
          }
        ]
      },
      options: {
        ...sharedChartOptions,
        cutout: "63%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: textColor,
              usePointStyle: true,
              boxWidth: 10,
              boxHeight: 10,
              padding: 12
            }
          }
        }
      }
    });
  }
}

function initTasks() {
  const form = document.querySelector("[data-task-form]");
  const input = document.querySelector("[data-task-input]");
  const list = document.querySelector("[data-task-list]");
  if (!form || !input || !list) return;

  const render = () => {
    list.innerHTML = "";

    if (!state.tasks.length) {
      const empty = document.createElement("p");
      empty.textContent = "No tasks yet. Add your first task.";
      empty.style.color = "var(--muted)";
      empty.style.fontSize = "0.92rem";
      list.appendChild(empty);
      return;
    }

    state.tasks.forEach((task) => {
      const item = document.createElement("div");
      item.className = "crm-task-item";
      item.dataset.id = task.id;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.done;

      const label = document.createElement("span");
      label.textContent = task.title;
      if (task.done) {
        label.style.textDecoration = "line-through";
        label.style.color = "var(--muted)";
      }

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Delete";

      checkbox.addEventListener("change", () => {
        task.done = checkbox.checked;
        render();
      });

      remove.addEventListener("click", () => {
        state.tasks = state.tasks.filter((entry) => entry.id !== task.id);
        render();
      });

      item.append(checkbox, label, remove);
      list.appendChild(item);
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = input.value.trim();
    if (!title) return;

    state.tasks.unshift({ id: createId(), title, done: false });
    input.value = "";
    render();
  });

  render();
}

function initActivityFeed() {
  const list = document.querySelector("[data-activity-feed]");
  if (!list) return;

  const render = () => {
    list.innerHTML = "";

    state.activity.slice(0, 6).forEach((entry) => {
      const row = document.createElement("div");
      row.className = "crm-activity-item";
      row.innerHTML = `
        <div class="crm-activity-avatar" aria-hidden="true">${getInitials(entry.name)}</div>
        <div class="crm-activity-content">
          <strong>${entry.name}</strong>
          <p>${entry.action}</p>
          <time>${entry.time}</time>
        </div>
      `;
      list.appendChild(row);
    });
  };

  render();

  const updates = [
    { name: "Maya Alvarez", action: "shared Q2 performance review", time: "just now" },
    { name: "Priya Desai", action: "advanced FinEdge to proposal stage", time: "1 min ago" },
    { name: "Jamie Chen", action: "added notes to enterprise account", time: "3 min ago" },
    { name: "Alex Morgan", action: "updated renewal health score", time: "5 min ago" }
  ];

  setInterval(() => {
    const next = updates[Math.floor(Math.random() * updates.length)];
    state.activity.unshift(next);
    if (state.activity.length > 12) state.activity.pop();
    render();
  }, 7000);
}

function getInitials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
}

