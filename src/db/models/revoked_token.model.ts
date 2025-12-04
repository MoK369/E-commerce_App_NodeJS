import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({
  timestamps: true,
})
export class RevokedToken {
  @Prop({ type: String, required: true })
  jti: string;

  @Prop({ type: Types.ObjectId, required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true, expires: 0 })
  expiresAt: Date;
}

export const revokedTokenSchema = SchemaFactory.createForClass(RevokedToken);

export type HydratedRevokedToken = HydratedDocument<RevokedToken>;

export const RevokedTokenModel = MongooseModule.forFeature([
  {
    name: RevokedToken.name,
    schema: revokedTokenSchema,
  },
]);
