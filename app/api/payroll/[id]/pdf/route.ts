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
    console.log('📄 Individual payroll PDF generation started');
    
    const user = await getAuthenticatedUser(request);
    if (!user) {
      console.log('❌ Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    console.log('🔍 Payroll ID:', resolvedParams.id);

    await dbConnect();
    console.log('✅ Database connected');

    // Fetch payroll with employee details
    const payroll = await PayrollModel.findById(resolvedParams.id).populate('employeeId');
    if (!payroll) {
      console.log('❌ Payroll not found');
      return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
    }

    console.log('📋 Found payroll:', {
      id: payroll._id,
      employeeId: payroll.employeeId,
      period: payroll.period,
      status: payroll.status
    });

    const employee = payroll.employeeId as any;
    if (!employee) {
      console.log('❌ Employee not found for payroll');
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    console.log('👤 Employee found:', {
      id: employee._id,
      name: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      employeeNumber: employee.employmentInfo?.employeeNumber
    });

    // Prepare data for PDF
    const payrollData = {
      employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      employeeId: employee.employmentInfo.employeeNumber || employee._id.toString(),
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

    console.log('📊 Payroll data prepared:', {
      employeeName: payrollData.employeeName,
      period: payrollData.period,
      totalGross: payrollData.totalGross,
      netSalary: payrollData.netSalary
    });

    // Generate PDF
    console.log('🔄 Starting PDF generation...');
    const generator = new PayrollPDFGenerator();
    const pdfBuffer = await generator.generatePayrollSlip(payrollData);
    console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);

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