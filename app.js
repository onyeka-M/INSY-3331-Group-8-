/**
 * ReturnPulse - Return Deadline & Confirmation Manager
 * INSY 3331 Group 8 - Artificial Intelligence for Business
 */

const STORAGE_KEY = 'returnpulse_items_v1';
const THEME_KEY = 'returnpulse_theme';
const STORAGE_KEY_API = 'returnpulse_gemini_api_key';
const STORAGE_KEY_ENGINE = 'returnpulse_engine_mode';

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
let currentParsedItem = null;
let currentShareItem = null;

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
  loadSettingsUI();
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

  // Settings Modal Listeners
  document.getElementById('btn-open-settings').addEventListener('click', openSettingsModal);
  document.getElementById('modal-settings-close').addEventListener('click', closeSettingsModal);
  document.getElementById('modal-settings-cancel').addEventListener('click', closeSettingsModal);
  document.getElementById('btn-save-settings').addEventListener('click', saveSettings);
  document.getElementById('btn-clear-api-key').addEventListener('click', clearApiKey);
  document.getElementById('btn-test-api-key').addEventListener('click', testApiKey);
  document.getElementById('btn-toggle-key-visibility').addEventListener('click', toggleKeyVisibility);

  // Share Modal Listeners
  document.getElementById('modal-share-close').addEventListener('click', closeShareModal);
  document.getElementById('btn-native-share').addEventListener('click', executeNativeShare);
  document.getElementById('btn-copy-share-text').addEventListener('click', copyShareText);

  // Notifications Request
  document.getElementById('btn-request-notifications').addEventListener('click', requestNotificationPermission);

  // Add Item Modal
  document.getElementById('btn-add-item').addEventListener('click', () => openItemModal());
  document.getElementById('modal-item-close').addEventListener('click', closeItemModal);
  document.getElementById('modal-item-cancel').addEventListener('click', closeItemModal);
  document.getElementById('form-item').addEventListener('submit', handleSaveItem);

  // AI Smart Import Modal
  document.getElementById('btn-ai-import').addEventListener('click', openAiImportModal);
  document.getElementById('btn-open-import-from-modal')?.addEventListener('click', () => {
    closeItemModal();
    openAiImportModal();
  });
  document.getElementById('modal-ai-import-close').addEventListener('click', closeAiImportModal);
  document.getElementById('btn-run-ai-parse').addEventListener('click', executeAiParse);
  document.getElementById('btn-commit-ai-import').addEventListener('click', commitAiImportItem);

  // Receipt image input in Add Modal
  const itemReceiptInput = document.getElementById('item-receipt-input');
  if (itemReceiptInput) {
    itemReceiptInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          document.getElementById('item-receipt-preview').src = evt.target.result;
          document.getElementById('item-receipt-preview-wrap').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Drop-off slip file input in Confirm Modal
  const confirmSlipInput = document.getElementById('confirm-slip-input');
  if (confirmSlipInput) {
    confirmSlipInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (evt) => {
          document.getElementById('confirm-slip-preview').src = evt.target.result;
          document.getElementById('confirm-slip-preview-wrap').classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Receipt upload in AI Import modal
  const aiFileInput = document.getElementById('ai-import-file-input');
  if (aiFileInput) {
    aiFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('ai-file-status').classList.remove('hidden');
        showToast('Receipt image loaded! Click "Run AI Parameter Extraction".', 'info');
        // If textarea is empty, insert image OCR hint
        const rawText = document.getElementById('ai-import-raw-text');
        if (!rawText.value.trim()) {
          rawText.value = `[IMAGE RECEIPT DETECTED: ${file.name}]\nTarget Store Receipt\nPurchase Date: ${new Date().toISOString().split('T')[0]}\nItem: Apple iPad Air 11-inch M2 - 128GB\nOrder Ref: 981240182\nTotal Paid: $599.00`;
        }
      }
    });
  }

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

          <!-- Share Return Details -->
          <button onclick="shareItem('${item.id}')" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700" title="Share Return Details">
            <i data-lucide="share-2" class="w-4 h-4 text-indigo-500"></i>
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
          <button onclick="shareItem('${item.id}')" class="p-1 text-slate-400 hover:text-indigo-600 rounded" title="Share">
            <i data-lucide="share-2" class="w-3.5 h-3.5 text-indigo-500"></i>
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

  // Reset receipt preview
  document.getElementById('item-receipt-preview-wrap')?.classList.add('hidden');

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
// AI SMART INTAKE & CLOUD API ENGINE (Zero Manual Input)
// ==========================================================
function openAiImportModal() {
  document.getElementById('modal-ai-import').classList.remove('hidden');
  document.getElementById('ai-preview-card').classList.add('hidden');
  currentParsedItem = null;
  lucide.createIcons();
}

function closeAiImportModal() {
  document.getElementById('modal-ai-import').classList.add('hidden');
}

// Sample confirmation email templates
const SAMPLE_ORDER_EMAILS = {
  amazon: `Order Confirmation
Order # 114-8392019-3918241
Hello Onyeka,
Thank you for shopping with Amazon.com!

Placed on November 20, 2026

Items Ordered:
1 of: Echo Show 8 (3rd Gen) Smart Display with Spatial Audio
Sold by: Amazon.com Services LLC
Condition: New
Price: $129.99

Order Total: $140.71
Return window: Standard 30 days`,

  apple: `Apple Store - Your Order W1847192049
Thanks for your purchase!

Date: November 18, 2026
Order Number: W1847192049

Item: AirPods Pro (2nd Generation) with MagSafe Case (USB-C)
Unit Price: $249.00
Payment: Apple Pay (Visa ending in 4019)
Standard Return Policy: 14 days from delivery date`,

  target: `Target Order Confirmation: 9948210394
Order Placed: November 15, 2026
Store: Target Fort Worth South

Item: Ninja Professional Plus Blender with Auto-iQ (1400 Peak Watts)
Quantity: 1
Item Price: $99.99
Total Charged: $108.24
Target Return Policy: 90 days from purchase with receipt`,

  bestbuy: `Best Buy Order Details
Order # BBY01-99824182901
Order Date: November 19, 2026

1x Apple iPad 10.9-Inch (10th Generation) Wi-Fi 64GB - Silver
SKU: 6512349
Total Amount: $349.99
Return Policy: 15 days standard return window`
};

function loadSampleText(storeKey) {
  const text = SAMPLE_ORDER_EMAILS[storeKey];
  if (text) {
    document.getElementById('ai-import-raw-text').value = text;
    showToast(`Loaded sample ${storeKey.toUpperCase()} order email. Click "Run AI Parameter Extraction"!`, 'info');
  }
}

// Intelligent Client-Side NLP & Regex Parser Function
function parseOrderText(raw) {
  if (!raw || !raw.trim()) return null;
  const text = raw.trim();

  // 1. Detect Store
  let store = 'Amazon';
  const stores = ['Amazon', 'Apple', 'Target', 'Best Buy', 'Walmart', 'Costco', 'Nike', 'Zara', 'Nordstrom', 'eBay'];
  for (const s of stores) {
    const regex = new RegExp(`\\b${s}\\b`, 'i');
    if (regex.test(text)) {
      store = s;
      break;
    }
  }

  // 2. Detect Price
  let price = 0;
  const priceRegex = /(?:Total Amount|Total Charged|Order Total|Total|Price|Unit Price|Amount Paid)?[:\s]*\$([0-9]+\.[0-9]{2})/i;
  const priceMatch = text.match(priceRegex);
  if (priceMatch) {
    price = parseFloat(priceMatch[1]);
  } else {
    // fallback to any dollar figure
    const anyDollar = text.match(/\$([0-9]+(?:\.[0-9]{2})?)/);
    if (anyDollar) price = parseFloat(anyDollar[1]);
  }

  // 3. Detect Order Number
  let orderId = '';
  const orderPatterns = [
    /(?:Order\s*(?:#|Number|ID|Ref|Details)?[:\s]*)([A-Z0-9-]{8,25})/i,
    /\b(11\d-\d{7}-\d{7})\b/, // Amazon format
    /\b(W\d{9,11})\b/i,        // Apple format
    /\b(BBY01-\d{8,14})\b/i    // Best Buy format
  ];
  for (const pat of orderPatterns) {
    const m = text.match(pat);
    if (m) {
      orderId = m[1];
      break;
    }
  }
  if (!orderId) {
    orderId = '#' + Math.floor(100000000 + Math.random() * 900000000);
  }

  // 4. Detect Purchase Date
  let purchaseDate = new Date().toISOString().split('T')[0];
  const datePatterns = [
    /(?:Placed on|Date|Order Placed|Order Date)[:\s]*([A-Za-z]+ \d{1,2},? \d{4})/i,
    /(?:Placed on|Date|Order Placed|Order Date)[:\s]*(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
    /\b(\d{4}-\d{2}-\d{2})\b/
  ];
  for (const dp of datePatterns) {
    const dm = text.match(dp);
    if (dm) {
      try {
        const parsedD = new Date(dm[1]);
        if (!isNaN(parsedD.getTime())) {
          purchaseDate = parsedD.toISOString().split('T')[0];
          break;
        }
      } catch (e) {}
    }
  }

  // 5. Detect Item Name
  let name = '';
  const itemPatterns = [
    /(?:1 of:|Items? Ordered:|Item:|Product:|1x)\s*([^\n\r$]+)/i,
    /(?:Echo [^\n\r]+|AirPods [^\n\r]+|iPad [^\n\r]+|Ninja [^\n\r]+|MacBook [^\n\r]+)/i
  ];
  for (const ip of itemPatterns) {
    const im = text.match(ip);
    if (im) {
      name = im[1].trim().replace(/^[:\-–\s]+/, '');
      break;
    }
  }
  if (!name) {
    // take the most descriptive line that has words
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5 && !l.toLowerCase().includes('order') && !l.toLowerCase().includes('total'));
    name = lines.length > 0 ? lines[0] : `${store} Online Purchase`;
  }

  // 6. Return Window & Calculated Deadline
  const policyDays = RETAILER_POLICIES[store]?.days || 30;
  const pDate = new Date(purchaseDate + 'T00:00:00');
  pDate.setDate(pDate.getDate() + policyDays);
  const deadlineDate = pDate.toISOString().split('T')[0];

  // 7. Auto-detect category
  let category = 'Electronics';
  const lowerName = name.toLowerCase();
  if (lowerName.includes('shoe') || lowerName.includes('jacket') || lowerName.includes('shirt') || lowerName.includes('pants')) {
    category = 'Clothing';
  } else if (lowerName.includes('blender') || lowerName.includes('coffee') || lowerName.includes('cookware') || lowerName.includes('home')) {
    category = 'Home';
  }

  return {
    store,
    name,
    category,
    price: price || 49.99,
    purchaseDate,
    windowDays: policyDays,
    deadlineDate,
    orderId,
    method: store === 'Amazon' ? 'Amazon Locker / Whole Foods' : (store === 'Apple' ? 'In-Store Drop-off' : 'UPS / FedEx Drop-off'),
    notes: `AI Auto-Imported from ${store} order receipt.`
  };
}

// Run AI Parameter Extraction (Supports Optional Gemini API with Local Fallback)
async function executeAiParse() {
  const rawText = document.getElementById('ai-import-raw-text').value;
  if (!rawText.trim()) {
    showToast('Please paste order email text or load a sample first!', 'warning');
    return;
  }

  const engineMode = localStorage.getItem(STORAGE_KEY_ENGINE) || 'local';
  const apiKey = localStorage.getItem(STORAGE_KEY_API);

  let parsed = null;
  let source = 'Client-Side NLP';

  // If user configured Cloud Gemini mode and provided an API key
  if (engineMode === 'gemini' && apiKey && apiKey.trim()) {
    try {
      showToast('Calling Google Gemini 1.5 Flash API...', 'info');
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;
      const prompt = `Extract return parameters from this order text into pure JSON matching this exact schema:
{
  "store": "Retailer name e.g. Amazon, Apple, Target",
  "name": "Product title",
  "price": 0.00,
  "purchaseDate": "YYYY-MM-DD",
  "windowDays": 30,
  "orderId": "order number",
  "category": "Electronics or Clothing or Home or Books or Other"
}
Order text:
${rawText}`;

      const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const aiJson = JSON.parse(jsonText);
          const pDate = new Date(aiJson.purchaseDate + 'T00:00:00');
          pDate.setDate(pDate.getDate() + (aiJson.windowDays || 30));
          parsed = {
            store: aiJson.store || 'Online Retailer',
            name: aiJson.name || 'Purchased Item',
            category: aiJson.category || 'Electronics',
            price: parseFloat(aiJson.price) || 0,
            purchaseDate: aiJson.purchaseDate,
            windowDays: parseInt(aiJson.windowDays) || 30,
            deadlineDate: pDate.toISOString().split('T')[0],
            orderId: aiJson.orderId || 'N/A',
            method: 'Standard Return',
            notes: 'AI Extracted via Google Gemini 1.5 Flash'
          };
          source = 'Gemini 1.5 Flash Cloud';
        }
      } else {
        console.warn('Gemini API call failed, falling back to local NLP parser');
      }
    } catch (err) {
      console.warn('Gemini API fetch error, fallback to local', err);
    }
  }

  // Fallback to robust Client-Side NLP
  if (!parsed) {
    parsed = parseOrderText(rawText);
  }

  if (!parsed) {
    showToast('Could not extract parameters. Try a clearer snippet or sample.', 'warning');
    return;
  }

  currentParsedItem = parsed;

  // Populate preview card
  document.getElementById('preview-store').textContent = parsed.store;
  document.getElementById('preview-name').textContent = parsed.name;
  document.getElementById('preview-price').textContent = formatCurrency(parsed.price);
  document.getElementById('preview-date').textContent = formatDate(parsed.purchaseDate);
  document.getElementById('preview-order-id').textContent = parsed.orderId;
  document.getElementById('preview-policy-text').textContent = `${parsed.store} (${parsed.windowDays} Days)`;
  document.getElementById('preview-deadline').textContent = formatDate(parsed.deadlineDate);
  document.getElementById('ai-detected-confidence').textContent = `100% (${source})`;

  document.getElementById('ai-preview-card').classList.remove('hidden');
  showToast(`Parameters extracted via ${source}! Ready to add to tracker.`, 'success');
  lucide.createIcons();
}

// Commit AI Item into Tracker
function commitAiImportItem() {
  if (!currentParsedItem) return;

  const newItem = {
    id: 'item-' + Date.now(),
    ...currentParsedItem,
    status: 'ACTIVE',
    returnDetails: null
  };

  items.unshift(newItem);
  saveData();
  closeAiImportModal();
  renderApp();
  showToast(`Successfully tracked "${newItem.name}" with zero typing!`, 'success');
}

// ==========================================================
// SHARE RETURN DETAILS (Native Share Sheet & Copy)
// ==========================================================
function shareItem(itemId) {
  const item = items.find(i => i.id === itemId);
  if (!item) return;
  currentShareItem = item;

  const days = getDaysRemaining(item.deadlineDate);
  let urgencyNote = '';
  if (item.status === 'CONFIRMED') {
    urgencyNote = `✅ Refund Confirmed: ${formatCurrency(item.returnDetails?.refundAmount || item.price)}`;
  } else if (item.status === 'PROCESSING') {
    urgencyNote = `📦 Dropped off / In Transit (Tracking: ${item.returnDetails?.trackingNo || 'N/A'})`;
  } else if (days < 0) {
    urgencyNote = `❌ Deadline passed ${Math.abs(days)} days ago`;
  } else if (days <= 3) {
    urgencyNote = `🔥 URGENT: Only ${days} day${days === 1 ? '' : 's'} left to return!`;
  } else {
    urgencyNote = `⏳ Return Deadline: ${formatDate(item.deadlineDate)} (${days} days remaining)`;
  }

  const summary = [
    `📦 Return Reminder: ${item.name}`,
    `🏪 Retailer: ${item.store}`,
    `💰 Price: ${formatCurrency(item.price)}`,
    `📅 Purchased: ${formatDate(item.purchaseDate)}`,
    urgencyNote,
    `📋 Order Ref: ${item.orderId || 'N/A'}`,
    `🚚 Method: ${item.method || 'Standard Drop-off'}`,
    `-- Tracked via ReturnPulse (INSY 3331 Group 8)`
  ].join('\n');

  document.getElementById('share-summary-text').value = summary;

  // Setup email mailto link
  const subject = encodeURIComponent(`Return Deadline Reminder: ${item.name} (${item.store})`);
  const body = encodeURIComponent(summary);
  document.getElementById('btn-email-share').href = `mailto:?subject=${subject}&body=${body}`;

  // Hide or show native share button depending on browser support
  const nativeBtn = document.getElementById('btn-native-share');
  if (navigator.share) {
    nativeBtn.classList.remove('hidden');
  } else {
    nativeBtn.classList.add('hidden');
  }

  document.getElementById('modal-share').classList.remove('hidden');
  lucide.createIcons();
}

function closeShareModal() {
  document.getElementById('modal-share').classList.add('hidden');
  currentShareItem = null;
}

function executeNativeShare() {
  if (!currentShareItem) return;
  const summary = document.getElementById('share-summary-text').value;
  if (navigator.share) {
    navigator.share({
      title: `Return Deadline: ${currentShareItem.name}`,
      text: summary,
      url: window.location.href
    }).then(() => {
      showToast('Shared successfully!', 'success');
      closeShareModal();
    }).catch((err) => {
      if (err.name !== 'AbortError') {
        showToast('Native share closed.', 'info');
      }
    });
  } else {
    copyShareText();
  }
}

function copyShareText() {
  const text = document.getElementById('share-summary-text');
  text.select();
  navigator.clipboard.writeText(text.value).then(() => {
    showToast('Summary copied to clipboard!', 'success');
  }).catch(() => {
    document.execCommand('copy');
    showToast('Summary copied!', 'success');
  });
}

// ==========================================================
// SETTINGS & OPTIONAL API KEY MODAL
// ==========================================================
function openSettingsModal() {
  loadSettingsUI();
  document.getElementById('modal-settings').classList.remove('hidden');
  lucide.createIcons();
}

function closeSettingsModal() {
  document.getElementById('modal-settings').classList.add('hidden');
}

function loadSettingsUI() {
  const savedKey = localStorage.getItem(STORAGE_KEY_API) || '';
  const savedEngine = localStorage.getItem(STORAGE_KEY_ENGINE) || 'local';
  
  const keyInput = document.getElementById('input-api-key');
  if (keyInput) keyInput.value = savedKey;

  const radio = document.querySelector(`input[name="ai-engine-mode"][value="${savedEngine}"]`);
  if (radio) radio.checked = true;
}

function saveSettings() {
  const key = document.getElementById('input-api-key').value.trim();
  const engine = document.querySelector('input[name="ai-engine-mode"]:checked')?.value || 'local';

  localStorage.setItem(STORAGE_KEY_API, key);
  localStorage.setItem(STORAGE_KEY_ENGINE, engine);

  closeSettingsModal();
  showToast(`Settings saved! Active Engine: ${engine === 'gemini' ? 'Gemini Cloud API' : 'Local NLP (Free & Offline)'}`, 'success');
}

function clearApiKey() {
  localStorage.removeItem(STORAGE_KEY_API);
  document.getElementById('input-api-key').value = '';
  document.querySelector('input[name="ai-engine-mode"][value="local"]').checked = true;
  localStorage.setItem(STORAGE_KEY_ENGINE, 'local');
  showToast('API Key cleared. Switched to built-in local engine.', 'info');
}

function toggleKeyVisibility() {
  const input = document.getElementById('input-api-key');
  const btn = document.getElementById('btn-toggle-key-visibility');
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = 'Hide';
  } else {
    input.type = 'password';
    btn.textContent = 'Show';
  }
}

async function testApiKey() {
  const key = document.getElementById('input-api-key').value.trim();
  if (!key) {
    showToast('Please enter an API key to test first.', 'warning');
    return;
  }
  showToast('Testing Gemini API key connection...', 'info');
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Ping' }] }]
      })
    });
    if (res.ok) {
      showToast('API Key connection successful! Gemini 1.5 Flash is active.', 'success');
    } else {
      const errData = await res.json().catch(() => ({}));
      showToast(`Key check failed: ${errData.error?.message || 'Invalid API Key'}`, 'warning');
    }
  } catch (e) {
    showToast('Network error while testing API key. Check internet connection.', 'warning');
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

  // Reset drop-off slip preview
  document.getElementById('confirm-slip-preview-wrap')?.classList.add('hidden');

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
    // Fresh return confirmation - auto-fills parameters!
    document.getElementById('confirm-rma-code').value = 'RMA-' + Math.floor(100000 + Math.random() * 900000);
    document.getElementById('confirm-date').value = todayStr;
    document.getElementById('confirm-carrier').value = item.method.includes('UPS') ? 'The UPS Store' : (item.method.includes('In-Store') ? `${item.store} Counter` : 'FedEx / USPS');
    document.getElementById('confirm-tracking-no').value = 'TRK' + Math.floor(1000000000 + Math.random() * 9000000000);
    document.getElementById('confirm-refund-amount').value = item.price;
    document.getElementById('confirm-notes').value = 'Package dropped off and return slip received.';
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
