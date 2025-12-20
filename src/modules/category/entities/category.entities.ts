import {
  FindFunctionsReturnType,
  ICategory,
  IPaginationResult,
} from 'src/common';

export class CategoryResponse {
  category: ICategory;
}

export class UpdateCategoryImageResponse {
  image: string;
}

export class FindAllCategoriesResponse implements IPaginationResult<ICategory> {
  totalCount?: number | undefined;
  totalPages?: number | undefined;
  currentPage?: number | undefined;
  size?: number | undefined;
  data?: FindFunctionsReturnType<ICategory, false>[];
}
