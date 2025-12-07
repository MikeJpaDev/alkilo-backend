/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../entities/user.entity';
import { TokenBlacklist } from '../entities/token-blacklist.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    configService: ConfigService,
  ) {
    const JwtSecret = configService.get('JWT_SECRET');

    if (!JwtSecret) {
      throw new Error('JWT_SECRET not defined');
    }

    super({
      secretOrKey: JwtSecret,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: true, // Para tener acceso a la request y extraer el token
    });
  }

  async validate(request: Request, payload: JwtPayload): Promise<User> {
    const { id } = payload;

    // Extraer el token del header
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    // Verificar si el token está en la lista negra
    if (token) {
      const isBlacklisted = await this.tokenBlacklistRepository.findOne({
        where: { token },
      });

      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    const user = await this.userRepository.findOneBy({ id });

    if (!user) throw new UnauthorizedException('Token not valid');
    if (!user.isActive) throw new UnauthorizedException('User not active');

    return user;
  }
}
