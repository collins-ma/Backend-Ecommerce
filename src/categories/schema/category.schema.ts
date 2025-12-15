// src/categories/schema/category.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Product } from '../../products/schema/product.schema';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  // virtual field placeholder
  products: Product[];
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// 👇 virtual field definition BEFORE exporting model
CategorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});
