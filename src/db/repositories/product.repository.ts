import DatabaseRepository from './database.repository';
import { Product as TRawDocument, HydratedProduct as TDocument } from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class ProductRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel(TRawDocument.name) model: Model<TDocument>) {
    super(model);
  }
}
export default ProductRepository;
