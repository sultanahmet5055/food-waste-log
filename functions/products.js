const {
  getCategorizedProducts,
  addOrUpdateProduct,
  deleteProduct
} = require('./db');

// Netlify function to handle products CRUD.
exports.handler = async (event, context) => {
  const method = event.httpMethod;
  try {
    if (method === 'GET') {
      // Return all products grouped by category.
      const categorized = getCategorizedProducts();
      return {
        statusCode: 200,
        body: JSON.stringify(categorized)
      };
    } else if (method === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { category, name, price, unit, oldCategory, oldName } = body;
      if (!category || !name || price == null || !unit) {
        return {
          statusCode: 400,
          body: 'Invalid product data'
        };
      }
      // If editing existing product
      if (oldCategory && oldName) {
        try {
          const result = addOrUpdateProduct({ category, name, price, unit, oldCategory, oldName });
          return {
            statusCode: 200,
            body: JSON.stringify(result)
          };
        } catch (err) {
          if (err.message.includes('Original product not found')) {
            return { statusCode: 404, body: err.message };
          }
          if (err.message.includes('already exists')) {
            return { statusCode: 409, body: err.message };
          }
          throw err;
        }
      } else {
        // Adding a new product
        try {
          const result = addOrUpdateProduct({ category, name, price, unit });
          return {
            statusCode: 201,
            body: JSON.stringify(result)
          };
        } catch (err) {
          if (err.message.includes('already exists')) {
            return { statusCode: 409, body: err.message };
          }
          throw err;
        }
      }
    } else if (method === 'DELETE') {
      // Delete product
      const category = event.queryStringParameters && event.queryStringParameters.category;
      const name = event.queryStringParameters && event.queryStringParameters.name;
      if (!category || !name) {
        return { statusCode: 400, body: 'Missing category or name' };
      }
      try {
        const result = deleteProduct(category, name);
        return {
          statusCode: 200,
          body: JSON.stringify(result)
        };
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