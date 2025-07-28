const { generateReport } = require('./db');

exports.handler = async (event, context) => {
  const method = event.httpMethod;
  if (method !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }
  try {
    const params = event.queryStringParameters || {};
    const start = params.start;
    const end = params.end;
    const format = params.format;
    const summary = generateReport(start, end);
    if (format === 'csv') {
      // Build CSV content
      let csv = 'Type,Name,Value ($)\n';
      Object.keys(summary.byProduct).forEach(name => {
        csv += `byProduct,${name},${summary.byProduct[name].toFixed(2)}\n`;
      });
      Object.keys(summary.byCategory).forEach(name => {
        csv += `byCategory,${name},${summary.byCategory[name].toFixed(2)}\n`;
      });
      csv += `total,Total,${summary.total.toFixed(2)}\n`;
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="waste_report.csv"'
        },
        body: csv
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify(summary)
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Server error' };
  }
};