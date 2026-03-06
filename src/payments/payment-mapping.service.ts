import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PaymentMapping } from './payment-mapping.schema';

@Injectable()
export class PaymentMappingService {
  constructor(
    @InjectModel(PaymentMapping.name)
    private readonly mappingModel: Model<PaymentMapping>,
  ) {}

  async create(mapping: { orderId: string; checkoutRequestId: string }) {
    const doc = new this.mappingModel(mapping);
    return doc.save();
  }

  async findByCheckoutRequestId(checkoutRequestId: string) {
    return this.mappingModel.findOne({ checkoutRequestId }).exec();
  }
}