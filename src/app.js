const areaConfig = {
  Superior: {
    zones: 29,
    bays: ['A', 'B', 'C', 'D', 'E', 'F'],
    description: 'Primary inventory area with 29 active zones.',
  },
  West: {
    zones: 12,
    bays: ['A', 'B', 'C', 'D'],
    description: 'Overflow and staged stock.',
  },
  East: {
    zones: 10,
    bays: ['A', 'B', 'C', 'D'],
    description: 'Fast-pick and smaller SKU storage.',
  },
  Receiving: {
    zones: 6,
    bays: ['A', 'B', 'C'],
    description: 'Inbound product awaiting put-away.',
  },
};

const storageKey = 'optimized-warehouse-inventory';
const defaultLocationId = 'Superior-1-A';
const locations = buildLocations();

let inventory = loadInventory();
let selectedArea = 'Superior';
let showOnlyEmpty = false;
let searchTerm = '';

const root = document.querySelector('#root');
render();

function buildLocations() {
  return Object.entries(areaConfig).flatMap(([area, config]) =>
    Array.from({ length: config.zones }, (_, zoneIndex) => zoneIndex + 1).flatMap((zone) =>
      config.bays.map((bay) => ({
        id: `${area}-${zone}-${bay}`,
        area,
        zone,
        bay,
      })),
    ),
  );
}

function loadInventory() {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return getDemoInventory();
    }
  }

  return getDemoInventory();
}

function getDemoInventory() {
  return [
    {
      id: crypto.randomUUID(),
      sku: 'SUP-1001',
      productName: 'Superior sample tote',
      quantity: 48,
      locationId: 'Superior-1-A',
      dateAdded: new Date().toISOString().slice(0, 10),
      lotNumber: 'LOT-2401',
      supplier: 'Superior Supply Co.',
      barcode: '000111222333',
    },
    {
      id: crypto.randomUUID(),
      sku: 'REC-2200',
      productName: 'Receiving pallet starter',
      quantity: 12,
      locationId: 'Receiving-2-B',
      dateAdded: new Date().toISOString().slice(0, 10),
      lotNumber: 'INBOUND-7',
      supplier: 'Inbound Partner',
      barcode: '444555666777',
    },
  ];
}

function saveInventory() {
  localStorage.setItem(storageKey, JSON.stringify(inventory));
}

function formatLocation(locationId) {
  return locationId.replaceAll('-', ' ');
}

function render() {
  const occupiedLocationIds = new Set(inventory.map((item) => item.locationId));
  const locationCounts = {
    total: locations.length,
    occupied: occupiedLocationIds.size,
    empty: locations.length - occupiedLocationIds.size,
  };
  const selectedAreaConfig = areaConfig[selectedArea];
  const visibleLocations = locations.filter((location) => {
    if (location.area !== selectedArea) {
      return false;
    }

    return !(showOnlyEmpty && occupiedLocationIds.has(location.id));
  });
  const filteredInventory = inventory.filter((item) => {
    const haystack = [item.sku, item.productName, item.locationId, item.lotNumber, item.supplier, item.barcode]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  root.innerHTML = `
    <main class="app-shell">
      <section class="hero">
        <div>
          <img class="logo" src="/tbflogo.png" alt="Company logo" />
          <p class="eyebrow">Warehouse floor map</p>
          <h1>Optimized Warehouse</h1>
          <p class="hero-copy">Map zones and bays as cubes, then add, move, remove, adjust, and search SKUs as inventory changes.</p>
        </div>
        <div class="stats-grid" aria-label="Warehouse capacity summary">
          ${statCard('Total cubes', locationCounts.total)}
          ${statCard('Occupied', locationCounts.occupied)}
          ${statCard('Empty', locationCounts.empty)}
        </div>
      </section>

      <section class="panel layout-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Floor areas</p>
            <h2>${selectedArea} cube map</h2>
            <p>${selectedAreaConfig.description}</p>
          </div>
          <div class="toolbar">
            <label>
              Area
              <select id="area-select">
                ${Object.keys(areaConfig)
                  .map((area) => `<option value="${area}" ${area === selectedArea ? 'selected' : ''}>${area}</option>`)
                  .join('')}
              </select>
            </label>
            <label class="checkbox-label">
              <input id="empty-toggle" type="checkbox" ${showOnlyEmpty ? 'checked' : ''} /> Empty only
            </label>
          </div>
        </div>
        <div class="cube-grid" style="grid-template-columns: repeat(${selectedAreaConfig.bays.length}, minmax(90px, 1fr))">
          ${visibleLocations
            .map((location) => cubeCard(location, inventory.find((item) => item.locationId === location.id)))
            .join('')}
        </div>
      </section>

      <section class="workspace-grid">
        <form class="panel action-card" id="add-form">
          ${cardTitle('➕', 'Entry', 'Add SKU into a cube')}
          <div class="form-grid">
            ${textInput('SKU number', 'sku', '', true)}
            ${textInput('Product name', 'productName', '', true)}
            ${textInput('Barcode', 'barcode', '')}
            ${textInput('Lot number', 'lotNumber', '')}
            ${textInput('Supplier', 'supplier', '')}
            <label>Quantity<input name="quantity" type="number" min="1" value="1" required /></label>
            ${locationSelect('Location', 'locationId', defaultLocationId)}
          </div>
          <button type="submit">Add to inventory</button>
        </form>

        <div class="panel action-card">
          ${cardTitle('🔎', 'Find', 'Search SKUs and locations')}
          <label>
            Search by SKU, product, barcode, supplier, lot, or location
            <input id="search-input" value="${escapeHtml(searchTerm)}" placeholder="Try Superior 1 A or SUP-1001" />
          </label>
          <div class="search-results">
            ${filteredInventory.map(inventoryRow).join('') || '<p class="empty-message">No matching inventory found.</p>'}
          </div>
        </div>

        <form class="panel action-card" id="move-form">
          ${cardTitle('↔️', 'Movement', 'Move SKU to another cube')}
          ${inventorySelect('SKU to move', 'itemId', '')}
          ${locationSelect('New location', 'targetLocationId', defaultLocationId)}
          <button type="submit">Move SKU</button>
        </form>

        <form class="panel action-card" id="adjust-form">
          ${cardTitle('🎚️', 'Counts', 'Adjust quantity')}
          ${inventorySelect('SKU to adjust', 'itemId', '')}
          <label>New quantity<input name="quantity" type="number" min="0" value="1" /></label>
          <button type="submit">Update quantity</button>
        </form>
      </section>
    </main>
  `;

  bindEvents();
}

function statCard(label, value) {
  return `<div class="stat-card"><span>${label}</span><strong>${value}</strong></div>`;
}

function cardTitle(icon, eyebrow, title) {
  return `
    <div class="card-title">
      <span class="icon-pill">${icon}</span>
      <div><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>
    </div>
  `;
}

function textInput(label, name, value = '', required = false) {
  return `<label>${label}<input name="${name}" value="${escapeHtml(value)}" ${required ? 'required' : ''} /></label>`;
}

function locationSelect(label, name, value) {
  return `
    <label>${label}
      <select name="${name}">
        ${locations.map((location) => `<option value="${location.id}" ${location.id === value ? 'selected' : ''}>${formatLocation(location.id)}</option>`).join('')}
      </select>
    </label>
  `;
}

function inventorySelect(label, name, value) {
  return `
    <label>${label}
      <select name="${name}" required>
        <option value="">Select a SKU</option>
        ${inventory
          .map(
            (item) =>
              `<option value="${item.id}" ${item.id === value ? 'selected' : ''}>${escapeHtml(item.sku)} — ${escapeHtml(item.productName)} (${formatLocation(item.locationId)})</option>`,
          )
          .join('')}
      </select>
    </label>
  `;
}

function cubeCard(location, item) {
  return `
    <article class="cube-card ${item ? 'occupied' : 'empty'}">
      <span class="location-code">${formatLocation(location.id)}</span>
      <span class="cube-status">${item ? 'Occupied' : 'Empty'}</span>
      ${
        item
          ? `<strong>${escapeHtml(item.sku)}</strong><small>${item.quantity} units</small>`
          : '<small>Ready for SKU entry</small>'
      }
    </article>
  `;
}

function inventoryRow(item) {
  return `
    <article class="inventory-row">
      <div>
        <strong>${escapeHtml(item.sku)}</strong>
        <span>${escapeHtml(item.productName)}</span>
        <small>${formatLocation(item.locationId)} • ${item.quantity} units • Added ${item.dateAdded}</small>
        <small>Lot ${escapeHtml(item.lotNumber || '—')} • Supplier ${escapeHtml(item.supplier || '—')} • Barcode ${escapeHtml(item.barcode || '—')}</small>
      </div>
      <button class="danger-button" type="button" data-remove-id="${item.id}">➖ Remove</button>
    </article>
  `;
}

function bindEvents() {
  document.querySelector('#area-select').addEventListener('change', (event) => {
    selectedArea = event.target.value;
    render();
  });
  document.querySelector('#empty-toggle').addEventListener('change', (event) => {
    showOnlyEmpty = event.target.checked;
    render();
  });
  document.querySelector('#search-input').addEventListener('input', (event) => {
    searchTerm = event.target.value;
    render();
    document.querySelector('#search-input').focus();
  });
  document.querySelector('#add-form').addEventListener('submit', addInventory);
  document.querySelector('#move-form').addEventListener('submit', moveInventory);
  document.querySelector('#adjust-form').addEventListener('submit', adjustQuantity);
  document.querySelectorAll('[data-remove-id]').forEach((button) => {
    button.addEventListener('click', () => removeInventory(button.dataset.removeId));
  });
}

function addInventory(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const sku = String(formData.get('sku')).trim();
  const productName = String(formData.get('productName')).trim();
  const quantity = Number(formData.get('quantity'));

  if (!sku || !productName || quantity < 1) {
    return;
  }

  inventory = [
    {
      id: crypto.randomUUID(),
      sku,
      productName,
      quantity,
      locationId: String(formData.get('locationId')),
      dateAdded: new Date().toISOString().slice(0, 10),
      lotNumber: String(formData.get('lotNumber')).trim(),
      supplier: String(formData.get('supplier')).trim(),
      barcode: String(formData.get('barcode')).trim(),
    },
    ...inventory,
  ];
  saveInventory();
  render();
}

function moveInventory(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const itemId = String(formData.get('itemId'));
  const targetLocationId = String(formData.get('targetLocationId'));

  if (!itemId) {
    return;
  }

  inventory = inventory.map((item) => (item.id === itemId ? { ...item, locationId: targetLocationId } : item));
  saveInventory();
  render();
}

function adjustQuantity(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const itemId = String(formData.get('itemId'));
  const quantity = Number(formData.get('quantity'));

  if (!itemId || quantity < 0) {
    return;
  }

  inventory = inventory.map((item) => (item.id === itemId ? { ...item, quantity } : item));
  saveInventory();
  render();
}

function removeInventory(itemId) {
  inventory = inventory.filter((item) => item.id !== itemId);
  saveInventory();
  render();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
