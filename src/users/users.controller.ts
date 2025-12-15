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


  @Post('verify')
  async verify(@Body() body: { email: string; code: string }) {
    return this.usersService.verifyEmail(body.email, body.code);
  }

  @Post('resend-code')
  async resendCode(@Body() body: { email: string }) {
    return this.usersService.resendCode(body.email);
  }
  // Public create user (normal registration)
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<{message:string}> {
    return this.usersService.create(createUserDto);
  }

  // Admin-only user creation MUST have different route!
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
  @Roles('admin')
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  // Update user
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<User | null> {
    return this.usersService.update(id, updateUserDto);
  }

  // Delete user
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
