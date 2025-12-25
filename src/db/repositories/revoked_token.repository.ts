import DatabaseRepository from './database.repository';
import {
  RevokedToken as TRawDocument,
  HydratedRevokedToken as TDocument,
} from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class RevokedTokenRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel("RevokedToken") model: Model<TDocument>) {
    super(model);
  }
}
export default RevokedTokenRepository;
