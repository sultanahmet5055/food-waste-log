const fs = require('fs');
const path = require('path');

// Path to the JSON database file. We keep it in the project root under the data folder.
const dbPath = path.resolve(__dirname, '../data/db.json');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Read the JSON database from disk. If it doesn't exist, create with default values.
function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading DB:', err);
  }
  // If file doesn't exist or failed to read, initialize with defaults
  const db = {
    products: [],
    waste: [],
    nextProductId: 1,
    nextWasteId: 1
  };
  // Populate default products similar to the original localStorage data.
  const defaults = {
    soups: {
      'Lentil Soup': { price: 0.005, unit: 'g' },
      'Chicken Soup': { price: 0.005, unit: 'g' }
    },
    grilled_meats_proteins: {
      'Chicken Shish': { price: 5, unit: 'skewer' },
      'Veal Shish': { price: 5, unit: 'skewer' },
      'Lamb Shish': { price: 5, unit: 'skewer' },
      'Kofte': { price: 5, unit: 'pcs' },
      'Falafel': { price: 5, unit: 'pcs' },
      'Lamb Chops': { price: 5, unit: 'pcs' },
      'Chicken Adana': { price: 5, unit: 'skewer' },
      'Beef Adana': { price: 5, unit: 'skewer' },
      'Chicken Doner': { price: 5, unit: 'kg' },
      'Beef Doner': { price: 5, unit: 'kg' }
    },
    meze_cold_appetizers: {
      'Eggplant Salad': { price: 0.005, unit: 'g' },
      'Baba Ganoush': { price: 0.005, unit: 'g' },
      'Ezme': { price: 0.005, unit: 'g' },
      'Humus': { price: 0.005, unit: 'g' },
      'Cacik': { price: 0.005, unit: 'g' },
      'Sarma / Dolma': { price: 0.005, unit: 'g' }
    },
    breads_dough: {
      Bread: { price: 5, unit: 'pcs' },
      'Pide Dough': { price: 5, unit: 'pcs' },
      Lavash: { price: 5, unit: 'pcs' },
      'Summit Bread': { price: 5, unit: 'pcs' }
    },
    fresh_garnishes_produce: {
      Lettuce: { price: 0.005, unit: 'g' },
      'Tomato Slices': { price: 0.005, unit: 'g' },
      'Onion Slices': { price: 0.005, unit: 'g' },
      'Pickled Red Cabbage': { price: 0.005, unit: 'g' },
      Tomato: { price: 0.005, unit: 'g' },
      Parsley: { price: 0.005, unit: 'g' },
      'Pomegranate Seeds': { price: 0.005, unit: 'g' },
      'Pomegranate (Whole)': { price: 5, unit: 'pcs' }
    },
    sides_grains: {
      Bulgur: { price: 5, unit: 'kg' },
      Rice: { price: 5, unit: 'kg' },
      Fries: { price: 5, unit: 'kg' }
    },
    fruits: {
      Watermelon: { price: 0.005, unit: 'g' },
      Grapes: { price: 0.005, unit: 'g' },
      Strawberries: { price: 0.005, unit: 'g' }
    },
    desserts: {
      'Sutlac / Rice Pudding': { price: 0.005, unit: 'g' },
      'Pistachio Baklava': { price: 5, unit: 'pcs' },
      'Havuc Baklava': { price: 5, unit: 'pcs' },
      'Cold Baklava': { price: 5, unit: 'pcs' }
    }
  };
  for (const category in defaults) {
    for (const name in defaults[category]) {
      const { price, unit } = defaults[category][name];
      db.products.push({ id: db.nextProductId++, category, name, price, unit });
    }
  }
  writeDb(db);
  return db;
}

// Write the JSON database back to disk
function writeDb(db) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// Public API: get categorized products
function getCategorizedProducts() {
  const db = readDb();
  const categorized = {};
  db.products.forEach(prod => {
    if (!categorized[prod.category]) categorized[prod.category] = {};
    categorized[prod.category][prod.name] = { price: prod.price, unit: prod.unit };
  });
  return categorized;
}

// Public API: add or update product
function addOrUpdateProduct({ category, name, price, unit, oldCategory, oldName }) {
  const db = readDb();
  // If editing existing product
  if (oldCategory != null && oldName != null) {
    const existing = db.products.find(p => p.category === oldCategory && p.name === oldName);
    if (!existing) throw new Error('Original product not found');
    // Check duplication if name or category changed
    if (category !== oldCategory || name !== oldName) {
      const dup = db.products.find(p => p.category === category && p.name === name);
      if (dup) throw new Error('Product with same name already exists in this category');
    }
    existing.category = category;
    existing.name = name;
    existing.price = price;
    existing.unit = unit;
    writeDb(db);
    return { message: 'Product updated' };
  } else {
    // Adding new product
    const dup = db.products.find(p => p.category === category && p.name === name);
    if (dup) throw new Error('Product already exists');
    const id = db.nextProductId++;
    db.products.push({ id, category, name, price, unit });
    writeDb(db);
    return { message: 'Product added' };
  }
}

// Public API: delete product
function deleteProduct(category, name) {
  const db = readDb();
  const index = db.products.findIndex(p => p.category === category && p.name === name);
  if (index < 0) throw new Error('Product not found');
  db.products.splice(index, 1);
  writeDb(db);
  return { message: 'Product deleted' };
}

// Public API: get waste entries for a date
function getWasteByDate(date) {
  const db = readDb();
  return db.waste.filter(entry => entry.date === date);
}

// Public API: add or update waste entry
function addOrUpdateWaste({ id, date, category, product, quantity, unit, value }) {
  const db = readDb();
  if (id) {
    const existing = db.waste.find(w => w.id === id);
    if (!existing) throw new Error('Entry not found');
    existing.date = date;
    existing.category = category;
    existing.product = product;
    existing.quantity = quantity;
    existing.unit = unit;
    existing.value = value;
    writeDb(db);
    return { message: 'Entry updated' };
  }
  // Check duplicate same date/category/product
  const dup = db.waste.find(w => w.date === date && w.category === category && w.product === product);
  if (dup) throw new Error('Entry for this product on this date exists. Edit instead.');
  const newId = db.nextWasteId++;
  db.waste.push({ id: newId, date, category, product, quantity, unit, value });
  writeDb(db);
  return { message: 'Entry saved' };
}

// Public API: delete waste entry
function deleteWaste(id) {
  const db = readDb();
  const index = db.waste.findIndex(w => w.id === parseInt(id));
  if (index < 0) throw new Error('Entry not found');
  db.waste.splice(index, 1);
  writeDb(db);
  return { message: 'Entry deleted' };
}

// Public API: generate report summary
function generateReport(start, end) {
  const db = readDb();
  const byProduct = {};
  const byCategory = {};
  let total = 0;
  db.waste.forEach(entry => {
    if (start && end) {
      if (entry.date < start || entry.date > end) return;
    }
    const val = parseFloat(entry.value);
    byProduct[entry.product] = (byProduct[entry.product] || 0) + val;
    byCategory[entry.category] = (byCategory[entry.category] || 0) + val;
    total += val;
  });
  return { byProduct, byCategory, total };
}

module.exports = {
  getCategorizedProducts,
  addOrUpdateProduct,
  deleteProduct,
  getWasteByDate,
  addOrUpdateWaste,
  deleteWaste,
  generateReport,
  readDb,
  writeDb
};