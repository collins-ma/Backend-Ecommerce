import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category } from './schema/category.schema';
import { Product } from 'src/products/schema/product.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  // ✅ Create new category
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = new this.categoryModel(createCategoryDto);
    return category.save();
  }

  // ✅ Get all categories
  async findAll(): Promise<Category[]> {
    return this.categoryModel.find().exec();
  } 
  
  // Removed duplicate implementation of findAllWithProducts




  // ✅ Get single category
  async findById(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    return category;
  }

  // ✅ Update category
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const updatedCategory = await this.categoryModel.findByIdAndUpdate(id, updateCategoryDto, { new: true }).exec();
    if (!updatedCategory) {
      throw new Error(`Category with ID ${id} not found`);
    }
    return updatedCategory;
  }

  // ✅ Delete category
  async delete(id: string): Promise<{ message: string }> {
    await this.categoryModel.findByIdAndDelete(id).exec();
    return { message: 'Category deleted successfully' };
  }

  async findAllWithProducts(): Promise<Category[]> {
    return this.categoryModel
      .find()
      .populate({
        path: 'products',
        select: 'name image priceUSD category',
      })
      .exec();
  }
  
  // ✅ Get categories with products
//   async findAllWithProducts() {
//     const categories = await this.categoryModel.find().lean();

//     const categoriesWithProducts = await Promise.all(
//       categories.map(async (category) => {
//         const products = await this.productModel
//           .find({ category: category._id })
//           .select('name image priceUSD')
//           .lean();
//         return { ...category, products };
//       }),
//     );

//     return categoriesWithProducts;
//   }
}
