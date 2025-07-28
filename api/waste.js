const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
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
    const date = req.query ? req.query.date : undefined;
    if (!date) {
      return res.status(400).json({ error: 'Missing date parameter' });
    }
    const rows = Array.isArray(db.waste) ? db.waste.filter(entry => entry.date === date) : [];
    return res.status(200).json(rows);
  } else if (req.method === 'POST') {
    const { id, date, category, product, quantity, unit, value } = req.body || {};
    if (!date || !category || !product || quantity === undefined || value === undefined || !unit) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    if (id) {
      const entry = db.waste.find(w => w.id === parseInt(id));
      if (!entry) {
        return res.status(404).json({ error: 'Entry not found' });
      }
      entry.date = date;
      entry.category = category;
      entry.product = product;
      entry.quantity = quantity;
      entry.unit = unit;
      entry.value = value;
      await writeDb(db);
      return res.status(200).json({ message: 'Entry updated' });
    } else {
      const duplicate = db.waste.find(w => w.date === date && w.category === category && w.product === product);
      if (duplicate) {
        return res.status(409).json({ error: 'Entry for this product on this date exists' });
      }
      const newId = db.nextWasteId || 1;
      db.nextWasteId = newId + 1;
      db.waste.push({ id: newId, date, category, product, quantity, unit, value });
      await writeDb(db);
      return res.status(201).json({ message: 'Entry saved' });
    }
  } else if (req.method === 'DELETE') {
    const idParam = req.query ? req.query.id : undefined;
    if (!idParam) {
      return res.status(400).json({ error: 'Missing id parameter' });
    }
    const idx = db.waste.findIndex(w => w.id === parseInt(idParam));
    if (idx === -1) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    db.waste.splice(idx, 1);
    await writeDb(db);
    return res.status(200).json({ message: 'Entry deleted' });
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
};
