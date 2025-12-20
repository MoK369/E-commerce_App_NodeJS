import {
  CreateOptions,
  HydratedDocument,
  MongooseUpdateQueryOptions,
  ProjectionType,
  Types,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
  DeleteResult,
  Model,
  MongooseBaseQueryOptions,
  RootFilterQuery,
} from 'mongoose';
import {
  FindFunctionOptionsType,
  FindFunctionsReturnType,
  LeanType,
  UpdateFunctionsUpdateObjectType,
  UpdateType,
  IPaginationResult,
} from 'src/common';

abstract class DatabaseRepository<
  TRawDocument,
  TDocument = HydratedDocument<TRawDocument>,
> {
  constructor(protected model: Model<TDocument>) {}

  create = async ({
    data,
    options = {
      validateBeforeSave: true,
    },
  }: {
    data: Partial<TRawDocument>[];
    options?: CreateOptions;
  }): Promise<TDocument[]> => {
    return this.model.create(data, options);
  };

  find = async <TLean extends boolean = false>({
    filter = {},
    projection,
    options = {},
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    projection?: ProjectionType<TRawDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  } = {}): Promise<FindFunctionsReturnType<TDocument, TLean>[]> => {
    return this.model.find(filter, projection, options);
  };

  paginate = async <TLean extends boolean = false>({
    filter,
    projection,
    options = {},
    page = 'all',
    size,
  }: {
    filter: RootFilterQuery<TRawDocument>;
    projection?: ProjectionType<TRawDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
    page: number | 'all';
    size: number;
  }): Promise<IPaginationResult<TDocument, TLean>> => {
    let docsCount: number | undefined;
    let totalPages: number | undefined;
    if (page !== 'all') {
      page = Math.floor(!page || page < 1 ? 1 : page);
      options.limit = Math.floor(!size || size < 1 ? 5 : size);
      options.skip = (page - 1) * size;

      docsCount = await this.model.countDocuments(filter);
      totalPages = Math.ceil(docsCount / size);
    }
    const data = await this.model.find(filter, projection, options);

    return {
      totalCount: docsCount,
      totalPages,
      currentPage: page !== 'all' ? page : undefined,
      size: page !== 'all' ? size : undefined,
      data: data as unknown as FindFunctionsReturnType<TDocument, TLean>[],
    };
  };

  findOne = async <TLean extends boolean = false>({
    filter,
    projection,
    options = {},
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    projection?: ProjectionType<TRawDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findOne(filter, projection, options);
  };

  findById = async <TLean extends boolean = false>({
    id,
    projection,
    options = {},
  }: {
    id: Types.ObjectId | string;
    projection?: ProjectionType<TRawDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findById(id, projection, options);
  };

  updateMany = async ({
    filter = {},
    update,
    options = {},
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    update: UpdateQuery<TDocument> | UpdateWithAggregationPipeline;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    return this.model.updateMany(
      filter,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  };

  updateOne = async <TUpdate extends UpdateType = Record<string, any>>({
    filter = {},
    update,
    options = {},
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    let toUpdateObject: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ['$__v', 1] },
        },
      });
      toUpdateObject = update;
    } else {
      toUpdateObject = { ...update, $inc: { __v: 1 } };
    }
    return this.model.updateOne(filter, toUpdateObject, options);
  };

  updateById = async <TUpdate extends UpdateType = Record<string, any>>({
    id,
    update,
    options = {},
  }: {
    id: Types.ObjectId | string;
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: MongooseUpdateQueryOptions<TDocument>;
  }): Promise<UpdateWriteOpResult> => {
    let toUpdateObject: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ['$__v', 1] },
        },
      });
      toUpdateObject = update;
    } else {
      toUpdateObject = { ...update, $inc: { __v: 1 } };
    }
    return this.model.updateOne({ _id: id }, toUpdateObject, options);
  };

  findOneAndUpdate = async <
    TUpdate extends UpdateType = Record<string, any>,
    TLean extends boolean = false,
  >({
    filter = {},
    update,
    options = { new: true },
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    update: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindFunctionsReturnType<TDocument, TLean>> => {
    let toUpdateObject: UpdateFunctionsUpdateObjectType<TDocument, TUpdate>;
    if (Array.isArray(update)) {
      update.push({
        $set: {
          __v: { $add: ['$__v', 1] },
        },
      });
      toUpdateObject = update;
    } else {
      toUpdateObject = { ...update, $inc: { __v: 1 } };
    }
    return this.model.findOneAndUpdate(filter, toUpdateObject, options);
  };

  findByIdAndUpdate = async <TLean extends LeanType = false>({
    id,
    update,
    options = { new: true },
  }: {
    id: Types.ObjectId | string;
    update: UpdateQuery<TDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findByIdAndUpdate(
      id,
      { ...update, $inc: { __v: 1 } },
      options,
    );
  };

  deleteOne = async ({
    filter = {},
    options = {},
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    options?: MongooseBaseQueryOptions<TDocument>;
  }): Promise<DeleteResult> => {
    return this.model.deleteOne(filter, options);
  };

  deleteMany = async ({
    filter = {},
    options = {},
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    options?: MongooseBaseQueryOptions<TDocument>;
  }): Promise<DeleteResult> => {
    return this.model.deleteMany(filter, options);
  };

  findOneAndDelete = async <TLean extends boolean = false>({
    filter = {},
    options = { new: true },
  }: {
    filter?: RootFilterQuery<TRawDocument>;
    options?: FindFunctionOptionsType<TDocument, TLean>;
  }): Promise<FindFunctionsReturnType<TDocument, TLean>> => {
    return this.model.findOneAndDelete(filter, options);
  };
}

export default DatabaseRepository;
