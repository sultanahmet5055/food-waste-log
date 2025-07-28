const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'db.json');

async function readDb() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data || '{}');
  } catch (err) {
    const db = { products: [], waste: [], nextProductId: 1, nextWasteId: 1 };
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2));
    return db;
  }
}

function computeSummary(db, start, end) {
  const byProduct = {};
  const byCategory = {};
  let total = 0;
  const entries = Array.isArray(db.waste) ? db.waste : [];
  entries.forEach(entry => {
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

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const db = await readDb();
  const { start, end, format } = req.query || {};
  const summary = computeSummary(db, start, end);
  if (format === 'csv') {
    let csv = 'Type,Name,Value ($)\n';
    Object.entries(summary.byProduct).forEach(([name, value]) => {
      csv += `byProduct,${name},${value.toFixed(2)}\n`;
    });
    Object.entries(summary.byCategory).forEach(([name, value]) => {
      csv += `byCategory,${name},${value.toFixed(2)}\n`;
    });
    csv += `total,Total,${summary.total.toFixed(2)}\n`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="waste_report.csv"');
    return res.status(200).send(csv);
  }
  return res.status(200).json(summary);
};
