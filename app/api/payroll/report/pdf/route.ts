import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { PayrollModel } from '@/models/Payroll.model';
import { EmployeeModel } from '@/models/Employee.model';
import { PayrollPDFGenerator } from '@/lib/pdf/payroll-pdf-generator';

export async function GET(request: NextRequest) {
  try {
    console.log('📄 Payroll report PDF generation started');
    
    const user = await getAuthenticatedUser(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    console.log('✅ Database connected');

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : null;
    const type = searchParams.get('type') || 'monthly'; // monthly or annual

    console.log('📊 Request params:', { year, month, type });

    let query: any = { 'period.year': year };
    if (month && type === 'monthly') {
      query['period.month'] = month;
    }

    console.log('🔍 Database query:', query);

    // Fetch payrolls with employee details
    const payrolls = await PayrollModel.find(query)
      .populate('employeeId')
      .sort({ 'employeeId.personalInfo.lastName': 1 });

    console.log(`📋 Found ${payrolls.length} payroll records`);

    if (payrolls.length === 0) {
      return NextResponse.json({ error: 'No payroll data found for the specified period' }, { status: 404 });
    }

    // Prepare data for PDF report
    const payrollData = payrolls.map((payroll, index) => {
      const employee = payroll.employeeId as any; // populated
      
      console.log(`📋 Processing payroll ${index + 1}:`, {
        payrollId: payroll._id,
        employeeId: payroll.employeeId,
        employeeName: employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : 'Unknown',
        hasEmployee: !!employee,
        employeePersonalInfo: employee?.personalInfo,
        employeeEmploymentInfo: employee?.employmentInfo
      });

      return {
        employeeName: employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : 'Unknown',
        employeeId: employee?.employmentInfo?.employeeNumber || payroll.employeeId.toString(),
        period: payroll.period,
        baseSalary: payroll.baseSalary || 0,
        allowances: payroll.allowances || [],
        deductions: payroll.deductions || [],
        bonuses: payroll.bonuses || [],
        totalGross: payroll.totalGross || 0,
        totalDeductions: payroll.totalDeductions || 0,
        netSalary: payroll.netSalary || 0,
        status: payroll.status || 'unknown',
        paidAt: payroll.paidAt?.toISOString()
      };
    });

    console.log('📊 Processed payroll data:', payrollData.length, 'records');

    // Calculate summary
    const summary = {
      totalEmployees: payrollData.length,
      totalGross: payrollData.reduce((sum, p) => sum + p.totalGross, 0),
      totalDeductions: payrollData.reduce((sum, p) => sum + p.totalDeductions, 0),
      totalNet: payrollData.reduce((sum, p) => sum + p.netSalary, 0)
    };

    console.log('📈 Summary calculated:', summary);

    // Generate PDF report
    console.log('🔄 Starting PDF generation...');
    const generator = new PayrollPDFGenerator();
    const reportData = {
      title: type === 'monthly'
        ? `RAPPORT DE PAIE MENSUEL - ${new Date(year, (month || 1) - 1).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}`
        : `RAPPORT DE PAIE ANNUEL - ${year}`,
      period: type === 'monthly'
        ? `${new Date(year, (month || 1) - 1).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' })}`
        : `${year}`,
      generatedAt: new Date().toLocaleDateString('fr-FR'),
      payrolls: payrollData,
      summary
    };

    const pdfBuffer = await generator.generateMonthlyReport(reportData);
    console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);

    // Return PDF as response
    const filename = type === 'monthly'
      ? `rapport-paie-${year}-${month?.toString().padStart(2, '0')}.pdf`
      : `rapport-paie-annuel-${year}.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error) {
    console.error('❌ Error generating payroll report PDF:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}