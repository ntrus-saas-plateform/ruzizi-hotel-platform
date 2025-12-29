import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface PayrollData {
  employeeName: string;
  employeeId: string;
  period: {
    month: number;
    year: number;
  };
  baseSalary: number;
  allowances: Array<{ type: string; amount: number }>;
  deductions: Array<{ type: string; amount: number }>;
  bonuses: Array<{ type: string; amount: number }>;
  totalGross: number;
  totalDeductions: number;
  netSalary: number;
  status: string;
  paidAt?: string;
}

interface PayrollReportData {
  title: string;
  period: string;
  generatedAt: string;
  payrolls: PayrollData[];
  summary: {
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
  };
}

export class PayrollPDFGenerator {
  private doc: PDFDocument | null = null;
  private font: any = null;
  private page: any = null;

  constructor() {}

  /**
   * Sanitize text to remove characters that cannot be encoded in WinAnsi
   */
  private sanitizeText(text: string): string {
    return text
      .replace(/[\u202f]/g, ' ') // Replace narrow no-break space with regular space
      .replace(/[\u00a0]/g, ' ') // Replace regular no-break space with regular space
      .replace(/[\u2000-\u200f\u2028-\u202f\u205f-\u206f]/g, '') // Remove other unicode spaces
      .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
      .replace(/[\u201c\u201d]/g, '"') // Replace smart double quotes
      .replace(/[\u2013\u2014]/g, '-') // Replace en/em dashes
      .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, '?'); // Replace other non-ASCII chars with ?
  }

  /**
   * Helper method to draw sanitized text
   */
  private drawSanitizedText(text: string, options: any): void {
    if (!this.page || !this.font) return;
    this.page.drawText(this.sanitizeText(text), options);
  }

  async generatePayrollSlip(data: PayrollData): Promise<Uint8Array> {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.page = this.doc.addPage();
    await this.addHeader('BULLETIN DE PAIE', data.employeeName);
    await this.addEmployeeInfo(data);
    await this.addPayrollDetails(data);
    await this.addFooter();

    return await this.doc.save();
  }

  async generateMonthlyReport(data: PayrollReportData): Promise<Uint8Array> {
    try {
      console.log('🔄 generateMonthlyReport started with data:', {
        title: data.title,
        period: data.period,
        payrollsCount: data.payrolls?.length || 0,
        summary: data.summary
      });

      this.doc = await PDFDocument.create();
      this.font = await this.doc.embedFont(StandardFonts.Helvetica);
      this.page = this.doc.addPage();
      
      await this.addHeader(data.title, `Période: ${data.period}`);
      await this.addSummarySection(data.summary);
      await this.addPayrollTable(data.payrolls);
      await this.addFooter();

      const result = await this.doc.save();
      console.log('✅ PDF generated successfully, size:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error in generateMonthlyReport:', error);
      throw error;
    }
  }

  private async addHeader(title: string, subtitle: string): Promise<void> {
    if (!this.page || !this.font) return;
    const { width } = this.page.getSize();

    this.drawSanitizedText('RUZIZI HÔTEL', {
      x: width / 2 - 40,
      y: 750,
      size: 20,
      font: this.font,
      color: rgb(0, 0, 0),
    });

    this.drawSanitizedText(title, {
      x: width / 2 - 50,
      y: 720,
      size: 16,
      font: this.font,
      color: rgb(0, 0, 0),
    });

    this.drawSanitizedText(subtitle, {
      x: width / 2 - 60,
      y: 690,
      size: 12,
      font: this.font,
      color: rgb(0, 0, 0),
    });

    this.page.drawLine({
      start: { x: 50, y: 670 },
      end: { x: width - 50, y: 670 },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  }

  private async addEmployeeInfo(data: PayrollData): Promise<void> {
    if (!this.page || !this.font) return;

    let y = 640;
    this.drawSanitizedText('Informations Employé', {
      x: 50,
      y,
      size: 11,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    this.drawSanitizedText(`Nom: ${data.employeeName}`, {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    this.drawSanitizedText(`Matricule: ${data.employeeId}`, {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    this.drawSanitizedText(`Période: ${this.formatPeriod(data.period)}`, {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });

    this.page.drawLine({
      start: { x: 50, y: y - 10 },
      end: { x: 550, y: y - 10 },
      thickness: 0.3,
      color: rgb(0, 0, 0),
    });
  }

  private async addPayrollDetails(data: PayrollData): Promise<void> {
    if (!this.page || !this.font) return;
    let y = 560;

    this.drawSanitizedText('SALAIRE DE BASE', {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    this.drawSanitizedText(`${data.baseSalary.toLocaleString()} BIF`, {
      x: 450,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    if (data.allowances.length > 0) {
      this.drawSanitizedText('AVANTAGES', {
        x: 50,
        y,
        size: 10,
        font: this.font,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      data.allowances.forEach(allowance => {
        this.drawSanitizedText(allowance.type, {
          x: 70,
          y,
          size: 9,
          font: this.font,
          color: rgb(0, 0, 0),
        });
        this.drawSanitizedText(`${allowance.amount.toLocaleString()} BIF`, {
          x: 450,
          y,
          size: 9,
          font: this.font,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      });
    }

    if (data.bonuses.length > 0) {
      this.drawSanitizedText('PRIMES', {
        x: 50,
        y,
        size: 10,
        font: this.font,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      data.bonuses.forEach(bonus => {
        this.drawSanitizedText(bonus.type, {
          x: 70,
          y,
          size: 9,
          font: this.font,
          color: rgb(0, 0, 0),
        });
        this.drawSanitizedText(`${bonus.amount.toLocaleString()} BIF`, {
          x: 450,
          y,
          size: 9,
          font: this.font,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      });
    }

    y -= 5;
    this.page.drawLine({
      start: { x: 50, y },
      end: { x: 550, y },
      thickness: 0.3,
      color: rgb(0, 0, 0),
    });
    y -= 15;

    this.drawSanitizedText('TOTAL BRUT', {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    this.drawSanitizedText(`${data.totalGross.toLocaleString()} BIF`, {
      x: 450,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    if (data.deductions.length > 0) {
      this.drawSanitizedText('DÉDUCTIONS', {
        x: 50,
        y,
        size: 10,
        font: this.font,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      data.deductions.forEach(deduction => {
        this.drawSanitizedText(deduction.type, {
          x: 70,
          y,
          size: 9,
          font: this.font,
          color: rgb(0, 0, 0),
        });
        this.drawSanitizedText(`-${deduction.amount.toLocaleString()} BIF`, {
          x: 450,
          y,
          size: 9,
          font: this.font,
          color: rgb(0, 0, 0),
        });
        y -= 15;
      });
    }

    y -= 5;
    this.page.drawLine({
      start: { x: 50, y },
      end: { x: 550, y },
      thickness: 0.3,
      color: rgb(0, 0, 0),
    });
    y -= 15;

    this.drawSanitizedText('TOTAL DÉDUCTIONS', {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    this.drawSanitizedText(`-${data.totalDeductions.toLocaleString()} BIF`, {
      x: 450,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 25;

    this.page.drawLine({
      start: { x: 50, y },
      end: { x: 550, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    this.drawSanitizedText('SALAIRE NET À PAYER', {
      x: 50,
      y,
      size: 12,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    this.drawSanitizedText(`${data.netSalary.toLocaleString()} BIF`, {
      x: 450,
      y,
      size: 12,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 25;

    this.drawSanitizedText(`Statut: ${data.status.toUpperCase()}`, {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    if (data.paidAt) {
      this.drawSanitizedText(`Payé le: ${new Date(data.paidAt).toLocaleDateString('fr-FR')}`, {
        x: 50,
        y: y - 15,
        size: 10,
        font: this.font,
        color: rgb(0, 0, 0),
      });
    }
  }

  private async addSummarySection(summary: PayrollReportData['summary']): Promise<void> {
    if (!this.page || !this.font) return;
    let y = 600;

    this.drawSanitizedText('RÉSUMÉ MENSUEL', {
      x: 50,
      y,
      size: 12,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 20;

    this.drawSanitizedText(`Nombre d'employés: ${summary.totalEmployees}`, {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 15;
    this.drawSanitizedText(`Total brut: ${summary.totalGross.toLocaleString()} BIF`, {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 15;
    this.drawSanitizedText(`Total déductions: ${summary.totalDeductions.toLocaleString()} BIF`, {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    y -= 15;
    this.drawSanitizedText(`Total net: ${summary.totalNet.toLocaleString()} BIF`, {
      x: 50,
      y,
      size: 10,
      font: this.font,
      color: rgb(0, 0, 0),
    });

    this.page.drawLine({
      start: { x: 50, y: y - 10 },
      end: { x: 550, y: y - 10 },
      thickness: 0.3,
      color: rgb(0, 0, 0),
    });
  }

  private async addPayrollTable(payrolls: PayrollData[]): Promise<void> {
    try {
      console.log('📊 addPayrollTable called with', payrolls?.length || 0, 'payrolls');
      
      if (!this.page || !this.font) return;
      let y = 500;

      this.drawSanitizedText('Employé', {
        x: 50,
        y,
        size: 9,
        font: this.font,
        color: rgb(0, 0, 0),
      });
      this.drawSanitizedText('Brut', {
        x: 200,
        y,
        size: 9,
        font: this.font,
        color: rgb(0, 0, 0),
      });
      this.drawSanitizedText('Déductions', {
        x: 300,
        y,
        size: 9,
        font: this.font,
        color: rgb(0, 0, 0),
      });
      this.drawSanitizedText('Net', {
        x: 420,
        y,
        size: 9,
        font: this.font,
        color: rgb(0, 0, 0),
      });

      this.page.drawLine({
        start: { x: 50, y: y - 5 },
        end: { x: 550, y: y - 5 },
        thickness: 0.3,
        color: rgb(0, 0, 0),
      });
      y -= 15;

      if (payrolls && payrolls.length > 0) {
        payrolls.forEach((payroll, index) => {
          console.log(`📝 Processing payroll ${index + 1}:`, {
            employeeName: payroll.employeeName,
            totalGross: payroll.totalGross,
            totalDeductions: payroll.totalDeductions,
            netSalary: payroll.netSalary
          });

          if (y < 100 && this.doc) {
            this.page = this.doc.addPage();
            y = 750;
          }

          this.drawSanitizedText(payroll.employeeName?.substring(0, 25) || 'Unknown', {
            x: 50,
            y,
            size: 8,
            font: this.font,
            color: rgb(0, 0, 0),
          });
          this.drawSanitizedText((payroll.totalGross || 0).toLocaleString(), {
            x: 200,
            y,
            size: 8,
            font: this.font,
            color: rgb(0, 0, 0),
          });
          this.drawSanitizedText((payroll.totalDeductions || 0).toLocaleString(), {
            x: 300,
            y,
            size: 8,
            font: this.font,
            color: rgb(0, 0, 0),
          });
          this.drawSanitizedText((payroll.netSalary || 0).toLocaleString(), {
            x: 420,
            y,
            size: 8,
            font: this.font,
            color: rgb(0, 0, 0),
          });
          y -= 12;
        });
      } else {
        console.log('⚠️ No payrolls data to display in table');
      }
    } catch (error) {
      console.error('❌ Error in addPayrollTable:', error);
      throw error;
    }
  }

  private async addFooter(): Promise<void> {
    if (!this.page || !this.font) return;
    const { height, width } = this.page.getSize();

    this.drawSanitizedText('Généré le ' + new Date().toLocaleDateString('fr-FR'), {
      x: 50,
      y: 50,
      size: 8,
      font: this.font,
      color: rgb(0, 0, 0),
    });
    this.drawSanitizedText('Ruzizi Hôtel - Système RH', {
      x: width - 150,
      y: 50,
      size: 8,
      font: this.font,
      color: rgb(0, 0, 0),
    });
  }

  private formatPeriod(period: { month: number; year: number }): string {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[period.month - 1]} ${period.year}`;
  }

  async downloadPDF(filename: string): Promise<void> {
    if (!this.doc) return;
    const bytes = await this.doc.save();
    const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async getBlob(): Promise<Blob> {
    if (!this.doc) throw new Error('PDF not initialized');
    const bytes = await this.doc.save();
    return new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  }
}
