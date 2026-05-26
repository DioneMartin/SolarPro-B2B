import { Injectable } from '@nestjs/common';
import { MonthlyKwh } from '../value-objects/monthly-kwh.vo';

@Injectable()
export class UtilityBillParser {
  /**
   * Parses OCR text to extract monthly consumption.
   * This is a naive implementation for the initial scope.
   */
  parse(text: string, tenantHints?: any): MonthlyKwh[] {
    const months: MonthlyKwh[] = [];
    const lines = text.split('\n');
    
    // Very basic heuristic: line has format "YYYY MM kwh"
    const regex = /(\d{4})\s+(\d{1,2})\s+(\d+(\.\d+)?)/;
    
    for (const line of lines) {
      const match = regex.exec(line);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const kwh = parseFloat(match[3]);
        if (month >= 1 && month <= 12 && kwh >= 0) {
          months.push(MonthlyKwh.create(year, month, kwh));
        }
      }
    }
    
    return months;
  }
}
