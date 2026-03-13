// src/cart/cart.controller.ts
import { Controller, Post, Get, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { JwtAuthGuard } from '../auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard )
export class CartController {
  constructor(private readonly cartService: CartService) {}
  @Roles('user')
  @Post('add')
  async add(@Req() req: any, @Body() dto: AddToCartDto) {
    
    const userId = req.user._id;
    console.log('Cart user:',userId)
    return this.cartService.addToCart(userId, dto.productId, dto.quantity);

  }
  @Roles('user')
  @Get()
  async getCart(@Req() req: any) {
    return this.cartService.getCart(req.user._id);
  }
  @Roles('user')
  @Patch(':productId')
  async updateItem(@Req() req: any, @Param('productId') productId: string, @Body() body: { quantity: number }) {
    return this.cartService.updateItem(req.user._id, productId, body.quantity);
  }
  @Roles('user')
  @Delete(':productId')
  async removeItem(@Req() req: any, @Param('productId') productId: string) {
    return this.cartService.removeItem(req.user._id, productId);
  }

  @Delete('clear')
  async clearCart(@Req() req: any) {
    return this.cartService.clearCart(req.user._id);
  }
}
