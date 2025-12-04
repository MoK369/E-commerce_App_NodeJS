import DatabaseRepository from './database.repository';
import { User as TRawDocument, HydratedUser as TDocument } from '../models';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
class UserRepository extends DatabaseRepository<TRawDocument> {
  constructor(@InjectModel(TRawDocument.name) model: Model<TDocument>) {
    super(model);
  }
}
export default UserRepository;
