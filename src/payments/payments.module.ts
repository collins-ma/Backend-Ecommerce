import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { Cart } from 'src/cart/schema/cart.schema';
import { CartModule } from 'src/cart/cart.module';

import { OrdersModule } from 'src/orders/orders.module';
import { HttpModule } from '@nestjs/axios'; // ✅ import this
import { ConfigModule } from '@nestjs/config';
import { MpesaCallbackController } from './mpesa.callback';
import { PaymentMappingService } from './payment-mapping.service';
import { PaymentMapping,PaymentMappingSchema } from './payment-mapping.schema';
import { MongooseModule } from '@nestjs/mongoose';


@Module({
  imports: [
     MongooseModule.forFeature([
      { name: PaymentMapping.name, schema: PaymentMappingSchema }
    ]),
    HttpModule, // ✅ provides HttpService
    ConfigModule, // ✅ provides ConfigService
    OrdersModule,
    CartModule  // ✅ gives access to OrderService
  ],
  providers: [PaymentsService, MpesaStrategy,PaymentMappingService],
  controllers: [PaymentsController,MpesaCallbackController],
  exports: [PaymentsService, PaymentMappingService],

})
export class PaymentsModule {}
