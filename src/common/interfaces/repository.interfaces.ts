import Mail from 'nodemailer/lib/mailer';
import { FindFunctionsReturnType, LeanType } from '../types';

export interface IPaginationResult<TDocument, TLean extends LeanType = false>
  extends IPaginationMetaData {
  data?: FindFunctionsReturnType<TDocument, TLean>[];
}
export interface IPaginationMetaData {
  totalCount?: number | undefined;
  totalPages?: number | undefined;
  currentPage?: number | undefined;
  size?: number | undefined;
}

export interface IEmailPayload extends Mail.Options {
  otp?: string;
}
