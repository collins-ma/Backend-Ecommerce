import { Injectable } from '@nestjs/common';

interface Mapping {
  checkoutRequestId: string;
  orderId: string;
}

@Injectable()
export class PaymentMappingService {
  private mappings: Mapping[] = [];

  async create(mapping: Mapping) {
    this.mappings.push(mapping);
  }

  async findByCheckoutRequestId(checkoutRequestId: string) {
    return this.mappings.find(m => m.checkoutRequestId === checkoutRequestId);
  }
}
