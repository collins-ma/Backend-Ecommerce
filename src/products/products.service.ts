import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
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

 
  async create(createProductDto: CreateProductDto): Promise<Product> {
    try {
      const product = new this.productModel(createProductDto);
      return await product.save();
    } catch (error) {
      console.error('Error creating product:', error);
      throw new InternalServerErrorException(error.message || 'Failed to create product');
    }
  }

  
  async findAll(): Promise<Product[]> {
    return this.productModel.find().select('-category').exec(); 
  }

 async findProductsByName(categoryName: string): Promise<Product[]> {
  if (!categoryName) return this.findAll();

  const category = await this.categoryModel
    .findOne({ name: { $regex: `^${categoryName.trim()}$`, $options: 'i' } })
    .exec();

  if (!category) return [];

  
  const categoryId = category._id;
  const categoryIdStr = category._id.toString();

  return this.productModel
    .find({ category: { $in: [categoryId, categoryIdStr] } })
    .populate('category', 'name')
    .exec();
}
  
  async findById(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name')
      .exec();

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

 
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

  
  async delete(id: string): Promise<{ message: string }> {
    const deleted = await this.productModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Product not found');

    return { message: 'Product deleted successfully' };
  }
}