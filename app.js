/**
 * ReturnPulse - Return Deadline & Confirmation Manager
 * INSY 3331 Group 8 - Artificial Intelligence for Business
 */

const STORAGE_KEY = 'returnpulse_items_v1';
const THEME_KEY = 'returnpulse_theme';

// Default Sample Items
const SAMPLE_ITEMS = [
  {
    id: 'sample-1',
    name: 'Sony WH-1000XM5 Noise Canceling Headphones',
    store: 'Apple',
    category: 'Electronics',
    price: 399.99,
    purchaseDate: getOffsetDateString(-12),
    windowDays: 14,
    deadlineDate: getOffsetDateString(2), // 2 days left -> URGENT!
    orderId: 'W1092837482',
    method: 'In-Store Drop-off',
    status: 'ACTIVE', // ACTIVE, PROCESSING, CONFIRMED, KEPT, EXPIRED
    notes: 'Testing battery life. Need to decide this weekend.',
    returnDetails: null
  },
  {
    id: 'sample-2',
    name: 'Nike Pegasus 41 Running Shoes (Size 10.5)',
    store: 'Nike',
    category: 'Clothing',
    price: 140.00,
    purchaseDate: getOffsetDateString(-10),
    windowDays: 60,
    deadlineDate: getOffsetDateString(50),
    orderId: 'NK-8829104',
    method: 'UPS / FedEx Drop-off',
    status: 'ACTIVE',
    notes: 'Great fit so far. 60-day return window gives plenty of time to test run.',
    returnDetails: null
  },
  {
    id: 'sample-3',
    name: 'Keurig K-Elite Single-Serve Coffee Maker',
    store: 'Target',
    category: 'Home',
    price: 119.99,
    purchaseDate: getOffsetDateString(-20),
    windowDays: 90,
    deadlineDate: getOffsetDateString(70),
    orderId: 'TGT-992144810',
    method: 'UPS / FedEx Drop-off',
    status: 'PROCESSING',
    notes: 'Reservoir leaked. Dropped off at UPS on Friday.',
    returnDetails: {
      rmaCode: 'RMA-TGT-55410',
      dropDate: getOffsetDateString(-2),
      carrier: 'The UPS Store #4218',
      trackingNo: '1Z9999999999999999',
      refundAmount: 119.99,
      refundMethod: 'Original Payment Method',
      notes: 'Handed to counter associate, tracking shows in transit.'
    }
  },
  {
    id: 'sample-4',
    name: 'Columbia Waterproof Hooded Rain Jacket',
    store: 'Amazon',
    category: 'Clothing',
    price: 89.95,
    purchaseDate: getOffsetDateString(-35),
    windowDays: 30,
    deadlineDate: getOffsetDateString(-5),
    orderId: '114-7281940-2219401',
    method: 'Amazon Locker / Whole Foods',
    status: 'CONFIRMED',
    notes: 'Sleeves were too long. Dropped off at Whole Foods drop-box.',
    returnDetails: {
      rmaCode: 'AMZ-RET-881902',
      dropDate: getOffsetDateString(-8),
      carrier: 'Whole Foods Counter',
      trackingNo: 'AMZ994821',
      refundAmount: 89.95,
      refundMethod: 'Original Payment Method',
      notes: 'Full refund credited to Chase Visa credit card on file.'
    }
  },
  {
    id: 'sample-5',
    name: 'Logitech MX Master 3S Ergonomic Mouse',
    store: 'Best Buy',
    category: 'Electronics',
    price: 99.99,
    purchaseDate: getOffsetDateString(-25),
    windowDays: 15,
    deadlineDate: getOffsetDateString(-10),
    orderId: 'BBY01-88492019',
    method: 'In-Store Drop-off',
    status: 'EXPIRED',
    notes: 'Forgot to return before the 15-day Best Buy window passed.',
    returnDetails: null
  }
];

// Retailer Knowledge Base (INSY 3331 AI Advisor)
const RETAILER_POLICIES = {
  'Amazon': {
    days: 30,
    details: 'Standard 30-day return window from receipt. Drop-off free at Whole Foods, Kohl\'s, or UPS Stores without printing labels or boxes. Holiday return window applies for items bought Nov 1 - Dec 31 (returnable until Jan 31).'
  },
  'Apple': {
    days: 14,
    details: 'Strict 14 calendar days from receipt to initiate return. Products must be in original condition with all cords, adapters, and packaging. No restocking fees for retail purchases.'
  },
  'Target': {
    days: 90,
    details: 'Standard 90-day return window for unopened items. +30 extra days if paid with Target Circle Card. Target owned brands have a 1-year guarantee with receipt.'
  },
  'Best Buy': {
    days: 15,
    details: 'Standard window is 15 days for general customers. My Best Buy Plus/Total members get 60 days. Open-box items can be returned within standard window. Restocking fee may apply on activated cellphones or drones.'
  },
  'Walmart': {
    days: 90,
    details: 'Standard 90 days for most items. Note: Consumer electronics, laptops, and tablets are restricted to 30 days. In-store or carrier pickup available.'
  },
  'Costco': {
    days: 90,
    details: 'Costco offers 100% satisfaction guarantee with virtually no deadline on most goods. Exception: Electronics, TVs, computers, and appliances must be returned within 90 days.'
  },
  'Nike': {
    days: 60,
    details: 'Nike allows 60 days to test shoes and apparel out in real life ("Give them a 60-day trial run"). You can return even after wearing them for a full refund.'
  },
  'Zara': {
    days: 30,
    details: '30 days from shipping confirmation date. Garments must have all tags intact and be unwashed. Online mail-in returns may incur a small return shipping deduction unless returned at physical store.'
  }
};

// Application State
let items = [];
let currentFilter = 'ALL';
let currentStoreFilter = 'ALL';
let currentSort = 'deadline-asc';
let currentSearch = '';
let currentView = 'grid'; // 'grid' | 'table'

// Helper: Calculate offset date string (YYYY-MM-DD)
function getOffsetDateString(daysOffset) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

// Helper: Calculate days remaining
function getDaysRemaining(deadlineStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(deadlineStr + 'T00:00:00');
  const diffTime = deadline - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper: Format Date
function formatDate(dateStr) {
  if (!dateStr) return '--';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
}

// Helper: Format Currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadData();
  setupEventListeners();
  renderApp();
  checkNotificationStatus();
});

// Load Data from LocalStorage
function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      items = JSON.parse(stored);
    } catch (e) {
      console.error('Failed to parse stored items', e);
      items = [...SAMPLE_ITEMS];
    }
  } else {
    items = [...SAMPLE_ITEMS];
    saveData();
  }
}

// Save Data to LocalStorage
function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Initialize Theme
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Theme Toggle
  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    lucide.createIcons();
  });

  // Notifications Request
  document.getElementById('btn-request-notifications').addEventListener('click', requestNotificationPermission);

  // Add Item Modal
  document.getElementById('btn-add-item').addEventListener('click', () => openItemModal());
  document.getElementById('modal-item-close').addEventListener('click', closeItemModal);
  document.getElementById('modal-item-cancel').addEventListener('click', closeItemModal);
  document.getElementById('form-item').addEventListener('submit', handleSaveItem);

  // Confirm Return Modal
  document.getElementById('modal-confirm-close').addEventListener('click', closeConfirmModal);
  document.getElementById('modal-confirm-cancel').addEventListener('click', closeConfirmModal);
  document.getElementById('form-confirm-return').addEventListener('submit', handleConfirmReturnSubmit);
  document.getElementById('btn-print-receipt-slip').addEventListener('click', printReceiptSlip);

  // AI Assistant Modal
  document.getElementById('btn-ai-helper').addEventListener('click', openAiModal);
  document.getElementById('modal-ai-close').addEventListener('click', closeAiModal);
  document.getElementById('btn-generate-ai-note').addEventListener('click', generateAiReturnNote);

  // Search & Filter
  document.getElementById('search-input').addEventListener('input', (e) => {
    currentSearch = e.target.value.toLowerCase();
    renderItems();
  });

  document.getElementById('filter-store').addEventListener('change', (e) => {
    currentStoreFilter = e.target.value;
    renderItems();
  });

  document.getElementById('sort-by').addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderItems();
  });

  // Status Filter Pills
  document.querySelectorAll('.status-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-pill').forEach(b => {
        b.classList.remove('bg-slate-900', 'text-white', 'dark:bg-white', 'dark:text-slate-900');
        b.classList.add('bg-slate-100', 'text-slate-700', 'dark:bg-slate-700/60', 'dark:text-slate-300');
      });
      btn.classList.add('bg-slate-900', 'text-white', 'dark:bg-white', 'dark:text-slate-900');
      btn.classList.remove('bg-slate-100', 'text-slate-700', 'dark:bg-slate-700/60', 'dark:text-slate-300');
      currentFilter = btn.dataset.status;
      renderItems();
    });
  });

  // View Switcher (Grid vs Table)
  document.getElementById('view-grid-btn').addEventListener('click', () => setView('grid'));
  document.getElementById('view-table-btn').addEventListener('click', () => setView('table'));

  // Store Preset Buttons in Item Modal
  document.querySelectorAll('.store-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const store = btn.dataset.store;
      const days = parseInt(btn.dataset.days);
      document.getElementById('item-store').value = store;
      document.getElementById('item-window-days').value = days;
      recalculateDeadlinesFromWindow();
    });
  });

  // Date calculation interactions in modal
  document.getElementById('item-purchase-date').addEventListener('change', recalculateDeadlinesFromWindow);
  document.getElementById('item-window-days').addEventListener('input', recalculateDeadlinesFromWindow);
  document.getElementById('item-deadline-date').addEventListener('change', recalculateWindowFromDeadline);

  // Demo Reset & Load
  document.getElementById('btn-reset-demo').addEventListener('click', () => {
    if (confirm('Reset to standard INSY 3331 Group 8 sample items?')) {
      items = [...SAMPLE_ITEMS];
      saveData();
      renderApp();
      showToast('Sample data reset successfully!', 'success');
    }
  });

  document.getElementById('btn-load-sample')?.addEventListener('click', () => {
    items = [...SAMPLE_ITEMS];
    saveData();
    renderApp();
    showToast('Loaded sample data!', 'success');
  });
}

// Date calculation helpers in form
function recalculateDeadlinesFromWindow() {
  const purchaseDateStr = document.getElementById('item-purchase-date').value;
  const days = parseInt(document.getElementById('item-window-days').value) || 30;
  if (purchaseDateStr) {
    const pDate = new Date(purchaseDateStr + 'T00:00:00');
    pDate.setDate(pDate.getDate() + days);
    document.getElementById('item-deadline-date').value = pDate.toISOString().split('T')[0];
  }
}

function recalculateWindowFromDeadline() {
  const purchaseDateStr = document.getElementById('item-purchase-date').value;
  const deadlineStr = document.getElementById('item-deadline-date').value;
  if (purchaseDateStr && deadlineStr) {
    const pDate = new Date(purchaseDateStr + 'T00:00:00');
    const dDate = new Date(deadlineStr + 'T00:00:00');
    const diffDays = Math.round((dDate - pDate) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      document.getElementById('item-window-days').value = diffDays;
    }
  }
}

// Switch between Grid and Table View
function setView(view) {
  currentView = view;
  const gridContainer = document.getElementById('items-grid');
  const tableWrapper = document.getElementById('items-table-wrapper');
  const gridBtn = document.getElementById('view-grid-btn');
  const tableBtn = document.getElementById('view-table-btn');

  if (view === 'grid') {
    gridContainer.classList.remove('hidden');
    tableWrapper.classList.add('hidden');
    gridBtn.className = 'p-1.5 rounded text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-xs';
    tableBtn.className = 'p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200';
  } else {
    gridContainer.classList.add('hidden');
    tableWrapper.classList.remove('hidden');
    tableBtn.className = 'p-1.5 rounded text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-xs';
    gridBtn.className = 'p-1.5 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200';
  }
}

// Render entire application
function renderApp() {
  renderKPIs();
  renderItems();
  updateUrgentBanner();
  lucide.createIcons();
}

// Calculate and render KPIs & Counts
function renderKPIs() {
  let moneyAtRisk = 0;
  let totalRecovered = 0;
  let urgentCount = 0;
  let processingCount = 0;
  let confirmedCount = 0;
  let activeCount = 0;
  let expiredCount = 0;
  let keptCount = 0;

  items.forEach(item => {
    const days = getDaysRemaining(item.deadlineDate);

    if (item.status === 'CONFIRMED') {
      confirmedCount++;
      totalRecovered += (item.returnDetails?.refundAmount ?? item.price);
    } else if (item.status === 'PROCESSING') {
      processingCount++;
    } else if (item.status === 'KEPT') {
      keptCount++;
    } else {
      // It's in ACTIVE or EXPIRED state
      if (days < 0) {
        expiredCount++;
      } else {
        activeCount++;
        moneyAtRisk += item.price;
        if (days <= 3) {
          urgentCount++;
        }
      }
    }
  });

  document.getElementById('stat-money-at-risk').textContent = formatCurrency(moneyAtRisk);
  document.getElementById('stat-urgent-count').textContent = urgentCount;
  document.getElementById('stat-processing-count').textContent = processingCount;
  document.getElementById('stat-total-recovered').textContent = formatCurrency(totalRecovered);
  document.getElementById('stat-confirmed-count').textContent = `${confirmedCount} confirmed return${confirmedCount === 1 ? '' : 's'}`;

  // Update filter pill counts
  document.getElementById('count-all').textContent = items.length;
  document.getElementById('count-active').textContent = activeCount;
  document.getElementById('count-urgent').textContent = urgentCount;
  document.getElementById('count-proc').textContent = processingCount;
  document.getElementById('count-conf').textContent = confirmedCount;
  document.getElementById('count-exp').textContent = expiredCount;
  document.getElementById('count-kept').textContent = keptCount;
}

// Filter and Sort Items
function getFilteredItems() {
  return items.filter(item => {
    const days = getDaysRemaining(item.deadlineDate);
    
    // Status filter
    if (currentFilter === 'ACTIVE') {
      if (item.status === 'CONFIRMED' || item.status === 'PROCESSING' || item.status === 'KEPT' || days < 0) return false;
    } else if (currentFilter === 'URGENT') {
      if (item.status === 'CONFIRMED' || item.status === 'KEPT' || days < 0 || days > 3) return false;
    } else if (currentFilter === 'PROCESSING') {
      if (item.status !== 'PROCESSING') return false;
    } else if (currentFilter === 'CONFIRMED') {
      if (item.status !== 'CONFIRMED') return false;
    } else if (currentFilter === 'EXPIRED') {
      if (item.status !== 'EXPIRED' && (item.status !== 'ACTIVE' || days >= 0)) return false;
    } else if (currentFilter === 'KEPT') {
      if (item.status !== 'KEPT') return false;
    }

    // Store filter
    if (currentStoreFilter !== 'ALL') {
      if (currentStoreFilter === 'Other') {
        const mainStores = ['Amazon', 'Target', 'Best Buy', 'Apple', 'Walmart', 'Costco', 'Nike'];
        if (mainStores.includes(item.store)) return false;
      } else if (item.store.toLowerCase() !== currentStoreFilter.toLowerCase()) {
        return false;
      }
    }

    // Search query
    if (currentSearch) {
      const q = currentSearch;
      const matchName = item.name.toLowerCase().includes(q);
      const matchStore = item.store.toLowerCase().includes(q);
      const matchOrder = (item.orderId || '').toLowerCase().includes(q);
      const matchRma = (item.returnDetails?.rmaCode || '').toLowerCase().includes(q);
      if (!matchName && !matchStore && !matchOrder && !matchRma) return false;
    }

    return true;
  }).sort((a, b) => {
    const daysA = getDaysRemaining(a.deadlineDate);
    const daysB = getDaysRemaining(b.deadlineDate);
    if (currentSort === 'deadline-asc') return daysA - daysB;
    if (currentSort === 'deadline-desc') return daysB - daysA;
    if (currentSort === 'price-desc') return b.price - a.price;
    if (currentSort === 'price-asc') return a.price - b.price;
    return new Date(b.purchaseDate) - new Date(a.purchaseDate);
  });
}

// Render Items Grid & Table
function renderItems() {
  const filtered = getFilteredItems();
  const gridContainer = document.getElementById('items-grid');
  const tableBody = document.getElementById('items-table-body');
  const emptyState = document.getElementById('empty-state');

  if (filtered.length === 0) {
    gridContainer.innerHTML = '';
    tableBody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  // Render Grid
  gridContainer.innerHTML = filtered.map(item => createItemCardHTML(item)).join('');

  // Render Table
  tableBody.innerHTML = filtered.map(item => createItemTableRowHTML(item)).join('');

  lucide.createIcons();
}

// Generate Card HTML for an item
function createItemCardHTML(item) {
  const days = getDaysRemaining(item.deadlineDate);
  let statusBadge = '';
  let cardBorderClass = 'border-slate-200 dark:border-slate-700';

  if (item.status === 'CONFIRMED') {
    statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
        <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> Return Confirmed & Refunded
      </span>
    `;
    cardBorderClass = 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/10';
  } else if (item.status === 'PROCESSING') {
    statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
        <i data-lucide="truck" class="w-3.5 h-3.5"></i> Dropped Off / Processing
      </span>
    `;
    cardBorderClass = 'border-blue-300 dark:border-blue-800/60 bg-blue-50/10';
  } else if (item.status === 'KEPT') {
    statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
        <i data-lucide="heart" class="w-3.5 h-3.5"></i> Keeping Item
      </span>
    `;
  } else if (days < 0) {
    statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Deadline Passed (${Math.abs(days)}d ago)
      </span>
    `;
    cardBorderClass = 'border-slate-300 dark:border-slate-800 opacity-80';
  } else if (days === 0) {
    statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white animate-pulse">
        <i data-lucide="alert-octagon" class="w-3.5 h-3.5"></i> Expires TODAY!
      </span>
    `;
    cardBorderClass = 'card-urgent border-rose-500';
  } else if (days <= 3) {
    statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
        <i data-lucide="flame" class="w-3.5 h-3.5 text-rose-500"></i> ${days} day${days === 1 ? '' : 's'} left!
      </span>
    `;
    cardBorderClass = 'card-urgent border-rose-400';
  } else if (days <= 7) {
    statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
        <i data-lucide="clock" class="w-3.5 h-3.5"></i> ${days} days left
      </span>
    `;
    cardBorderClass = 'card-approaching border-amber-300';
  } else {
    statusBadge = `
      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${days} days remaining
      </span>
    `;
  }

  // Confirmed details snippet
  let returnConfirmationDetails = '';
  if (item.status === 'CONFIRMED' && item.returnDetails) {
    returnConfirmationDetails = `
      <div class="mt-3 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
        <div class="flex items-center justify-between">
          <span class="font-bold">Refund Confirmed:</span>
          <span class="font-bold text-emerald-700 dark:text-emerald-300">${formatCurrency(item.returnDetails.refundAmount)}</span>
        </div>
        <div class="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400">
          <span>RMA: <span class="font-mono">${item.returnDetails.rmaCode || 'N/A'}</span></span>
          <span>Processed: ${formatDate(item.returnDetails.dropDate)}</span>
        </div>
      </div>
    `;
  } else if (item.status === 'PROCESSING' && item.returnDetails) {
    returnConfirmationDetails = `
      <div class="mt-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 space-y-1">
        <div class="flex items-center justify-between">
          <span class="font-bold">Dropped Off:</span>
          <span>${formatDate(item.returnDetails.dropDate)}</span>
        </div>
        <div class="text-[11px] text-blue-700 dark:text-blue-400 font-mono truncate">
          Tracking: ${item.returnDetails.trackingNo || 'Pending'}
        </div>
      </div>
    `;
  }

  return `
    <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 border ${cardBorderClass} shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group">
      <div>
        <!-- Store badge & Status badge -->
        <div class="flex items-center justify-between gap-2 mb-2.5">
          <span class="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
            ${item.store}
          </span>
          ${statusBadge}
        </div>

        <!-- Item Title & Price -->
        <div class="flex items-start justify-between gap-2 mt-1">
          <h3 class="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-2">
            ${item.name}
          </h3>
          <span class="font-extrabold text-base text-slate-900 dark:text-white whitespace-nowrap">
            ${formatCurrency(item.price)}
          </span>
        </div>

        <!-- Metadata Grid -->
        <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Purchased</span>
            <span class="font-medium text-slate-700 dark:text-slate-300">${formatDate(item.purchaseDate)}</span>
          </div>
          <div>
            <span class="block text-[10px] uppercase font-semibold text-slate-400">Return Deadline</span>
            <span class="font-bold ${days <= 3 && item.status === 'ACTIVE' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}">
              ${formatDate(item.deadlineDate)}
            </span>
          </div>
        </div>

        <!-- Order / Method Info -->
        <div class="flex items-center justify-between text-[11px] text-slate-400 mt-2">
          <span>${item.method || 'Standard Return'}</span>
          <span class="font-mono">${item.orderId ? item.orderId : ''}</span>
        </div>

        <!-- Notes if any -->
        ${item.notes ? `
          <p class="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg mt-2.5 italic line-clamp-2">
            "${item.notes}"
          </p>
        ` : ''}

        ${returnConfirmationDetails}
      </div>

      <!-- Action Buttons Footer -->
      <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-1.5">
        <div class="flex items-center gap-1">
          ${item.status !== 'CONFIRMED' ? `
            <button onclick="openConfirmModal('${item.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 transition shadow-xs" title="Confirm Processed Return">
              <i data-lucide="check-circle-2" class="w-3.5 h-3.5"></i>
              <span>Confirm Return</span>
            </button>
          ` : `
            <button onclick="openConfirmModal('${item.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1 transition" title="View or Edit Return Proof">
              <i data-lucide="receipt" class="w-3.5 h-3.5 text-emerald-600"></i>
              <span>View Proof</span>
            </button>
          `}

          <!-- Add to Calendar -->
          <button onclick="downloadCalendarInvite('${item.id}')" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Export to Apple / Google / Outlook Calendar (.ics)">
            <i data-lucide="calendar-plus" class="w-4 h-4 text-blue-500"></i>
          </button>
        </div>

        <div class="flex items-center gap-1">
          <button onclick="editItem('${item.id}')" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Edit Item">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="deleteItem('${item.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40" title="Delete">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Generate Table Row HTML for an item
function createItemTableRowHTML(item) {
  const days = getDaysRemaining(item.deadlineDate);
  let statusText = '';
  if (item.status === 'CONFIRMED') {
    statusText = '<span class="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">✅ Refund Confirmed</span>';
  } else if (item.status === 'PROCESSING') {
    statusText = '<span class="text-xs font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">📦 In Return Process</span>';
  } else if (days < 0) {
    statusText = `<span class="text-xs font-semibold text-slate-400">❌ Expired (${Math.abs(days)}d ago)</span>`;
  } else if (days <= 3) {
    statusText = `<span class="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded animate-pulse">🔥 ${days} days left!</span>`;
  } else {
    statusText = `<span class="text-xs text-slate-600 dark:text-slate-300">${days} days left</span>`;
  }

  return `
    <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
      <td class="py-3 px-4">
        <div class="font-bold text-slate-900 dark:text-white">${item.name}</div>
        <div class="text-xs text-slate-400">${item.store} &bull; ${item.category}</div>
      </td>
      <td class="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">${formatCurrency(item.price)}</td>
      <td class="py-3 px-4 text-xs text-slate-500">${formatDate(item.purchaseDate)}</td>
      <td class="py-3 px-4 text-xs font-medium text-slate-700 dark:text-slate-300">${formatDate(item.deadlineDate)}</td>
      <td class="py-3 px-4">${statusText}</td>
      <td class="py-3 px-4 text-right">
        <div class="inline-flex items-center gap-1.5">
          <button onclick="openConfirmModal('${item.id}')" class="px-2.5 py-1 text-xs font-semibold bg-emerald-600 text-white rounded hover:bg-emerald-700">
            Confirm
          </button>
          <button onclick="editItem('${item.id}')" class="p-1 text-slate-400 hover:text-slate-600 rounded">
            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
          </button>
          <button onclick="deleteItem('${item.id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </td>
    </tr>
  `;
}

// Check Urgent Banner
function updateUrgentBanner() {
  const urgentBanner = document.getElementById('urgent-banner');
  const urgentText = document.getElementById('urgent-banner-text');

  const urgentItems = items.filter(i => {
    if (i.status === 'CONFIRMED' || i.status === 'KEPT') return false;
    const days = getDaysRemaining(i.deadlineDate);
    return days >= 0 && days <= 2;
  });

  if (urgentItems.length > 0) {
    urgentBanner.classList.remove('hidden');
    const names = urgentItems.map(i => i.name).slice(0, 2).join(' and ');
    urgentText.textContent = `Action required: ${names}${urgentItems.length > 2 ? ` (+${urgentItems.length - 2} more)` : ''} must be returned within 48 hours to secure your refund!`;
  } else {
    urgentBanner.classList.add('hidden');
  }
}

function filterUrgentOnly() {
  const urgentBtn = document.querySelector('[data-status="URGENT"]');
  if (urgentBtn) urgentBtn.click();
}

// ==========================================================
// MODAL & ITEM CRUD
// ==========================================================
function openItemModal(itemId = null) {
  const modal = document.getElementById('modal-item');
  const title = document.getElementById('modal-item-title');
  const form = document.getElementById('form-item');
  form.reset();

  if (itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    title.textContent = 'Edit Purchase & Return Deadline';
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-store').value = item.store;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-category').value = item.category || 'Other';
    document.getElementById('item-price').value = item.price;
    document.getElementById('item-purchase-date').value = item.purchaseDate;
    document.getElementById('item-window-days').value = item.windowDays || 30;
    document.getElementById('item-deadline-date').value = item.deadlineDate;
    document.getElementById('item-order-id').value = item.orderId || '';
    document.getElementById('item-method').value = item.method || 'UPS / FedEx Drop-off';
    document.getElementById('item-notes').value = item.notes || '';
  } else {
    title.textContent = 'Track Item Purchase';
    document.getElementById('item-id').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('item-purchase-date').value = today;
    document.getElementById('item-window-days').value = 30;
    recalculateDeadlinesFromWindow();
  }

  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeItemModal() {
  document.getElementById('modal-item').classList.add('hidden');
}

function handleSaveItem(e) {
  e.preventDefault();
  const id = document.getElementById('item-id').value;
  const store = document.getElementById('item-store').value.trim();
  const name = document.getElementById('item-name').value.trim();
  const category = document.getElementById('item-category').value;
  const price = parseFloat(document.getElementById('item-price').value) || 0;
  const purchaseDate = document.getElementById('item-purchase-date').value;
  const windowDays = parseInt(document.getElementById('item-window-days').value) || 30;
  const deadlineDate = document.getElementById('item-deadline-date').value;
  const orderId = document.getElementById('item-order-id').value.trim();
  const method = document.getElementById('item-method').value;
  const notes = document.getElementById('item-notes').value.trim();

  if (id) {
    // Edit existing
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        store,
        name,
        category,
        price,
        purchaseDate,
        windowDays,
        deadlineDate,
        orderId,
        method,
        notes
      };
      showToast('Item updated successfully', 'success');
    }
  } else {
    // Create new
    const newItem = {
      id: 'item-' + Date.now(),
      store,
      name,
      category,
      price,
      purchaseDate,
      windowDays,
      deadlineDate,
      orderId,
      method,
      status: 'ACTIVE',
      notes,
      returnDetails: null
    };
    items.unshift(newItem);
    showToast('Purchase tracked! Return deadline countdown is active.', 'success');
  }

  saveData();
  closeItemModal();
  renderApp();
}

function editItem(id) {
  openItemModal(id);
}

function deleteItem(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;
  if (confirm(`Remove "${item.name}" from your return tracker?`)) {
    items = items.filter(i => i.id !== id);
    saveData();
    renderApp();
    showToast('Item deleted', 'info');
  }
}

// ==========================================================
// MODAL: CONFIRM PROCESSED RETURN (Primary Requirement)
// ==========================================================
let currentConfirmItem = null;

function openConfirmModal(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  currentConfirmItem = item;

  document.getElementById('confirm-item-id').value = item.id;
  document.getElementById('confirm-store-badge').textContent = item.store;
  document.getElementById('confirm-item-name').textContent = item.name;
  document.getElementById('confirm-item-price').textContent = formatCurrency(item.price);
  document.getElementById('confirm-original-deadline').textContent = `Original Deadline: ${formatDate(item.deadlineDate)}`;

  const todayStr = new Date().toISOString().split('T')[0];

  if (item.returnDetails) {
    // Pre-populate with existing return confirmation details
    document.getElementById('confirm-rma-code').value = item.returnDetails.rmaCode || '';
    document.getElementById('confirm-date').value = item.returnDetails.dropDate || todayStr;
    document.getElementById('confirm-carrier').value = item.returnDetails.carrier || '';
    document.getElementById('confirm-tracking-no').value = item.returnDetails.trackingNo || '';
    document.getElementById('confirm-refund-amount').value = item.returnDetails.refundAmount ?? item.price;
    document.getElementById('confirm-refund-method').value = item.returnDetails.refundMethod || 'Original Payment Method';
    document.getElementById('confirm-notes').value = item.returnDetails.notes || '';
    
    // Select stage radio
    const stageRadio = document.querySelector(`input[name="return-stage"][value="${item.status}"]`);
    if (stageRadio) stageRadio.checked = true;
  } else {
    // Fresh return confirmation
    document.getElementById('confirm-rma-code').value = 'RMA-' + Math.floor(100000 + Math.random() * 900000);
    document.getElementById('confirm-date').value = todayStr;
    document.getElementById('confirm-carrier').value = item.method.includes('UPS') ? 'The UPS Store' : (item.method.includes('In-Store') ? `${item.store} Counter` : 'FedEx / USPS');
    document.getElementById('confirm-tracking-no').value = '';
    document.getElementById('confirm-refund-amount').value = item.price;
    document.getElementById('confirm-notes').value = '';
  }

  document.getElementById('modal-confirm-return').classList.remove('hidden');
  lucide.createIcons();
}

function closeConfirmModal() {
  document.getElementById('modal-confirm-return').classList.add('hidden');
  currentConfirmItem = null;
}

function handleConfirmReturnSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('confirm-item-id').value;
  const itemIndex = items.findIndex(i => i.id === id);
  if (itemIndex === -1) return;

  const stage = document.querySelector('input[name="return-stage"]:checked').value;
  const rmaCode = document.getElementById('confirm-rma-code').value.trim();
  const dropDate = document.getElementById('confirm-date').value;
  const carrier = document.getElementById('confirm-carrier').value.trim();
  const trackingNo = document.getElementById('confirm-tracking-no').value.trim();
  const refundAmount = parseFloat(document.getElementById('confirm-refund-amount').value) || items[itemIndex].price;
  const refundMethod = document.getElementById('confirm-refund-method').value;
  const notes = document.getElementById('confirm-notes').value.trim();

  items[itemIndex].status = stage; // CONFIRMED or PROCESSING
  items[itemIndex].returnDetails = {
    rmaCode,
    dropDate,
    carrier,
    trackingNo,
    refundAmount,
    refundMethod,
    notes
  };

  saveData();
  closeConfirmModal();
  renderApp();

  if (stage === 'CONFIRMED') {
    showToast(`Return confirmed! ${formatCurrency(refundAmount)} recorded as refunded.`, 'success');
  } else {
    showToast('Return marked as dropped off & in transit to retailer.', 'info');
  }
}

// Print Confirmation Slip / Receipt
function printReceiptSlip() {
  if (!currentConfirmItem) return;

  const rmaCode = document.getElementById('confirm-rma-code').value.trim() || 'N/A';
  const dropDate = document.getElementById('confirm-date').value || '--';
  const carrier = document.getElementById('confirm-carrier').value.trim() || 'Retailer Drop-off';
  const trackingNo = document.getElementById('confirm-tracking-no').value.trim() || 'N/A';
  const refundAmount = parseFloat(document.getElementById('confirm-refund-amount').value) || currentConfirmItem.price;
  const refundMethod = document.getElementById('confirm-refund-method').value;
  const notes = document.getElementById('confirm-notes').value.trim() || 'Drop-off verified and confirmed.';

  document.getElementById('print-item-name').textContent = currentConfirmItem.name;
  document.getElementById('print-store').textContent = currentConfirmItem.store;
  document.getElementById('print-order-id').textContent = currentConfirmItem.orderId || 'Direct Purchase';
  document.getElementById('print-rma').textContent = rmaCode;
  document.getElementById('print-drop-date').textContent = formatDate(dropDate);
  document.getElementById('print-carrier').textContent = carrier;
  document.getElementById('print-tracking').textContent = trackingNo;
  document.getElementById('print-refund-amount').textContent = formatCurrency(refundAmount);
  document.getElementById('print-refund-method').textContent = refundMethod;
  document.getElementById('print-notes').textContent = notes;

  window.print();
}

// ==========================================================
// EXPORT TO CALENDAR (.ICS & GOOGLE CALENDAR)
// ==========================================================
function downloadCalendarInvite(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;

  const deadlineClean = item.deadlineDate.replace(/-/g, '');
  const title = `Return Deadline: ${item.name} (${item.store})`;
  const description = `FINAL DAY to return ${item.name} to ${item.store} for a full refund of ${formatCurrency(item.price)}.\\nOrder Ref: ${item.orderId || 'N/A'}\\nReturn Method: ${item.method || 'Drop-off'}`;

  // Build standard .ics format string
  const icsData = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ReturnPulse//INSY 3331 Group 8//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:return-${item.id}@returnpulse.app`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART;VALUE=DATE:${deadlineClean}`,
    `DTEND;VALUE=DATE:${deadlineClean}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${item.store}`,
    'STATUS:CONFIRMED',
    // 2-day reminder alarm
    'BEGIN:VALARM',
    'TRIGGER:-P2D',
    'ACTION:DISPLAY',
    `DESCRIPTION:Reminder: 2 days left to return ${item.name}`,
    'END:VALARM',
    // 1-day reminder alarm
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    `DESCRIPTION:URGENT: Return ${item.name} tomorrow!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Return_Deadline_${item.store}_${item.name.substring(0, 15).replace(/\s+/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast('Calendar invite (.ics) downloaded with alarms set!', 'success');
}

// ==========================================================
// NOTIFICATIONS API
// ==========================================================
function checkNotificationStatus() {
  const statusSpan = document.getElementById('notif-status-text');
  if (!('Notification' in window)) {
    statusSpan.textContent = 'Alerts Unsupported';
    return;
  }
  if (Notification.permission === 'granted') {
    statusSpan.textContent = 'Alerts Active';
  } else {
    statusSpan.textContent = 'Enable Alerts';
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('Browser notifications are not supported in your browser.');
    return;
  }

  Notification.requestPermission().then(permission => {
    checkNotificationStatus();
    if (permission === 'granted') {
      showToast('Notifications enabled! We will alert you on urgent deadlines.', 'success');
      // Fire sample / active urgent check
      const urgent = items.filter(i => {
        if (i.status === 'CONFIRMED' || i.status === 'KEPT') return false;
        const days = getDaysRemaining(i.deadlineDate);
        return days >= 0 && days <= 2;
      });
      if (urgent.length > 0) {
        new Notification('ReturnPulse Alert', {
          body: `You have ${urgent.length} return deadline${urgent.length > 1 ? 's' : ''} expiring within 48 hours!`,
          icon: 'https://cdn-icons-png.flaticon.com/512/891/891462.png'
        });
      }
    } else {
      showToast('Notification permission was not granted.', 'info');
    }
  });
}

// ==========================================================
// AI RETURN ADVISOR & SUPPORT GENERATOR (INSY 3331)
// ==========================================================
function openAiModal() {
  const modal = document.getElementById('modal-ai-assistant');
  const itemSelect = document.getElementById('ai-item-select');
  itemSelect.innerHTML = items.map(i => `<option value="${i.id}">${i.store} - ${i.name}</option>`).join('');
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function closeAiModal() {
  document.getElementById('modal-ai-assistant').classList.add('hidden');
}

function showPolicy(storeKey) {
  const policy = RETAILER_POLICIES[storeKey];
  const box = document.getElementById('policy-display-box');
  if (policy) {
    box.innerHTML = `
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <strong class="text-indigo-900 dark:text-indigo-300 text-sm">${storeKey} Policy Summary:</strong>
          <span class="px-2 py-0.5 rounded font-bold bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">${policy.days} Days Window</span>
        </div>
        <p>${policy.details}</p>
        <div class="mt-2 pt-2 border-t border-indigo-200 dark:border-indigo-900 text-[11px] text-indigo-600 dark:text-indigo-400">
          <strong>Smart Timing Advice:</strong> If returning by mail or shipping drop-off, initiate return at least 4 business days before the ${policy.days}-day deadline to prevent warehouse transit rejection!
        </div>
      </div>
    `;
  }
}

function generateAiReturnNote() {
  const selectedItemId = document.getElementById('ai-item-select').value;
  const reasonType = document.getElementById('ai-reason-type').value;
  const item = items.find(i => i.id === selectedItemId);

  if (!item) {
    alert('Please track or select an item first.');
    return;
  }

  const reasonTexts = {
    'defective': `I purchased this ${item.name} from ${item.store} on ${formatDate(item.purchaseDate)}. After unboxing and testing it, I found that it does not function properly / has a hardware defect. Since I am well within the ${item.windowDays || 30}-day return window, I would appreciate receiving an RMA number and prepaid return label for a full refund of ${formatCurrency(item.price)}.`,
    'wrong-size': `I am writing to initiate a return/exchange for the ${item.name} (Order: ${item.orderId || 'attached receipt'}). The sizing is not an optimal fit. The item is in pristine condition with all original packaging and tags intact. Please confirm the drop-off return process to credit the ${formatCurrency(item.price)} refund.`,
    'not-as-described': `I received the ${item.name} on ${formatDate(item.purchaseDate)}. However, upon inspection, the item differs significantly from the product specifications and images shown on the website. I am submitting this return request within the approved return window for a full refund to my original payment method.`,
    'late-delivery': `I am requesting to return ${item.name} (Order: ${item.orderId || 'N/A'}). Due to shipping delays, the package arrived after the date needed, and I have already procured an alternative. The package remains unopened in original condition.`,
    'accidental': `I accidentally placed a duplicate order for ${item.name}. The merchandise is completely new, unused, and in sealed packaging. Please provide the return authorization to complete this refund.`
  };

  const output = document.getElementById('ai-output-text');
  output.value = `Subject: Return Authorization Request - Order ${item.orderId || 'N/A'} - ${item.name}\n\nDear ${item.store} Customer Support,\n\n${reasonTexts[reasonType]}\n\nPurchase Details:\n- Item: ${item.name}\n- Purchase Date: ${formatDate(item.purchaseDate)}\n- Deadline: ${formatDate(item.deadlineDate)}\n- Total Paid: ${formatCurrency(item.price)}\n\nThank you for your prompt assistance,\nOnyekachi (UTA Group 8)`;

  document.getElementById('ai-generated-box').classList.remove('hidden');
}

function copyGeneratedNote() {
  const output = document.getElementById('ai-output-text');
  output.select();
  document.execCommand('copy');
  showToast('Return message copied to clipboard!', 'success');
}

// ==========================================================
// TOAST NOTIFICATIONS HELPER
// ==========================================================
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');

  const bgClass = type === 'success' ? 'bg-emerald-600 text-white' : (type === 'warning' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900');

  toast.className = `${bgClass} px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transform transition-all duration-300 translate-y-2 opacity-0 pointer-events-auto`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-y-2', 'opacity-0');
  }, 10);

  // Animate out
  setTimeout(() => {
    toast.classList.add('translate-y-2', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
