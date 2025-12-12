import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/User.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SigninUserDto } from './dto/signin-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email } = createUserDto;
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException(
        'This email address is already registered. Please use a different email or login to your existing account.',
      );
    }
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async signin(
    signinUserDto: SigninUserDto,
  ): Promise<{ user: User; accessToken: string }> {
    const { email, password } = signinUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException(
        'User not found. Please check your email or create a new account.',
      );
    }
    if (user.password !== password) {
      throw new UnauthorizedException(
        'Incorrect password. Please try again or reset your password.',
      );
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { user, accessToken };
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundException(
        'User not found. The account may have been deleted or does not exist.',
      );
    }
    return user;
  }
}
