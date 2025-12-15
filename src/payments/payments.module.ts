import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MpesaStrategy } from './strategies/mpesa.strategy';
import { Cart } from 'src/cart/schema/cart.schema';
import { CartModule } from 'src/cart/cart.module';
import {PaypalStrategy} from './strategies/paypal.strategy'
import {StripeStrategy} from './strategies/stripe.strategy'
import { OrdersModule } from 'src/orders/orders.module';
import { HttpModule } from '@nestjs/axios'; // ✅ import this
import { ConfigModule } from '@nestjs/config';
import { MpesaCallbackController } from './mpesa.callback';
import { PaymentMappingService } from './payment-mapping.service';

@Module({
  imports: [
    HttpModule, // ✅ provides HttpService
    ConfigModule, // ✅ provides ConfigService
    OrdersModule,
    CartModule  // ✅ gives access to OrderService
  ],
  providers: [PaymentsService, MpesaStrategy, PaypalStrategy, StripeStrategy,PaymentMappingService],
  controllers: [PaymentsController,MpesaCallbackController],
  exports: [PaymentsService, PaymentMappingService],

})
export class PaymentsModule {}
