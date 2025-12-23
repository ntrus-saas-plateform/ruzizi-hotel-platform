import jsPDF from 'jspdf';

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
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  generatePayrollSlip(data: PayrollData): Uint8Array {
    this.doc = new jsPDF();
    this.addHeader('BULLETIN DE PAIE', data.employeeName);
    this.addEmployeeInfo(data);
    this.addPayrollDetails(data);
    this.addFooter();

    return this.doc.output('arraybuffer') as Uint8Array;
  }

  generateMonthlyReport(data: PayrollReportData): Uint8Array {
    this.doc = new jsPDF();
    this.addHeader(data.title, `Période: ${data.period}`);
    this.addSummarySection(data.summary);
    this.addPayrollTable(data.payrolls);
    this.addFooter();

    return this.doc.output('arraybuffer') as Uint8Array;
  }

  private addHeader(title: string, subtitle: string): void {
    // Logo/Company header
    this.doc.setFontSize(20);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RUZIZI HÔTEL', 105, 20, { align: 'center' });

    this.doc.setFontSize(16);
    this.doc.text(title, 105, 35, { align: 'center' });

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(subtitle, 105, 45, { align: 'center' });

    // Line separator
    this.doc.setLineWidth(0.5);
    this.doc.line(20, 50, 190, 50);
  }

  private addEmployeeInfo(data: PayrollData): void {
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Informations Employé', 20, 65);

    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Nom: ${data.employeeName}`, 20, 75);
    this.doc.text(`Matricule: ${data.employeeId}`, 20, 85);
    this.doc.text(`Période: ${this.formatPeriod(data.period)}`, 20, 95);

    // Line separator
    this.doc.setLineWidth(0.3);
    this.doc.line(20, 100, 190, 100);
  }

  private addPayrollDetails(data: PayrollData): void {
    let yPos = 110;

    // Salaire de base
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SALAIRE DE BASE', 20, yPos);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${data.baseSalary.toLocaleString()} BIF`, 150, yPos, { align: 'right' });
    yPos += 10;

    // Avantages
    if (data.allowances.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('AVANTAGES', 20, yPos);
      yPos += 8;

      this.doc.setFont('helvetica', 'normal');
      data.allowances.forEach(allowance => {
        this.doc.text(allowance.type, 30, yPos);
        this.doc.text(`${allowance.amount.toLocaleString()} BIF`, 150, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    // Primes
    if (data.bonuses.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('PRIMES', 20, yPos);
      yPos += 8;

      this.doc.setFont('helvetica', 'normal');
      data.bonuses.forEach(bonus => {
        this.doc.text(bonus.type, 30, yPos);
        this.doc.text(`${bonus.amount.toLocaleString()} BIF`, 150, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    // Total brut
    yPos += 5;
    this.doc.setLineWidth(0.3);
    this.doc.line(20, yPos, 190, yPos);
    yPos += 8;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TOTAL BRUT', 20, yPos);
    this.doc.text(`${data.totalGross.toLocaleString()} BIF`, 150, yPos, { align: 'right' });
    yPos += 10;

    // Déductions
    if (data.deductions.length > 0) {
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('DÉDUCTIONS', 20, yPos);
      yPos += 8;

      this.doc.setFont('helvetica', 'normal');
      data.deductions.forEach(deduction => {
        this.doc.text(deduction.type, 30, yPos);
        this.doc.text(`-${deduction.amount.toLocaleString()} BIF`, 150, yPos, { align: 'right' });
        yPos += 6;
      });
    }

    // Total déductions
    yPos += 5;
    this.doc.setLineWidth(0.3);
    this.doc.line(20, yPos, 190, yPos);
    yPos += 8;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('TOTAL DÉDUCTIONS', 20, yPos);
    this.doc.text(`-${data.totalDeductions.toLocaleString()} BIF`, 150, yPos, { align: 'right' });
    yPos += 15;

    // Salaire net
    this.doc.setLineWidth(0.5);
    this.doc.line(20, yPos, 190, yPos);
    yPos += 10;

    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('SALAIRE NET À PAYER', 20, yPos);
    this.doc.text(`${data.netSalary.toLocaleString()} BIF`, 150, yPos, { align: 'right' });
    yPos += 15;

    // Statut
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Statut: ${data.status.toUpperCase()}`, 20, yPos);
    if (data.paidAt) {
      this.doc.text(`Payé le: ${new Date(data.paidAt).toLocaleDateString('fr-FR')}`, 20, yPos + 8);
    }
  }

  private addSummarySection(summary: PayrollReportData['summary']): void {
    let yPos = 65;

    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('RÉSUMÉ MENSUEL', 20, yPos);
    yPos += 15;

    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Nombre d'employés: ${summary.totalEmployees}`, 20, yPos);
    yPos += 8;
    this.doc.text(`Total brut: ${summary.totalGross.toLocaleString()} BIF`, 20, yPos);
    yPos += 8;
    this.doc.text(`Total déductions: ${summary.totalDeductions.toLocaleString()} BIF`, 20, yPos);
    yPos += 8;
    this.doc.text(`Total net: ${summary.totalNet.toLocaleString()} BIF`, 20, yPos);

    // Line separator
    this.doc.setLineWidth(0.3);
    this.doc.line(20, yPos + 10, 190, yPos + 10);
  }

  private addPayrollTable(payrolls: PayrollData[]): void {
    let yPos = 120;

    // Table headers
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Employé', 20, yPos);
    this.doc.text('Brut', 100, yPos);
    this.doc.text('Déductions', 130, yPos);
    this.doc.text('Net', 160, yPos);

    this.doc.setLineWidth(0.3);
    this.doc.line(20, yPos + 2, 190, yPos + 2);
    yPos += 8;

    // Table rows
    this.doc.setFont('helvetica', 'normal');
    payrolls.forEach(payroll => {
      if (yPos > 270) { // New page if needed
        this.doc.addPage();
        yPos = 20;
      }

      this.doc.text(payroll.employeeName.substring(0, 25), 20, yPos);
      this.doc.text(payroll.totalGross.toLocaleString(), 100, yPos);
      this.doc.text(payroll.totalDeductions.toLocaleString(), 130, yPos);
      this.doc.text(payroll.netSalary.toLocaleString(), 160, yPos);
      yPos += 6;
    });
  }

  private addFooter(): void {
    const pageHeight = this.doc.internal.pageSize.height;
    const pageWidth = this.doc.internal.pageSize.width;

    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Généré le ' + new Date().toLocaleDateString('fr-FR'), 20, pageHeight - 20);
    this.doc.text('Ruzizi Hôtel - Système RH', pageWidth - 20, pageHeight - 20, { align: 'right' });
  }

  private formatPeriod(period: { month: number; year: number }): string {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${monthNames[period.month - 1]} ${period.year}`;
  }

  downloadPDF(filename: string): void {
    this.doc.save(filename);
  }

  getBlob(): Blob {
    return new Blob([this.doc.output('blob')], { type: 'application/pdf' });
  }
}