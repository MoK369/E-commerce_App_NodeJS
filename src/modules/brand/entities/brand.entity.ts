import { FindFunctionsReturnType, IBrand, IPaginationResult } from 'src/common';

export class BrandResponse {
  brand: IBrand;
}

export class UpdateBrandImageResponse {
  image: string;
}

export class FindAllBrandsResponse implements IPaginationResult<IBrand> {
  totalCount?: number | undefined;
  totalPages?: number | undefined;
  currentPage?: number | undefined;
  size?: number | undefined;
  data?: FindFunctionsReturnType<IBrand, false>[];
}
