import DatabaseRepository from './database.repository';
import { Otp as TRawDocument, HydratedOtp as TDocument } from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class OtpRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel(TRawDocument.name) model: Model<TDocument>) {
    super(model);
  }
}
export default OtpRepository;
