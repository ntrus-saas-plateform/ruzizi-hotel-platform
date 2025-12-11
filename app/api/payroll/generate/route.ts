import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import { EmployeeModel } from '@/models/Employee.model';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Payroll generate API called');
    
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    const { year, month, establishmentId } = body;

    if (!year || !month) {
      console.log('❌ Missing year or month');
      return NextResponse.json(
        { success: false, error: { message: 'Year and month are required' } },
        { status: 400 }
      );
    }

    console.log('✅ Basic validation passed');
    
    // Connect to database
    await connectDB();
    console.log('🔗 Database connected');

    // Find active employees
    const query: any = { 'employmentInfo.status': 'active' };
    
    // If establishmentId is provided, filter by establishment
    if (establishmentId) {
      query['employmentInfo.establishmentId'] = establishmentId;
    }

    console.log('🔍 Searching employees with query:', query);
    const employees = await EmployeeModel.find(query);
    console.log(`👥 Found ${employees.length} active employees`);

    // For now, just return the employee information without creating payroll records
    const employeeInfo = employees.map(emp => ({
      id: emp._id,
      name: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
      employeeNumber: emp.employmentInfo.employeeNumber,
      position: emp.employmentInfo.position,
      salary: emp.employmentInfo.salary
    }));

    console.log('👤 Employee details:', employeeInfo);
    
    return NextResponse.json({
      success: true,
      data: {
        count: employees.length,
        employees: employeeInfo,
        message: `Found ${employees.length} active employees ready for payroll generation`
      }
    });

  } catch (error: any) {
    console.error('💥 Error in payroll generate API:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: error.message || 'An unexpected error occurred',
          details: error.stack
        } 
      },
      { status: 500 }
    );
  }
}
