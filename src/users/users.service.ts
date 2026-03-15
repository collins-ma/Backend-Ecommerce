import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { CreateUserDto } from 'src/dto/create-user.dto';
import { UpdateUserDto } from 'src/dto/update-user.dto';
import * as bcrypt from 'bcrypt';
import { MailerService } from '@nestjs-modules/mailer';
import { SessionService } from 'src/sessions/sessions.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private mailerService: MailerService,
    private sessionService: SessionService,
  ) {}

  
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  
  async create(createUserDto: CreateUserDto) {
    try {
     
      const existingUser = await this.userModel.findOne({
        $or: [
          { email: createUserDto.email },
          { username: createUserDto.username },
          { phoneNumber: createUserDto.phoneNumber },
        ],
      });

      if (existingUser) {
        let field = 'details';
        if (existingUser.email === createUserDto.email) field = 'email';
        else if (existingUser.username === createUserDto.username) field = 'username';
        else if (existingUser.phoneNumber === createUserDto.phoneNumber) field = 'phone number';

        throw new ConflictException(`User with this ${field} already exists`);
      }

  
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      console.log(hashedPassword)
      const code = this.generateVerificationCode();

    
      const user =  new this.userModel({
        ...createUserDto,
        password: hashedPassword,
        roles: ['user'], 
        verificationCode: code,
        verificationCodeExpires: new Date(Date.now() + 10 * 60 * 1000),
      });

      await user.save();

     await this.mailerService.sendMail({
        to: user.email,
        from: `"ShopVista" <${process.env.SMTP_USER}>`,
        subject: 'Verify Your Account',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color:#4CAF50;">Hello ${user.username},</h2>
      
            <p>Thank you for creating an account!</p>
      
            <p>Your verification code is:</p>
      
            <h1 style="color:#333; letter-spacing: 3px;">${code}</h1>
      
            <p>If you didn’t request this, ignore this email.</p>
      
            <br />
            <footer style="font-size: 12px; color: #999;">
              © ${new Date().getFullYear()} Your App
            </footer>
          </div>
        `
      });

     
      

      return { message: 'Verification code sent to your email' };
    } catch (error) {
      

      if (error instanceof ConflictException) throw error;
    
      if (error.response?.includes('ECONNECTION') || error.response?.includes('ETIMEDOUT')) {
        throw new InternalServerErrorException('Email service not working');
      }
    
      throw new InternalServerErrorException(error.message);
    }
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) return { message: 'Already verified' };

    if (
      user.verificationCode !== code ||
      !user.verificationCodeExpires ||
      user.verificationCodeExpires < new Date()
    ) {
      throw new BadRequestException('Invalid or expired code');
    }

    user.isVerified = true;
    user.verificationCode = '';
    user.verificationCodeExpires =null

    await user.save();
    return { message: 'Account verified successfully' };
  }



  async resendCode(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) return { message: 'Already verified' };

    const code = this.generateVerificationCode();
    user.verificationCode = code;
    user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

  const result=  await this.mailerService.sendMail({
      to: email,
      from:`"ShopVista" <${process.env.SMTP_USER}>`,
      subject: 'Your New Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4CAF50;">Hello ${user.username},</h2>
    
          <p>Your verification code is:</p>
    
          <h1 style="
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            display: inline-block;
            border-radius: 8px;
          ">
            ${code}
          </h1>
    
          <p>Please enter this code to verify your account.</p>
    
          <p style="margin-top: 30px; font-size: 12px; color: #999;">
            If you did not request this, please ignore this email.
          </p>
        </div>
      `,

 
    });

    

    return { message: 'New verification code sent to your email' };
  }




  

 
  async createAdminUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    return this.userModel.create({
      ...createUserDto,
      password: hashedPassword,
      roles: ['admin'],
    });
  }


  
  
  
  async findAll(): Promise<User[]> {
    const users = await this.userModel.find().exec();
    if (!users || users.length === 0) throw new NotFoundException('No users found');
    return users;
  }

  
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt(10);
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    const updated = await this.userModel.findByIdAndUpdate(id, updateUserDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

 
  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  
  async findByUsername(username: string): Promise<User> {
    const user = await this.userModel.findOne({ username }) .select('+email  +isVerified +isActive ').exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  
  async findByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

 
  async findOne(query: Record<string, any>): Promise<User | null> {
    return this.userModel.findOne(query).exec();
  }

  
  async delete(id: string): Promise<User> {
    const deleted = await this.userModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('User not found');
    return deleted;
  }


  async deactivateUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (!user.isActive) return { message: 'User already deactivated' };

    user.isActive = false;
    await user.save();

    
    await this.sessionService.logoutOtherDevices(userId);

    return { message: 'User deactivated successfully' };
  }
  
  async activateUser(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    if (user.isActive) return { message: 'User already active' };

    user.isActive = true;
    await user.save();

    return { message: 'User activated successfully' };
  }




}
