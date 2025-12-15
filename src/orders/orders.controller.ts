import { Controller, Get, Post, Patch, Delete, Param,Req, Body, UseGuards} from '@nestjs/common'
import { OrderService } from './orders.service';
import { JwtAuthGuard } from 'src/auth/guard/auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { RolesGuard } from 'src/auth/guard/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // 🔹 Get all orders (admin)
  @Roles('admin')
  @Get()
  findAll() {
    return this.orderService.findAll();
  }

  @Roles('user')
  @Get('my')
  
  async findMyOrders(@Req() req) {
    const userId = req.user._id; // comes from JWT payload
    return this.orderService.findByUser(userId);
  }


  // 🔹 Get single order
  @Roles('admin')
  @Get(':id')
  findById(@Param('id') id: string) {
    return this.orderService.findById(id);
  }

  // 🔹 Update status
  @Roles('admin')
  @Patch(':id/status')
    updateStatus(
      @Param('id') id: string,
      @Body('status') status: 'pending' | 'paid' | 'failed',
    ) {
      return this.orderService.updateStatus(id, status)
    }
    
 

  // 🔹 Delete order
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.orderService.delete(id);
  }
}
