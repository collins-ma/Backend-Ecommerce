import { Injectable } from '@nestjs/common';
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

  // 🟢 Add item to 
  async addToCart(userId: string, productId: string, quantity: number) {
    if (!userId) throw new Error('User ID is missing');
  
    // Find existing cart
    let cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
  
    // Find product
    const product = await this.productModel.findById(productId);
    if (!product) throw new Error('Product not found');
  
    if (!cart) {
      cart = new this.cartModel({
        user: new Types.ObjectId(userId),
        items: [],
        total: 0,
      });
    }
  
    const existingItem = cart.items.find(
      (item) => (item.product as Types.ObjectId).toString() === productId,
    );
  
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ 
        product: product._id as Types.ObjectId,
        quantity 
      });
    }
  
    // Populate products safely
    await cart.populate('items.product');
  
    // Recalculate total safely
    cart.total = cart.items.reduce((sum, item) => {
      const prod = item.product as Product | null;
      if (!prod) return sum; // skip nulls
      return sum + prod.priceUSD * item.quantity;
    }, 0);
  
    return cart.save();
  }
  
  

  // 🟡 Get user’s cart
  async getCart(userId: string) {
    return this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('items.product', 'name image priceUSD');
  }

  // 🔵 Update quantity
  async updateItem(userId: string, productId: string, quantity: number) {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) throw new Error('Cart not found');

    const item = cart.items.find(
      (item) => (item.product as Types.ObjectId).toString() === productId,
    );
    if (!item) throw new Error('Item not found');

    item.quantity = quantity;

    await cart.populate('items.product');
    cart.total = cart.items.reduce(
      (sum, item) => sum + (item.product as Product).priceUSD * item.quantity,
      0,
    );

    return cart.save();
  }

  // 🔴 Remove item
  async removeItem(userId: string, productId: string) {
    const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });
    if (!cart) throw new Error('Cart not found');

    cart.items = cart.items.filter(
      (item) => (item.product as Types.ObjectId).toString() !== productId,
    );

    await cart.populate('items.product');
    cart.total = cart.items.reduce(
      (sum, item) => sum + (item.product as Product).priceUSD * item.quantity,
      0,
    );

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
