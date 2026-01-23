'use strict';

const charts = {};
let tasks = [];
let contacts = [];
let activityQueue = [];
let feedInterval;

window.addEventListener('DOMContentLoaded', () => {
  initMetrics();
  initCharts();
  initTasks();
  initContacts();
  initPipelineDrag();
  initActivityFeed();
  bindTopbarActions();
});

function initMetrics() {
  document.querySelectorAll('[data-metric-target]').forEach((metric) => {
    const target = Number(metric.dataset.metricTarget || 0);
    const formatter = metric.dataset.metricFormat || 'number';
    animateCounter(metric, target, formatter);
  });
}

function animateCounter(element, target, format = 'number') {
  let current = 0;
  const duration = 1500;
  const steps = 60;
  const increment = target / steps;
  const interval = duration / steps;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    element.textContent = formatValue(current, format);
  }, interval);
}

function formatValue(value, format) {
  if (format === 'currency') {
    return `$${Math.round(value).toLocaleString()}`;
  }
  if (format === 'percent') {
    return `${value.toFixed(1)}%`;
  }
  if (format === 'decimal') {
    return value.toFixed(1);
  }
  return Math.round(value).toLocaleString();
}

function initCharts() {
  if (!window.Chart) return;

  const salesCtx = document.getElementById('salesChart');
  if (salesCtx) {
    charts.sales = new Chart(salesCtx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [
          {
            label: 'Closed Won',
            data: [72, 84, 79, 95, 104, 112, 123, 139],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.14)',
            tension: 0.38,
            fill: true,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            grid: { color: 'rgba(148, 163, 184, 0.15)' },
            ticks: {
              callback: (value) => `$${value}k`
            }
          }
        }
      }
    });
  }

  const pipelineCtx = document.getElementById('pipelineChart');
  if (pipelineCtx) {
    charts.pipeline = new Chart(pipelineCtx, {
      type: 'bar',
      data: {
        labels: ['Prospect', 'Qualified', 'Discovery', 'Proposal', 'Negotiation', 'Closed'],
        datasets: [
          {
            label: 'Pipeline ($K)',
            data: [58, 74, 66, 82, 45, 96],
            backgroundColor: 'rgba(124, 58, 237, 0.6)',
            borderRadius: 10,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: {
            grid: { color: 'rgba(148, 163, 184, 0.12)' },
            ticks: { callback: (value) => `$${value}k` }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  const leadCtx = document.getElementById('leadChart');
  if (leadCtx) {
    charts.leads = new Chart(leadCtx, {
      type: 'doughnut',
      data: {
        labels: ['Inbound', 'Outbound', 'Partners', 'Events'],
        datasets: [
          {
            data: [42, 27, 18, 13],
            backgroundColor: ['#2563eb', '#22d3ee', '#7c3aed', '#f59e0b'],
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }
}

function initTasks() {
  const tasksContainer = document.querySelector('[data-task-list]');
  const taskForm = document.querySelector('[data-task-form]');
  const taskInput = document.querySelector('[data-task-input]');

  if (!tasksContainer || !taskForm || !taskInput) return;

  tasks = [
    { id: crypto.randomUUID(), name: 'Review Q1 enterprise pipeline', completed: false },
    { id: crypto.randomUUID(), name: 'Update onboarding playbook for beta cohort', completed: true },
    { id: crypto.randomUUID(), name: 'Send follow-up to Northwind exec sponsor', completed: false }
  ];

  renderTasks(tasksContainer);

  taskForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = taskInput.value.trim();
    if (!name) return;

    tasks.unshift({ id: crypto.randomUUID(), name, completed: false });
    renderTasks(tasksContainer);
    taskInput.value = '';
    taskInput.focus();
  });
}

function renderTasks(container) {
  container.innerHTML = '';
  if (!tasks.length) {
    container.innerHTML = '<p class="text-muted">No tasks yet. Add your first task.</p>';
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.setAttribute('data-task-id', task.id);

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTaskComplete(task.id));

    const label = document.createElement('span');
    label.textContent = task.name;
    if (task.completed) {
      label.style.textDecoration = 'line-through';
      label.style.color = 'var(--color-muted)';
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-ghost';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    item.append(checkbox, label, deleteBtn);
    container.appendChild(item);
  });
}

function toggleTaskComplete(id) {
  tasks = tasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task));
  renderTasks(document.querySelector('[data-task-list]'));
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  renderTasks(document.querySelector('[data-task-list]'));
}

function initContacts() {
  const tableBody = document.querySelector('[data-contacts-body]');
  if (!tableBody) return;

  contacts = [
    { id: 1, name: 'Jamie Chen', company: 'Luma Studios', email: 'jamie@lumastudios.com', stage: 'Proposal', value: 58000, lastActivity: '2h ago' },
    { id: 2, name: 'Malik Rivers', company: 'Northwind Cloud', email: 'malik@northwind.io', stage: 'Discovery', value: 42000, lastActivity: '1d ago' },
    { id: 3, name: 'Sofia Patel', company: 'Brightline Logistics', email: 'sofia@brightline.io', stage: 'Negotiation', value: 76000, lastActivity: '3h ago' },
    { id: 4, name: 'Lena Ortiz', company: 'Horizon AI', email: 'lena@horizon.ai', stage: 'Qualified', value: 32000, lastActivity: '5h ago' },
    { id: 5, name: 'Priya Desai', company: 'FinEdge', email: 'priya@finedge.com', stage: 'Proposal', value: 54000, lastActivity: '8h ago' },
    { id: 6, name: 'Alex Morgan', company: 'Atlas Robotics', email: 'alex@atlasrobotics.com', stage: 'Discovery', value: 28000, lastActivity: '1d ago' },
    { id: 7, name: 'Haruto Sato', company: 'ZenSpace', email: 'haruto@zenspace.jp', stage: 'Negotiation', value: 91000, lastActivity: '30m ago' }
  ];

  const searchInput = document.querySelector('[data-contacts-search]');
  const sortButtons = document.querySelectorAll('[data-sort-key]');
  const prevBtn = document.querySelector('[data-contacts-prev]');
  const nextBtn = document.querySelector('[data-contacts-next]');
  const pageIndicator = document.querySelector('[data-contacts-page]');

  const state = {
    query: '',
    sortKey: 'name',
    sortDir: 'asc',
    page: 1,
    pageSize: 5
  };

  const applyState = () => {
    let filtered = contacts.filter((contact) => {
      const haystack = `${contact.name} ${contact.company} ${contact.email} ${contact.stage}`.toLowerCase();
      return haystack.includes(state.query.toLowerCase());
    });

    filtered = filtered.sort((a, b) => {
      const valueA = a[state.sortKey];
      const valueB = b[state.sortKey];

      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return state.sortDir === 'asc' ? valueA - valueB : valueB - valueA;
      }
      return state.sortDir === 'asc'
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });

    const totalPages = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    state.page = Math.min(state.page, totalPages);
    const start = (state.page - 1) * state.pageSize;
    const pageItems = filtered.slice(start, start + state.pageSize);

    renderContacts(tableBody, pageItems);
    pageIndicator.textContent = `${state.page} / ${totalPages}`;
    prevBtn.disabled = state.page === 1;
    nextBtn.disabled = state.page === totalPages;
  };

  searchInput?.addEventListener('input', (event) => {
    state.query = event.target.value;
    state.page = 1;
    applyState();
  });

  sortButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.sortKey;
      if (state.sortKey === key) {
        state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        state.sortKey = key;
        state.sortDir = 'asc';
      }
      sortButtons.forEach((btn) => btn.setAttribute('aria-sort', 'none'));
      button.setAttribute('aria-sort', state.sortDir === 'asc' ? 'ascending' : 'descending');
      applyState();
    });
  });

  prevBtn?.addEventListener('click', () => {
    state.page = Math.max(1, state.page - 1);
    applyState();
  });

  nextBtn?.addEventListener('click', () => {
    state.page += 1;
    applyState();
  });

  applyState();
}

function renderContacts(container, items) {
  container.innerHTML = '';
  items.forEach((contact) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div class="media-object">
          <img src="https://i.pravatar.cc/60?u=${encodeURIComponent(contact.email)}" alt="Avatar of ${contact.name}">
          <div>
            <strong>${contact.name}</strong>
            <p class="text-muted">${contact.email}</p>
          </div>
        </div>
      </td>
      <td>${contact.company}</td>
      <td>${contact.stage}</td>
      <td>$${contact.value.toLocaleString()}</td>
      <td>${contact.lastActivity}</td>
      <td>
        <div class="table-actions">
          <button type="button" aria-label="View ${contact.name}"><i class="fa-regular fa-eye"></i></button>
          <button type="button" aria-label="Message ${contact.name}"><i class="fa-regular fa-paper-plane"></i></button>
        </div>
      </td>
    `;
    container.appendChild(row);
  });
}

function initPipelineDrag() {
  const cards = document.querySelectorAll('[data-pipeline-card]');
  const columns = document.querySelectorAll('[data-pipeline-column]');
  if (!cards.length || !columns.length) return;

  let draggedCard = null;

  cards.forEach((card) => {
    card.setAttribute('draggable', 'true');
    card.addEventListener('dragstart', (event) => {
      draggedCard = event.currentTarget;
      event.dataTransfer.effectAllowed = 'move';
      setTimeout(() => draggedCard.classList.add('dragging'), 0);
    });

    card.addEventListener('dragend', () => {
      if (draggedCard) {
        draggedCard.classList.remove('dragging');
        draggedCard = null;
      }
    });
  });

  columns.forEach((column) => {
    column.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });

    column.addEventListener('drop', () => {
      if (draggedCard) {
        column.appendChild(draggedCard);
      }
    });
  });
}

function initActivityFeed() {
  const feedContainer = document.querySelector('[data-activity-feed]');
  if (!feedContainer) return;

  activityQueue = [
    { name: 'Jamie Chen', action: 'logged call with Northwind Cloud', time: 'Just now' },
    { name: 'Haruto Sato', action: 'updated stage for ZenSpace', time: '5 min ago' },
    { name: 'Priya Desai', action: 'added expansion opportunity', time: '12 min ago' },
    { name: 'Maya Alvarez', action: 'shared Q2 pipeline review deck', time: '20 min ago' }
  ];

  const renderFeed = () => {
    feedContainer.innerHTML = '';
    activityQueue.slice(0, 6).forEach((entry) => {
      const item = document.createElement('div');
      item.className = 'feed-item';
      item.innerHTML = `
        <div class="icon-circle"><i class="fa-solid fa-bolt"></i></div>
        <div>
          <strong>${entry.name}</strong>
          <p class="text-muted">${entry.action}</p>
          <time>${entry.time}</time>
        </div>
      `;
      feedContainer.appendChild(item);
    });
  };

  renderFeed();

  if (feedInterval) clearInterval(feedInterval);
  feedInterval = setInterval(() => {
    const templates = [
      { name: 'Ravi Kapoor', action: 'deployed automation recipe to production', time: 'moments ago' },
      { name: 'Alana Brooks', action: 'closed renewal with WellnessWorks', time: '2 min ago' },
      { name: 'Daniel King', action: 'launched nurture campaign for APAC', time: '6 min ago' },
      { name: 'Alex Morgan', action: 'commented on enterprise pipeline board', time: '9 min ago' }
    ];
    const update = templates[Math.floor(Math.random() * templates.length)];
    activityQueue.unshift(update);
    if (activityQueue.length > 12) activityQueue.pop();
    renderFeed();
  }, 7000);
}

function bindTopbarActions() {
  const sidebarToggle = document.querySelector('[data-sidebar-toggle]');
  const sidebar = document.querySelector('[data-sidebar]');

  sidebarToggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
  });
}
