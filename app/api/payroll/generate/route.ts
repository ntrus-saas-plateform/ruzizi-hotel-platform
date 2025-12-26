import { NextRequest } from 'next/server';
import { PayrollService } from '@/services/Payroll.service';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  return requireAuth(async () => {
    try {
      const body = await request.json();
      const { year, month, establishmentId } = body as {
        year?: number;
        month?: number;
        establishmentId?: string;
      };

      if (!year || !month) {
        return createErrorResponse('VALIDATION_ERROR', 'Year and month are required', 400);
      }

      // Génère la paie pour tous les employés actifs sur la période (année + mois)
      // Les enregistrements sont créés avec le statut "pending" dans PayrollService.generateForAllEmployees,
      // ce qui les place automatiquement dans la vue "en attente" jusqu'à approbation / paiement.
      const payrolls = await PayrollService.generateForAllEmployees(year, month, establishmentId);

      return createSuccessResponse(
        {
          count: payrolls.length,
          payrolls,
        },
        `Payroll generated for ${payrolls.length} employees for ${month}/${year}`
      );
    } catch (error: any) {
      console.error('💥 Error in payroll generate API:', error);
      return createErrorResponse('SERVER_ERROR', error.message || 'An unexpected error occurred', 500);
    }
  })(request);
}
