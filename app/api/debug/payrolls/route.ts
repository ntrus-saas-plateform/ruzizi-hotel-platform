import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { dbConnect } from '@/lib/db';
import { PayrollModel } from '@/models/Payroll.model';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug: Listing all payroll records');
    
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    console.log('✅ Database connected');

    // Get all payrolls without filters
    const payrolls = await PayrollModel.find({})
      .populate('employeeId')
      .limit(10)
      .sort({ createdAt: -1 });

    console.log(`📋 Found ${payrolls.length} payroll records total`);

    const payrollList = payrolls.map((payroll) => ({
      id: payroll._id,
      period: payroll.period,
      status: payroll.status,
      totalGross: payroll.totalGross,
      netSalary: payroll.netSalary,
      employeeId: payroll.employeeId,
      hasEmployee: !!payroll.employeeId,
      employeeName: (payroll.employeeId as any)?.personalInfo 
        ? `${(payroll.employeeId as any).personalInfo.firstName} ${(payroll.employeeId as any).personalInfo.lastName}`
        : 'Unknown'
    }));

    return NextResponse.json({
      success: true,
      count: payrollList.length,
      data: payrollList
    });

  } catch (error) {
    console.error('❌ Error listing payrolls:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
