import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { User } from './entities/user.entity';
import { LogoutEvent } from './entities/logout-event.entity';
import { TokenBlacklist } from './entities/token-blacklist.entity';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidRoles } from './interfaces/valid-roles';
import { MinioService } from 'src/common/minio/minio.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LogoutEvent)
    private readonly logoutEventRepository: Repository<LogoutEvent>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    private readonly jwtService: JwtService,
    private readonly minioService: MinioService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;

      const user: User = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });

      await this.userRepository.save(user);

      console.log(user);
      delete (user as Partial<User>).password;

      return {
        ...user,
        token: this.getJwtToken({ id: user.id }),
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    try {
      const { email, password } = loginUserDto;

      const user = await this.userRepository.findOne({
        where: { email },
        select: {
          id: true,
          ci: true,
          firstName: true,
          lastName: true,
          password: true,
          address: true,
          profilePicture: true,
          isActive: true,
          roles: true,
        },
      });

      if (!user) throw new UnauthorizedException('Credentials are not valid');

      if (!bcrypt.compareSync(password, user.password))
        throw new UnauthorizedException('Credentials are not valid');

      if (!user.isActive)
        throw new UnauthorizedException('User not Active, contacts admins');

      const tokenReturn = this.getJwtToken({ id: user.id });

      // Generar URL pre-firmada si tiene foto de perfil
      let profilePictureUrl: string | null = null;
      if (user.profilePicture) {
        profilePictureUrl = await this.minioService.getPresignedUrl(user.profilePicture);
      }

      delete (user as Partial<User>).password;
      delete (user as Partial<User>).isActive;
      delete (user as Partial<User>).createdAt;
      delete (user as Partial<User>).profilePicture;

      return {
        ...user,
        profilePictureUrl,
        token: tokenReturn,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async getMe(user: User) {
    try {
      // Buscar el usuario completo con toda su información
      const fullUser = await this.userRepository.findOne({
        where: { id: user.id },
        select: {
          id: true,
          ci: true,
          firstName: true,
          lastName: true,
          email: true,
          address: true,
          profilePicture: true,
          roles: true,
          createdAt: true,
        },
      });

      if (!fullUser) {
        throw new NotFoundException('User not found');
      }

      // Generar URL pre-firmada si tiene foto de perfil
      let profilePictureUrl: string | null = null;
      if (fullUser.profilePicture) {
        profilePictureUrl = await this.minioService.getPresignedUrl(fullUser.profilePicture);
      }

      delete (fullUser as Partial<User>).profilePicture;

      return {
        ...fullUser,
        profilePictureUrl,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async logout(user: User, token: string, ipAddress?: string, userAgent?: string) {
    try {
      if (!token) {
        throw new BadRequestException('Token not provided');
      }

      // Decodificar el token para obtener la fecha de expiración
      let decodedToken: any;
      try {
        decodedToken = this.jwtService.decode(token);
      } catch (error) {
        throw new BadRequestException('Invalid token');
      }

      const tokenExpiresAt = new Date(decodedToken.exp * 1000);

      // 1. Registrar el evento de logout
      const logoutEvent = this.logoutEventRepository.create({
        user,
        token,
        tokenExpiresAt,
        ipAddress,
        userAgent,
      });
      await this.logoutEventRepository.save(logoutEvent);

      // 2. Agregar el token a la lista negra
      const blacklistedToken = this.tokenBlacklistRepository.create({
        token,
        userId: user.id,
        expiresAt: tokenExpiresAt,
        reason: 'logout',
      });
      await this.tokenBlacklistRepository.save(blacklistedToken);

      return {
        message: 'Logout successful',
        userId: user.id,
        timestamp: new Date().toISOString(),
        tokenBlacklisted: true,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  // Método para verificar si un token está en la lista negra
  async isTokenBlacklisted(token: string): Promise<boolean> {
    const blacklisted = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });
    return !!blacklisted;
  }

  async updateUser(updateId: string, updateUserDto: UpdateUserDto, user: User) {
    try {
      const userFound = await this.userRepository.findOneBy({ id: updateId });

      console.log(user.roles.includes(ValidRoles.superUser));
      if (!userFound)
        throw new BadRequestException(`User with id: ${updateId} not found`);

      if (
        userFound.id !== user.id &&
        !user.roles.includes(ValidRoles.admin) &&
        !user.roles.includes(ValidRoles.superUser)
      )
        throw new UnauthorizedException(
          'No tienes permiso para actualizar este usuario',
        );

      if (updateUserDto.roles && !user.roles.includes(ValidRoles.superUser))
        throw new UnauthorizedException(
          'No tienes permiso para cambiar el Rol del usuario',
        );

      if (updateUserDto.password) {
        const newPassword = bcrypt.hashSync(updateUserDto.password, 10);
        updateUserDto.password = newPassword;
      }

      if (updateUserDto.roles) {
        if (updateUserDto.roles.includes(ValidRoles.superUser))
          throw new BadRequestException('Cannot assign superUser role');
        if (!updateUserDto.roles.includes(ValidRoles.user))
          throw new BadRequestException('User role is required');
        if (userFound.roles.includes(ValidRoles.superUser))
          throw new BadRequestException('Cannor change roles for superUser');
      }

      const isUpdate = await this.userRepository.update(
        updateId,
        updateUserDto,
      );

      if (isUpdate.affected === 0) {
        throw new BadRequestException(
          `User with id: ${updateId} could not be updated`,
        );
      }

      const updatedUser = Object.assign(userFound, {
        ...updateUserDto,
      });

      // Generar URL pre-firmada si tiene foto de perfil
      let profilePictureUrl: string | null = null;
      if (updatedUser.profilePicture) {
        profilePictureUrl = await this.minioService.getPresignedUrl(updatedUser.profilePicture);
      }

      delete (updatedUser as Partial<User>).password;
      delete (updatedUser as Partial<User>).isActive;
      delete (updatedUser as Partial<User>).createdAt;
      delete (updatedUser as Partial<User>).profilePicture;

      return {
        ...updatedUser,
        profilePictureUrl,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async remove(deleteId: string, user: User) {
    try {
      const userFound = await this.userRepository.findOneBy({ id: deleteId });

      if (!userFound)
        throw new BadRequestException(`User with id: ${deleteId} not found`);

      if (
        userFound.id !== user.id &&
        !user.roles.includes(ValidRoles.superUser) &&
        !user.roles.includes(ValidRoles.superUser)
      )
        throw new UnauthorizedException(
          'No tienes permiso para eliminar este usuario',
        );

      if (userFound.roles.includes(ValidRoles.superUser))
        throw new BadRequestException('Cannot delete superUser');

      const delet = await this.userRepository.update(deleteId, {
        isActive: false,
      });

      if (delet.affected === 0) {
        throw new BadRequestException(
          `User with id: ${deleteId} could not be deleted`,
        );
      }

      return { message: `User with id: ${deleteId} has been deleted` };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new BadRequestException(`User with id: ${id} not found`);

    // Generar URL pre-firmada si tiene foto de perfil
    let profilePictureUrl: string | null = null;
    if (user.profilePicture) {
      profilePictureUrl = await this.minioService.getPresignedUrl(user.profilePicture);
    }

    // Eliminar el campo profilePicture de la respuesta
    delete (user as Partial<User>).profilePicture;

    return {
      ...user,
      profilePictureUrl,
    };
  }

  async checkStatus(user: User) {
    try {
      console.log(user);
      const userBd = await this.userRepository.findOneBy({ id: user.id });
  
      const tokenReturn = this.getJwtToken({ id: user.id });
  
      return {
        userBd,
        tokenReturn,
      };
    } catch (error) {
      throw new InternalServerErrorException(error)
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: skip,
    });
    
    // Generar URLs pre-firmadas para cada usuario que tenga foto de perfil
    const usersWithUrls = await Promise.all(
      users.map(async (user) => {
        let profilePictureUrl: string | null = null;
        if (user.profilePicture) {
          profilePictureUrl = await this.minioService.getPresignedUrl(user.profilePicture);
        }
        
        // Eliminar el campo profilePicture de la respuesta
        delete (user as Partial<User>).profilePicture;
        
        return {
          ...user,
          profilePictureUrl,
        };
      }),
    );

    return {
      data: usersWithUrls,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasPrevious: page > 1,
        hasNext: page < Math.ceil(total / limit),
      },
    };
  }

  async uploadProfilePicture(file: Express.Multer.File, user: User) {
    try {
      // Si el usuario ya tiene una foto de perfil, eliminarla
      if (user.profilePicture) {
        await this.minioService.deleteImage(user.profilePicture);
      }

      // Subir la nueva imagen
      const fileName = await this.minioService.uploadImage(
        file.buffer,
        file.originalname,
        'profile-pictures',
      );

      // Actualizar el usuario con el nombre del archivo
      await this.userRepository.update(user.id, {
        profilePicture: fileName,
      });

      // Generar URL pre-firmada
      const presignedUrl = await this.minioService.getPresignedUrl(fileName);

      return {
        message: 'Profile picture uploaded successfully',
        fileName,
        url: presignedUrl,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  async deleteProfilePicture(user: User) {
    try {
      if (!user.profilePicture) {
        throw new BadRequestException('User does not have a profile picture');
      }

      // Eliminar la imagen de MinIO
      await this.minioService.deleteImage(user.profilePicture);

      // Actualizar el usuario
      await this.userRepository.update(user.id, {
        profilePicture: undefined,
      });

      return {
        message: 'Profile picture deleted successfully',
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
  }

  private getJwtToken(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }

  private handleDBErrors(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);

    if (error.status) throw error;
    console.log(error);

    throw new InternalServerErrorException('please check server logs');
  }
}
