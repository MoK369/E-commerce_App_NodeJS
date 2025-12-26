import DatabaseRepository from './database.repository';
import { Brand as TRawDocument, HydratedBrand as TDocument } from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class BrandRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel("Brand") model: Model<TDocument>) {
    super(model);
  }
}
export default BrandRepository;
