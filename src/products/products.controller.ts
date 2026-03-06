import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';



import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductsService } from './products.service';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { CloudinaryService } from 'cloudinary.services';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService,
       
    private readonly cloudinaryService: CloudinaryService

  ) {}

  // ✅ All authenticated users can view products
  @UseGuards(JwtAuthGuard)
  
  @Get()
async findAll(@Query('category') category?: string): Promise<Product[]> {
  if (category) {
    // category provided → return filtered products
    return this.productsService.findProductsByName(category);
  }
  // no category → return all products
  return this.productsService.findAll();
}




  
 


  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Product> {
    return this.productsService.findById(id);
  }

  // 🔒 Only admins can create products
  @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createProductDto: CreateProductDto
  ) {
console.log('FILE',file)
    console.log("createProdInfo", createProductDto)
     if (file) {
        // Upload to Cloudinary and get URL
        const imageUrl = await this.cloudinaryService.uploadImage(file);
        createProductDto.image = imageUrl;
      }
    return this.productsService.create(createProductDto);
  }

  
  

  // 🔒 Only admins can update products
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto): Promise<Product> {
    return this.productsService.update(id, updateProductDto);
  }

  // 🔒 Only admins can delete products
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    await this.productsService.delete(id);
    return { message: 'Product deleted successfully' };
  }
}
