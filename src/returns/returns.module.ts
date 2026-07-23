import { Module } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { ReturnsController } from './returns.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReturnSchema } from './schema/return-schema';
import { Return } from './schema/return-schema';
import { Order } from 'src/orders/schema/order.schema';
import { OrderSchema } from 'src/orders/schema/order.schema';
import { OrdersModule } from 'src/orders/orders.module';


@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Return.name,
        schema: ReturnSchema,
      },
      {
        name: Order.name,
        schema: OrderSchema,
      },
    ]),
    OrdersModule
  ],
  controllers: [ReturnsController],
  providers: [ReturnsService],
})
export class ReturnsModule {}