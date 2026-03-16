import { 
  Controller, Get, Post, Patch, Delete, 
  Body, Param, UseGuards 
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.schema';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/guard/auth.guard';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
 
   @Get('test-db-error')
  async testDbError() {
    const x: any = null;
    return x.test; // This will throw a runtime error → status 500
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/deactivate')
  
  async deactivate(@Param('id') id: string) {
    return this.usersService.deactivateUser(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')

  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return this.usersService.activateUser(id);
  }


  @Post('verify')
  async verify(@Body() body: { email: string; code: string }) {
    return this.usersService.verifyEmail(body.email, body.code);
  }

  @Post('resend-code')
  async resendCode(@Body() body: { email: string }) {
    return this.usersService.resendCode(body.email);
  }
  
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<{message:string}> {
    return this.usersService.create(createUserDto);
  }

  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('admin')
  async createAdminUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.createAdminUser(createUserDto);
  }

  // Get all users
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  // Get user by ID
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin','user')
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }


  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User | null> {
    return this.usersService.update(id, updateUserDto);
  }

  
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  
}
