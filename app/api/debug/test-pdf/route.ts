import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { PayrollPDFGenerator } from '@/lib/pdf/payroll-pdf-generator';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test: Simple PDF generation started');
    
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create test data
    const testData = {
      employeeName: 'Test Employee',
      employeeId: 'TEST001',
      period: { year: 2025, month: 12 },
      baseSalary: 500000,
      allowances: [],
      deductions: [],
      bonuses: [],
      totalGross: 500000,
      totalDeductions: 50000,
      netSalary: 450000,
      status: 'approved',
      paidAt: new Date().toISOString()
    };

    console.log('📊 Test data prepared:', testData);

    // Generate PDF
    console.log('🔄 Starting PDF generation...');
    const generator = new PayrollPDFGenerator();
    const pdfBuffer = await generator.generatePayrollSlip(testData);
    console.log('✅ PDF generated successfully, buffer size:', pdfBuffer.length);

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="test-payroll.pdf"'
      }
    });

  } catch (error) {
    console.error('❌ Error in test PDF generation:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
