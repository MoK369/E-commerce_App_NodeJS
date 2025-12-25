import DatabaseRepository from './database.repository';
import { Order as TRawDocument, HydratedOrder as TDocument } from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class OrderRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel('Order') model: Model<TDocument>) {
    super(model);
  }
}
export default OrderRepository;
