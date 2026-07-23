import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  Get,
  Query
} from '@nestjs/common';

import { ReturnsService } from './returns.service';
import { ReturnStatus } from './enums/return-status.enum';

import { RequestReturnDto } from './dto/request-return.dto';
import { RejectReturnDto } from './dto/reject-return.dto';
import { ReceiveReturnedItemDto } from './dto/receive-returned-item.dto';
import { CompleteRefundDto } from './dto/complete-refund-dto';
import type { Request } from 'express';
import { Req } from '@nestjs/common';

import { Roles } from 'src/auth/decorators/roles.decorators';
import { RolesGuard } from 'src/auth/guard/roles.guard';
import { JwtAuthGuard } from 'src/auth/guard/auth.guard';

interface requestInterface extends Request{
    user?:any
}
@Controller('returns')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReturnsController {
  constructor(
    private readonly returnsService: ReturnsService,
  ) {}

  @Post('orders/:orderId/request')
  @Roles('user')
  requestReturn(
      @Req() req: requestInterface,
    @Param('orderId') orderId: string,
    @Body() dto: RequestReturnDto,
  ) {
    return this.returnsService.requestReturn(
      req.user._id,
      orderId,
      dto,
    );
  }

  @Patch(':id/approve')
  @Roles('admin')
  approveReturn(
    @Param('id') id: string,
  ) {
    return this.returnsService.approveReturn(id);
  }

  @Patch(':id/reject')
  @Roles('admin')
  rejectReturn(
    @Param('id') id: string,
    @Body() dto: RejectReturnDto,
  ) {
    return this.returnsService.rejectReturn(id, dto);
  }

  @Patch(':id/receive-item')
  @Roles('admin')
  receiveReturnedItem(
    @Param('id') id: string,
    @Body() dto: ReceiveReturnedItemDto,
  ) {
    return this.returnsService.receiveReturnedItem(
      id,
      dto,
    );
  }

  @Patch(':id/refund')
  @Roles('admin')
  refundReturn(
    @Param('id') id: string,
    @Body() dto: CompleteRefundDto,
  ) {
    return this.returnsService.refundReturn(id, dto);
  }
  
  @Get('my-returns')
@Roles('user')
getMyReturns(
  @Req() req: requestInterface
) {
  return this.returnsService.getMyReturns(
    req.user._id 
  );
}


@Get(':id')
@Roles('user', 'admin')
getReturnById(
  @Param('id') id: string,
  @Req() req: requestInterface
) {
  return this.returnsService.getReturnById(
    id,
    req.user._id,  
    req.user.role
  );
}

@Get()
@Roles('admin')
getAllReturns(
  @Query('status') status?: ReturnStatus,
) {
  return this.returnsService.getAllReturns(status);
}





}