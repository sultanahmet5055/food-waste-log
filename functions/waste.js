const {
  getWasteByDate,
  addOrUpdateWaste,
  deleteWaste
} = require('./db');

exports.handler = async (event, context) => {
  const method = event.httpMethod;
  try {
    if (method === 'GET') {
      const date = event.queryStringParameters && event.queryStringParameters.date;
      if (!date) {
        return { statusCode: 400, body: 'Missing date parameter' };
      }
      const rows = getWasteByDate(date);
      return {
        statusCode: 200,
        body: JSON.stringify(rows)
      };
    } else if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { id, date, category, product, quantity, unit, value } = body;
      if (!date || !category || !product || quantity == null || value == null || !unit) {
        return { statusCode: 400, body: 'Missing fields' };
      }
      // If id present, update existing entry
      if (id) {
        try {
          const result = addOrUpdateWaste({ id, date, category, product, quantity, unit, value });
          return { statusCode: 200, body: JSON.stringify(result) };
        } catch (err) {
          if (err.message.includes('not found')) {
            return { statusCode: 404, body: err.message };
          }
          throw err;
        }
      }
      // Check for duplicate (same date, category, product)
      try {
        const result = addOrUpdateWaste({ date, category, product, quantity, unit, value });
        return { statusCode: 201, body: JSON.stringify(result) };
      } catch (err) {
        if (err.message.includes('exists')) {
          return { statusCode: 409, body: err.message };
        }
        throw err;
      }
    } else if (method === 'DELETE') {
      const id = event.queryStringParameters && event.queryStringParameters.id;
      if (!id) {
        return { statusCode: 400, body: 'Missing id parameter' };
      }
      try {
        const result = deleteWaste(id);
        return { statusCode: 200, body: JSON.stringify(result) };
      } catch (err) {
        if (err.message.includes('not found')) {
          return { statusCode: 404, body: err.message };
        }
        throw err;
      }
    }
    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
  }
};