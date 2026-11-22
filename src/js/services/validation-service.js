/**
 * Pure Data Quality CSV Validation Service
 */

export class ValidationService {
  /**
   * Validates CSV text against 10 strict data quality constraints.
   */
  static validate(csvText) {
    const lines = (csvText || '').trim().split('\n').filter(l => l.trim().length > 0);

    if (lines.length <= 1) {
      return {
        totalRecords: 0,
        validCount: 0,
        warningCount: 0,
        errorCount: 0,
        issues: [],
        status: 'DATASET EMPTY',
        badgeClass: 'badge-risk'
      };
    }

    const rows = lines.slice(1);
    let valid = 0;
    let warnings = 0;
    let errors = 0;
    const issues = [];
    const seenIds = new Set();
    const standardUOMs = ['EA', 'KG', 'PC', 'M', 'L'];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const cols = row.split(',').map(c => c.trim());
      const compId = cols[0] || '';
      const stock = parseFloat(cols[1]);
      const demand = parseFloat(cols[2]);
      const leadTime = parseFloat(cols[3]);
      const uom = cols[4] || '';
      const replId = cols[5] || '';
      const supplier = cols[6] || '';
      const targetDate = cols[7] || '';

      let rowHasError = false;
      let rowHasWarning = false;

      // 1. Missing component ID
      if (!compId) {
        issues.push({ row: rowNum, id: '[EMPTY]', desc: 'Missing component ID', sev: 'ERROR' });
        rowHasError = true;
      }

      // 2. Duplicate component ID
      if (compId && seenIds.has(compId)) {
        issues.push({ row: rowNum, id: compId, desc: `Duplicate component record (${compId})`, sev: 'ERROR' });
        rowHasError = true;
      }
      if (compId) seenIds.add(compId);

      // 3. Negative inventory stock
      if (isNaN(stock) || stock < 0) {
        issues.push({ row: rowNum, id: compId || '[UNKNOWN]', desc: `Invalid / negative inventory stock (${cols[1] || 'EMPTY'})`, sev: 'ERROR' });
        rowHasError = true;
      }

      // 4. Missing / Zero demand
      if (isNaN(demand) || demand <= 0) {
        issues.push({ row: rowNum, id: compId || '[UNKNOWN]', desc: 'Zero or missing daily production demand', sev: 'WARNING' });
        rowHasWarning = true;
      }

      // 5. Invalid / malformed date
      if (!targetDate || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate) || isNaN(Date.parse(targetDate))) {
        issues.push({ row: rowNum, id: compId || '[UNKNOWN]', desc: `Invalid or malformed target date (${targetDate || 'MISSING'})`, sev: 'ERROR' });
        rowHasError = true;
      }

      // 6. Negative lead time
      if (isNaN(leadTime) || leadTime < 0) {
        issues.push({ row: rowNum, id: compId || '[UNKNOWN]', desc: `Invalid supplier lead time (${cols[3] || 'EMPTY'})`, sev: 'ERROR' });
        rowHasError = true;
      }

      // 7. Inconsistent UOM
      if (!standardUOMs.includes(uom.toUpperCase())) {
        issues.push({ row: rowNum, id: compId || '[UNKNOWN]', desc: `Non-standard unit of measure (${uom || 'EMPTY'})`, sev: 'WARNING' });
        rowHasWarning = true;
      }

      // 8. Missing replacement part reference
      if (!replId) {
        issues.push({ row: rowNum, id: compId || '[UNKNOWN]', desc: 'Missing replacement component reference', sev: 'ERROR' });
        rowHasError = true;
      }

      // 9. Unconfirmed supplier status
      if (!supplier || supplier.toUpperCase() === 'UNCONFIRMED' || supplier.toUpperCase() === 'PENDING') {
        issues.push({ row: rowNum, id: compId || '[UNKNOWN]', desc: `Unconfirmed supplier schedule status (${supplier || 'EMPTY'})`, sev: 'WARNING' });
        rowHasWarning = true;
      }

      if (rowHasError) {
        errors++;
      } else if (rowHasWarning) {
        warnings++;
      } else {
        valid++;
      }
    });

    let status = 'DATA QUALITY PASS';
    let badgeClass = 'badge-feasible';

    if (errors > 0) {
      status = `${errors} ERRORS — EXECUTION BLOCKED`;
      badgeClass = 'badge-risk';
    } else if (warnings > 0) {
      status = `${warnings} WARNINGS (CAUTION)`;
      badgeClass = 'badge-warning';
    }

    return {
      totalRecords: rows.length,
      validCount: valid,
      warningCount: warnings,
      errorCount: errors,
      issues,
      status,
      badgeClass
    };
  }
}
