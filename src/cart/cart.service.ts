import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Product, ProductDocument } from 'src/products/schema/product.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  // 🔁 Helper: safely recalculate total
  private async recalculateCart(cart: CartDocument) {
    await cart.populate('items.product');

    // 🛡 Remove deleted products automatically
    cart.items = cart.items.filter((item) => item.product);

    cart.total = cart.items.reduce((sum, item) => {
      const product = item.product as Product;
      return sum + product.priceKsh * item.quantity;
    }, 0);

    return cart;
  }

  // 🟢 Add item to cart
  async addToCart(userId: string, productId: string, quantity: number) {
    if (!userId) throw new NotFoundException('User ID is missing');

    let cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });

    const product = await this.productModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');

    if (!cart) {
      cart = new this.cartModel({
        user: new Types.ObjectId(userId),
        items: [],
        total: 0,
      });
    }

    const existingItem = cart.items.find(
      (item) =>
        (item.product as Types.ObjectId).toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: product._id as Types.ObjectId,
        quantity,
      });
    }

    await this.recalculateCart(cart);

    return cart.save();
  }

  // 🟡 Get user’s cart (auto cleans broken items)
  async getCart(userId: string) {
    const cart = await this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('items.product');

    if (!cart) return null;

    await this.recalculateCart(cart);
    await cart.save(); // persist cleanup

    return cart;
  }

  // 🔵 Update quantity
  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });

    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find(
      (item) =>
        (item.product as Types.ObjectId)?.toString() === productId,
    );

    if (!item) throw new NotFoundException('Item not found');

    item.quantity = quantity;

    await this.recalculateCart(cart);

    return cart.save();
  }

  // 🔴 Remove item (NOW SAFE)
  async removeItem(userId: string, productId: string) {
    const cart = await this.cartModel.findOne({
      user: new Types.ObjectId(userId),
    });

    if (!cart) throw new NotFoundException('Cart not found');

    cart.items = cart.items.filter(
      (item) =>
        (item.product as Types.ObjectId)?.toString() !== productId,
    );

    await this.recalculateCart(cart);

    return cart.save();
  }

  // ⚫ Clear cart
  async clearCart(userId: string) {
    return this.cartModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { items: [], total: 0 },
      { new: true },
    );
  }
}