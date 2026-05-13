const areaConfig = {
  Superior: {
    zones: 29,
    bays: ['A', 'B', 'C', 'D', 'E', 'F'],
    description: 'Primary red inventory area on the west side of the floor plan.',
    color: 'red',
  },
  Michigan: {
    zones: 6,
    bays: ['A', 'B', 'C', 'D', 'E', 'F'],
    description: 'Green center and south inventory area.',
    color: 'green',
  },
  Huron: {
    zones: 18,
    bays: ['A', 'B', 'C', 'D'],
    description: 'Blue inventory area near the east-center lanes.',
    color: 'blue',
  },
  Erie: {
    zones: 10,
    bays: ['A', 'B', 'C', 'D'],
    description: 'Purple inventory area on the far east side.',
    color: 'purple',
  },
};

const floorPlanBlocks = [
  { area: 'Superior', className: 'superior-left' },
  { area: 'Superior', className: 'superior-top' },
  { area: 'Superior', className: 'superior-mid' },
  { area: 'Superior', className: 'superior-right' },
  { area: 'Michigan', className: 'michigan-center' },
  { area: 'Michigan', className: 'michigan-bottom' },
  { area: 'Huron', className: 'huron-left' },
  { area: 'Huron', className: 'huron-right' },
  { area: 'Erie', className: 'erie-right' },
];

const storageKey = 'optimized-warehouse-inventory';
const defaultLocationId = 'Superior-1-A';
const locations = buildLocations();
const validLocationIds = new Set(locations.map((location) => location.id));

let inventory = loadInventory();
let selectedArea = 'Superior';
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
      return JSON.parse(saved).map(normalizeInventoryItem);
    } catch {
      return getDemoInventory();
    }
  }

  return getDemoInventory();
}

function normalizeInventoryItem(item) {
  return {
    ...item,
    locationId: normalizeLocationId(item.locationId),
  };
}

function normalizeLocationId(locationId) {
  if (validLocationIds.has(locationId)) {
    return locationId;
  }

  const legacyAreaMap = {
    West: 'Michigan',
    East: 'Erie',
    Receiving: 'Huron',
  };
  const [area, zone = '1', bay = 'A'] = String(locationId).split('-');
  const mappedArea = legacyAreaMap[area] || area;
  const mappedLocation = `${mappedArea}-${zone}-${bay}`;

  return validLocationIds.has(mappedLocation) ? mappedLocation : defaultLocationId;
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
      sku: 'HUR-2200',
      productName: 'Huron pallet starter',
      quantity: 12,
      locationId: 'Huron-2-B',
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

function getAreaStats(area) {
  const areaLocations = locations.filter((location) => location.area === area);
  const occupied = new Set(
    inventory
      .filter((item) => item.locationId.startsWith(`${area}-`))
      .map((item) => item.locationId),
  ).size;

  return {
    total: areaLocations.length,
    occupied,
    empty: areaLocations.length - occupied,
  };
}

function render() {
  const occupiedLocationIds = new Set(inventory.map((item) => item.locationId).filter((locationId) => validLocationIds.has(locationId)));
  const locationCounts = {
    skus: inventory.length,
    occupied: occupiedLocationIds.size,
    empty: locations.length - occupiedLocationIds.size,
  };
  const selectedAreaConfig = areaConfig[selectedArea];
  const selectedAreaStats = getAreaStats(selectedArea);
  const filteredInventory = inventory.filter((item) => {
    const haystack = [item.sku, item.productName, item.locationId, item.lotNumber, item.supplier, item.barcode]
      .join(' ')
      .toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  root.innerHTML = `
    <main class="app-shell">
      <section class="hero panel">
        <div>
          <img class="logo" src="/tbflogo.png" alt="Company logo" />
          <p class="eyebrow">Warehouse floor plan</p>
          <h1>Optimized Warehouse</h1>
          <p class="hero-copy">A cleaner area map for finding inventory sections first, then managing SKUs by area, zone, and bay.</p>
        </div>
        <div class="stats-grid" aria-label="Warehouse summary">
          ${statCard('SKUs', locationCounts.skus)}
          ${statCard('Occupied locations', locationCounts.occupied)}
          ${statCard('Open locations', locationCounts.empty)}
        </div>
      </section>

      <section class="panel floor-plan-panel">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Visual key</p>
            <h2>Floor plan areas</h2>
            <p>Numbers are intentionally hidden here. Use the area names first, then choose zone and bay in the SKU forms.</p>
          </div>
          <label class="compact-field">
            Selected area
            <select id="area-select">
              ${Object.keys(areaConfig)
                .map((area) => `<option value="${area}" ${area === selectedArea ? 'selected' : ''}>${area}</option>`)
                .join('')}
            </select>
          </label>
        </div>

        <div class="floor-plan" aria-label="Warehouse floor plan key">
          ${floorPlanBlocks.map((block) => floorPlanBlock(block)).join('')}
        </div>

        <div class="area-summary ${selectedAreaConfig.color}">
          <div>
            <p class="eyebrow">Selected</p>
            <h3>${selectedArea}</h3>
            <p>${selectedAreaConfig.description}</p>
          </div>
          <div class="area-metrics">
            ${metric('Zones', selectedAreaConfig.zones)}
            ${metric('Bays', selectedAreaConfig.bays.length)}
            ${metric('Open', selectedAreaStats.empty)}
          </div>
        </div>
      </section>

      <section class="workspace-grid">
        <form class="panel action-card" id="add-form">
          ${cardTitle('Entry', 'Add SKU')}
          <div class="form-grid">
            ${textInput('SKU number', 'sku', '', true)}
            ${textInput('Product name', 'productName', '', true)}
            ${textInput('Barcode', 'barcode', '')}
            ${textInput('Lot number', 'lotNumber', '')}
            ${textInput('Supplier', 'supplier', '')}
            <label>Quantity<input name="quantity" type="number" min="1" value="1" required /></label>
            ${locationSelect('Location', 'locationId', firstLocationForArea(selectedArea))}
          </div>
          <button type="submit">Add to inventory</button>
        </form>

        <div class="panel action-card">
          ${cardTitle('Search', 'Find inventory')}
          <label>
            Search by SKU, product, barcode, supplier, lot, or location
            <input id="search-input" value="${escapeHtml(searchTerm)}" placeholder="Try Superior 1 A or SUP-1001" />
          </label>
          <div class="search-results">
            ${filteredInventory.map(inventoryRow).join('') || '<p class="empty-message">No matching inventory found.</p>'}
          </div>
        </div>

        <form class="panel action-card" id="move-form">
          ${cardTitle('Move', 'Move SKU')}
          ${inventorySelect('SKU to move', 'itemId', '')}
          ${locationSelect('New location', 'targetLocationId', firstLocationForArea(selectedArea))}
          <button type="submit">Move SKU</button>
        </form>

        <form class="panel action-card" id="adjust-form">
          ${cardTitle('Count', 'Adjust quantity')}
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

function metric(label, value) {
  return `<span><strong>${value}</strong>${label}</span>`;
}

function cardTitle(eyebrow, title) {
  return `<div class="card-title"><p class="eyebrow">${eyebrow}</p><h2>${title}</h2></div>`;
}

function floorPlanBlock(block) {
  return `
    <button class="floor-block ${block.className} ${areaConfig[block.area].color} ${block.area === selectedArea ? 'selected' : ''}" type="button" data-area="${block.area}" aria-label="Select ${block.area} area">
      <span>${block.area}</span>
    </button>
  `;
}

function textInput(label, name, value = '', required = false) {
  return `<label>${label}<input name="${name}" value="${escapeHtml(value)}" ${required ? 'required' : ''} /></label>`;
}

function firstLocationForArea(area) {
  return locations.find((location) => location.area === area)?.id || defaultLocationId;
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

function inventoryRow(item) {
  return `
    <article class="inventory-row">
      <div>
        <strong>${escapeHtml(item.sku)}</strong>
        <span>${escapeHtml(item.productName)}</span>
        <small>${formatLocation(item.locationId)} • ${item.quantity} units • Added ${item.dateAdded}</small>
        <small>Lot ${escapeHtml(item.lotNumber || '—')} • Supplier ${escapeHtml(item.supplier || '—')} • Barcode ${escapeHtml(item.barcode || '—')}</small>
      </div>
      <button class="danger-button" type="button" data-remove-id="${item.id}">Remove</button>
    </article>
  `;
}

function bindEvents() {
  document.querySelector('#area-select').addEventListener('change', (event) => {
    selectedArea = event.target.value;
    render();
  });

  document.querySelectorAll('[data-area]').forEach((button) => {
    button.addEventListener('click', () => {
      selectedArea = button.dataset.area;
      render();
    });
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
