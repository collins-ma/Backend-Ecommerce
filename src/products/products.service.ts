import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product } from './schema/product.schema';
import { Category } from 'src/categories/schema/category.schema';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<Product>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  // ✅ Create a new product
  async create(createProductDto:CreateProductDto): Promise<Product> {
    // Validate category existence
    const categoryExists = await this.categoryModel.findById(createProductDto.category);
    if (!categoryExists) {
      throw new NotFoundException('Category not found');
    }

    const product = new this.productModel(createProductDto)
    return product.save();
  }

  // ✅ Get all products (populate category name)
  async findAll(): Promise<Product[]> {
    return this.productModel.find().select('-category').exec(); // exclude category field
  }

  async findProducts(category?: string): Promise<any[]> {
    const filter = category ? { category } : {}; // if category exists, filter by it
    return this.productModel.find(filter).lean().exec(); // fetch from DB
  }

  async findProductsByCategory(): Promise<any[]> {
    const categories = await this.categoryModel
      .find()
      .populate('products') // virtual field
      .lean({ virtuals: true }) // return plain objects with virtuals

      .exec();

    return categories.map((category) => ({
      _id: category._id,
      name: category.name,
      products: category.products,
    }));
  }


  // ✅ Get product by ID
  async findById(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name')
      .exec();

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  // ✅ Update product
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    if (updateProductDto.category) {
      const categoryExists = await this.categoryModel.findById(updateProductDto.category);
      if (!categoryExists) {
        throw new NotFoundException('Category not found');
      }
    }

    const updated = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException('Product not found');
    return updated;
  }

  // ✅ Delete product
  async delete(id: string): Promise<{ message: string }> {
    const deleted = await this.productModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Product not found');

    return { message: 'Product deleted successfully' };
  }
}
