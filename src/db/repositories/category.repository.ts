import DatabaseRepository from './database.repository';
import {
  Category as TRawDocument,
  HydratedCategory as TDocument,
} from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class CategoryRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel(TRawDocument.name) model: Model<TDocument>) {
    super(model);
  }
}
export default CategoryRepository;
