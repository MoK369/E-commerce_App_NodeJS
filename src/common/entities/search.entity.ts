import { IPaginationResult } from '../interfaces';
import { FindFunctionsReturnType } from '../types';

export class GetAllAndSearchResponse<T> implements IPaginationResult<T> {
  totalCount?: number | undefined;
  totalPages?: number | undefined;
  currentPage?: number | undefined;
  size?: number | undefined;
  data?: FindFunctionsReturnType<T, false>[];
}
