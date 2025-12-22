import DatabaseRepository from './database.repository';
import { Coupon as TRawDocument, HydratedCoupon as TDocument } from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class CouponRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel('Coupon') model: Model<TDocument>) {
    super(model);
  }
}
export default CouponRepository;
