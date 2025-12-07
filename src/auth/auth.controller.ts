import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
  ParseUUIDPipe,
  Req,
  Headers,
} from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Auth } from './decorators/auth.decorator';
import { getUser } from './decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { ValidRoles } from './interfaces/valid-roles';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, retorna token JWT' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Auth()
  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  logout(
    @getUser() user: User,
    @Headers('authorization') authorization: string,
    @Req() request: Request,
  ) {
    const token = authorization?.replace('Bearer ', '');
    const ipAddress = (request.ip || request.socket.remoteAddress) as string;
    const userAgent = request.headers['user-agent'];
    
    return this.authService.logout(user, token, ipAddress, userAgent);
  }

  @Auth()
  @Get('user/me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Información del usuario' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getMe(@getUser() user: User) {
    return this.authService.getMe(user);
  }

  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todos los usuarios (Solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios con paginación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.authService.findAll(paginationDto);
  }

  @Auth(ValidRoles.admin, ValidRoles.superUser)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener un usuario por ID (Solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.authService.findOne(id);
  }

  @Auth()
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @getUser() user: User,
  ) {
    return this.authService.updateUser(id, updateUserDto, user);
  }

  @Auth()
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 403, description: 'No tienes permisos' })
  remove(@Param('id', ParseUUIDPipe) id: string, @getUser() user: User) {
    return this.authService.remove(id, user);
  }

  @Auth()
  @Post('profile-picture')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir foto de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Foto de perfil actualizada' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @UploadedFile() file: Express.Multer.File,
    @getUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.authService.uploadProfilePicture(file, user);
  }

  @Auth()
  @Delete('profile-picture')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar foto de perfil' })
  @ApiResponse({ status: 200, description: 'Foto de perfil eliminada' })
  deleteProfilePicture(@getUser() user: User) {
    return this.authService.deleteProfilePicture(user);
  }
}
