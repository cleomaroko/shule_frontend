import type { AcademicTerm } from '@/features/academic/types/academic.types'
import type { Learner } from '@/features/learners/types/learner.types'

/** `com.lyrt.shule.finance.FeeTransaction` */
export const FEE_PAYMENT_METHODS = ['Mpesa', 'Bank', 'Cash'] as const
export type FeePaymentMethod = (typeof FEE_PAYMENT_METHODS)[number]

export interface FeeTransaction {
  id: number
  learner?: Pick<Learner, 'id' | 'firstName' | 'middleName' | 'lastName' | 'admissionNumber'> | null
  term?: Pick<AcademicTerm, 'id' | 'name'> | null
  amountPaid?: number | string | null
  paymentMethod?: string | null
  referenceNumber?: string | null
  transactionDate?: string | null
  remarks?: string | null
  recordedBy?: string | null
}

/** POST `/api/finance/fees/pay` body. `termId` is sent as a query param. */
export interface FeePaymentPayload {
  learner: { id: number }
  amountPaid: number
  paymentMethod: string
  referenceNumber?: string
  remarks?: string
  term?: { id: number }
}
