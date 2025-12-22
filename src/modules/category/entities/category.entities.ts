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
