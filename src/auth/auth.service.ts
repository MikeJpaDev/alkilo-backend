import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidRoles } from './interfaces/valid-roles';
import { MinioService } from 'src/common/minio/minio.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

      delete (user as Partial<User>).password;
      delete (user as Partial<User>).isActive;
      delete (user as Partial<User>).createdAt;

      return {
        ...user,
        token: tokenReturn,
      };
    } catch (error) {
      this.handleDBErrors(error);
    }
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

      delete (updatedUser as Partial<User>).password;
      delete (updatedUser as Partial<User>).isActive;
      delete (updatedUser as Partial<User>).createdAt;

      return updatedUser;
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
      this.handleDBErrors(error);
    }
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) throw new BadRequestException(`User with id: ${id} not found`);

    return user;
  }

  async findAll() {
    const users = await this.userRepository.find();
    return users;
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
