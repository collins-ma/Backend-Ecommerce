import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderService } from 'src/orders/orders.service';
import { InjectModel } from '@nestjs/mongoose';
import { CompleteRefundDto } from './dto/complete-refund-dto';
import { FilterQuery } from 'mongoose';

import { Model } from 'mongoose';
import { ReceiveReturnedItemDto } from './dto/receive-returned-item.dto';
import { Return } from './schema/return-schema';
import { Order } from '../orders/schema/order.schema';

import { RequestReturnDto } from './dto/request-return.dto';

import { OrderStatus } from '../orders/enums/order-status.enum';
import { ReturnStatus } from './enums/return-status.enum';
import { RejectReturnDto } from './dto/reject-return.dto';
import { PaymentStatus } from 'src/orders/enums/payment-status.enum';
import { PaymentChannel } from 'src/orders/enums/payment-channel.enum';
import { RefundChannel } from 'src/orders/refund-channel.enum';

import { Types } from 'mongoose';

@Injectable()
export class ReturnsService {

      constructor(
    @InjectModel(Return.name)
    private readonly returnModel: Model<Return>,

    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,

  private readonly orderService: OrderService
  ) {}
async requestReturn(
  customerId: string,
  orderId: string,
  dto: RequestReturnDto,
) {
  // Find the order
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found.');
  }

  // Ensure the order belongs to the customer
  if (order.user.toString() !== customerId) {
    throw new ForbiddenException(
      'You are not allowed to return this order.',
    );
  }

  // Only delivered orders can be returned
  if (order.orderStatus !== OrderStatus.DELIVERED) {
    throw new BadRequestException(
      'Only delivered orders can be returned.',
    );
  }

  // Prevent duplicate return requests
  const existingReturn = await this.returnModel.findOne({
    order: order._id,
  });

  if (existingReturn) {
    throw new BadRequestException(
      'A return request already exists for this order.',
    );
  }

  // Create the return request
  const returnRequest = await this.returnModel.create({
    order: order._id,
    customer: order.user,
    reason: dto.reason,
    status: ReturnStatus.REQUESTED,
  });

  return {
    message: 'Return request submitted successfully.',
    return: returnRequest,
  };
}

async approveReturn(returnId: string) {
  const returnRequest = await this.returnModel.findById(returnId);

  if (!returnRequest) {
    throw new NotFoundException('Return request not found.');
  }

  if (returnRequest.status !== ReturnStatus.REQUESTED) {
    throw new BadRequestException(
      'Only pending return requests can be approved.',
    );
  }

  returnRequest.status = ReturnStatus.APPROVED;

  returnRequest.approvedAt = new Date();

  await returnRequest.save();

  return {
    message: 'Return request approved successfully.',
    return: returnRequest,
  };
}
async rejectReturn(
  returnId: string,
  dto: RejectReturnDto,
) {
  const returnRequest = await this.returnModel.findById(returnId);

  if (!returnRequest) {
    throw new NotFoundException(
      'Return request not found.',
    );
  }

  if (returnRequest.status !== ReturnStatus.REQUESTED) {
    throw new BadRequestException(
      'Only requested returns can be rejected.',
    );
  }

  returnRequest.status = ReturnStatus.REJECTED;

  returnRequest.rejectedReason = dto.rejectedReason;

  returnRequest.adminNotes = dto.adminNotes;

  returnRequest.rejectedAt = new Date();

  await returnRequest.save();

  return {
    message: 'Return request rejected successfully.',
    return: returnRequest,
  };
}





async receiveReturnedItem(
  returnId: string,
  dto: ReceiveReturnedItemDto,
) {
  const returnRequest = await this.returnModel.findById(returnId);

  if (!returnRequest) {
    throw new NotFoundException(
      'Return request not found.',
    );
  }

  if (returnRequest.status !== ReturnStatus.APPROVED) {
    throw new BadRequestException(
      'Only approved returns can be marked as received.',
    );
  }

  returnRequest.status = ReturnStatus.ITEM_RECEIVED;

  returnRequest.itemReceivedAt = new Date();

  returnRequest.adminNotes = dto.adminNotes;

  await returnRequest.save();

  return {
    message: 'Returned item received successfully.',
    return: returnRequest,
  };
}

async refundReturn(
  returnId: string,
  dto: CompleteRefundDto,
) {
  // Find the return request
  const returnRequest = await this.returnModel.findById(returnId);

  if (!returnRequest) {
    throw new NotFoundException(
      'Return request not found.',
    );
  }

  // Ensure the item has been received
  if (returnRequest.status !== ReturnStatus.ITEM_RECEIVED) {
    throw new BadRequestException(
      'Returned item must be received before refund.',
    );
  }

  // If refund is through M-Pesa, transaction ID is required
  if (
    dto.refundChannel === RefundChannel.MPESA &&
    !dto.transactionId
  ) {
    throw new BadRequestException(
      'Refund transaction ID is required for M-Pesa refunds.',
    );
  }

  // Find the related order
  const order = await this.orderModel.findById(
    returnRequest.order,
  );

  if (!order) {
    throw new NotFoundException(
      'Associated order not found.',
    );
  }

  // Mark order as awaiting refund
  order.paymentStatus = PaymentStatus.REFUND_PENDING;
  await order.save();

  // Reuse refund logic from OrderService
  await this.orderService.completeRefund(
    order._id.toString(),
    dto,
  );

  // Update return record
  returnRequest.status = ReturnStatus.REFUNDED;
  returnRequest.refundChannel = dto.refundChannel;
  returnRequest.refundTransactionId = dto.transactionId;
  returnRequest.refundedAt = new Date();

  await returnRequest.save();

  return {
    message: 'Refund completed successfully.',
    return: returnRequest,
  };
}


async getMyReturns(customerId: string) {
  const returns = await this.returnModel
    .find({
      customer: new Types.ObjectId(customerId),
    })
    .populate({
      path: 'order',
      select:
        'items total orderStatus paymentStatus createdAt',
    })
    .sort({ createdAt: -1 });

  return returns;
}


async getReturnById(
  returnId: string,
  userId: string,
  role: string,
) {
  const returnRequest = await this.returnModel
  .findById(returnId)
  .populate({
    path: 'customer',
    select: 'username email',
  })
  .populate({
    path: 'order',
    populate: {
      path: 'items.product',
      select: 'name priceKsh image',
    },
  });

  if (!returnRequest) {
    throw new NotFoundException(
      'Return request not found.',
    );
  }

  if (
    role === 'user' &&
    returnRequest.customer.toString() !== userId
  ) {
    throw new ForbiddenException(
      'You are not allowed to view this return.',
    );
  }

  return {
    message: 'Return retrieved successfully.',
    return: returnRequest,
  };
}

async getAllReturns(status?: ReturnStatus) {
  const filter: FilterQuery<Return> = {};

  if (status) {
    filter.status = status;
  }

  const returns = await this.returnModel
    .find(filter)
    .populate({
      path: 'customer',
      select: 'username email phoneNumber',
    })
    .populate({
      path: 'order',
      select: 'total orderStatus paymentStatus createdAt',
    })
    .sort({ createdAt: -1 });

  return {
    total: returns.length,
    returns,
  };
}





}
