import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { PayrollModel } from '@/models/Payroll.model';
import { EmployeeModel } from '@/models/Employee.model';
import { PayrollPDFGenerator } from '@/lib/pdf/payroll-pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;

    await dbConnect();

    // Fetch payroll with employee details
    const payroll = await PayrollModel.findById(resolvedParams.id).populate('employeeId');
    if (!payroll) {
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    const employee = payroll.employeeId as any;
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Prepare data for PDF
    const payrollData = {
      employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      employeeId: employee.employmentInfo.employeeNumber || employee._id.toString(),
      period: payroll.period,
      baseSalary: payroll.baseSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      bonuses: payroll.bonuses,
      totalGross: payroll.totalGross,
      totalDeductions: payroll.totalDeductions,
      netSalary: payroll.netSalary,
      status: payroll.status,
      paidAt: payroll.paidAt?.toISOString()
    };

    // Generate PDF
    const generator = new PayrollPDFGenerator();
    const pdfBuffer = generator.generatePayrollSlip(payrollData);

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bulletin-paie-${payrollData.employeeName.replace(' ', '-')}-${payroll.period.year}-${payroll.period.month}.pdf"`
      }
    });

  } catch (error) {
    console.error('Error generating payroll PDF:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}