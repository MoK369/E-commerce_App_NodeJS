import DatabaseRepository from './database.repository';
import { Cart as TRawDocument, HydratedCart as TDocument } from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class CartRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel("Cart") model: Model<TDocument>) {
    super(model);
  }
}
export default CartRepository;
