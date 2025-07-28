const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    // If file missing, initialize default schema
    const db = { products: [], waste: [], nextProductId: 1, nextWasteId: 1 };
    await writeDb(db);
    return db;
  }
}

async function writeDb(db) {
  await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
}

module.exports = async (req, res) => {
  const db = await readDb();
  if (req.method === 'GET') {
    const categorized = {};
    if (Array.isArray(db.products)) {
      db.products.forEach(prod => {
        if (!categorized[prod.category]) categorized[prod.category] = {};
        categorized[prod.category][prod.name] = { price: prod.price, unit: prod.unit };
      });
    }
    res.status(200).json(categorized);
  } else if (req.method === 'POST') {
    const { category, name, price, unit, oldCategory, oldName } = req.body || {};
    if (!category || !name || price === undefined || !unit) {
      return res.status(400).json({ error: 'Invalid product data' });
    }
    // Update existing product
    if (oldCategory && oldName) {
      const existing = db.products.find(p => p.category === oldCategory && p.name === oldName);
      if (!existing) {
        return res.status(404).json({ error: 'Original product not found' });
      }
      // Check for duplicate if category or name changed
      if (category !== oldCategory || name !== oldName) {
        const dup = db.products.find(p => p.category === category && p.name === name);
        if (dup) {
          return res.status(409).json({ error: 'Product with same name already exists in this category' });
        }
      }
      existing.category = category;
      existing.name = name;
      existing.price = parseFloat(price);
      existing.unit = unit;
      await writeDb(db);
      return res.status(200).json({ message: 'Product updated' });
    } else {
      // Add new product
      const dup = db.products.find(p => p.category === category && p.name === name);
      if (dup) {
        return res.status(409).json({ error: 'Product already exists' });
      }
      const id = db.nextProductId || 1;
      db.nextProductId = id + 1;
      db.products.push({ id, category, name, price: parseFloat(price), unit });
      await writeDb(db);
      return res.status(201).json({ message: 'Product added' });
    }
  } else if (req.method === 'DELETE') {
    const { category, name } = req.query || {};
    if (!category || !name) {
      return res.status(400).json({ error: 'Missing category or name' });
    }
    const index = db.products.findIndex(p => p.category === category && p.name === name);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    db.products.splice(index, 1);
    await writeDb(db);
    return res.status(200).json({ message: 'Product deleted' });
  } else {
    res.setHeader('Allow', ['GET','POST','DELETE']);
    res.status(405).json({ error: 'Method Not Allowed' });
  }
};
