export type PaymentMethod = 'mpesa' | 'stripe' | 'paypal';

export class ShippingAddressDto {
  name: string;
  street: string;
  city: string;
  zip: string;
  phone?: string;
}

export class BasePaymentDto {
  method: PaymentMethod;
  shippingAddress: ShippingAddressDto;
}

export class MpesaPaymentDto extends BasePaymentDto {
  declare method: 'mpesa';
  phoneNumber: string;
}

export class StripePaymentDto extends BasePaymentDto {
  declare method: 'stripe';
  email: string;
}

export class PaypalPaymentDto extends BasePaymentDto {
  declare method: 'paypal';
}

export type InitiatePaymentDto =
  | MpesaPaymentDto
  | StripePaymentDto
  | PaypalPaymentDto;
