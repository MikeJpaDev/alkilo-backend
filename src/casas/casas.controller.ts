import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CasasService } from './casas.service';
import { CreateCasaDto } from './dto/create-casa.dto';
import { UpdateCasaDto } from './dto/update-casa.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { getUser } from 'src/auth/decorators/get-user.decorator';
import { GetUserOptional } from 'src/auth/decorators/get-user-optional.decorator';
import { User } from 'src/auth/entities/user.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchSuggestionsDto } from './dto/search-suggestions.dto';
import { SearchCasasDto } from './dto/search-casas.dto';

@ApiTags('Casas')
@Controller('casas')
export class CasasController {
  constructor(private readonly casasService: CasasService) {}

  @Auth()
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva casa para alquilar' })
  @ApiResponse({ status: 201, description: 'Casa creada exitosamente' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  create(@Body() createCasaDto: CreateCasaDto, @getUser() user: User) {
    return this.casasService.create(createCasaDto, user);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las casas disponibles' })
  @ApiResponse({ status: 200, description: 'Lista de casas con paginación' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.casasService.findAll(paginationDto);
  }

  @Auth()
  @Get('my-casas')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener las casas creadas por el usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Lista de casas del usuario con paginación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getMyCasas(@Query() paginationDto: PaginationDto, @getUser() user: User) {
    return this.casasService.findByUser(user.id, paginationDto);
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Buscar sugerencias de casas' })
  @ApiResponse({ status: 200, description: 'Lista de sugerencias ordenadas por relevancia' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  searchSuggestions(@Query() searchDto: SearchSuggestionsDto) {
    return this.casasService.searchSuggestions(searchDto);
  }

  @Get('search/results')
  @ApiOperation({ summary: 'Buscar casas con filtros y ordenamiento' })
  @ApiResponse({ status: 200, description: 'Casas encontradas ordenadas según criterio' })
  @ApiResponse({ status: 400, description: 'Parámetros inválidos' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  searchCasas(@Query() searchDto: SearchCasasDto) {
    return this.casasService.searchCasas(searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una casa por ID con sus reseñas' })
  @ApiResponse({ status: 200, description: 'Casa encontrada con lista de reseñas' })
  @ApiResponse({ status: 404, description: 'Casa no encontrada' })
  findOne(@Param('id') id: string) {
    return this.casasService.findOne(id);
  }

  @Auth()
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una casa' })
  @ApiResponse({ status: 200, description: 'Casa actualizada' })
  @ApiResponse({ status: 404, description: 'Casa no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para actualizar esta casa' })
  update(
    @Param('id') id: string,
    @Body() updateCasaDto: UpdateCasaDto,
    @getUser() user: User,
  ) {
    return this.casasService.update(id, updateCasaDto, user);
  }

  @Auth()
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una casa' })
  @ApiResponse({ status: 200, description: 'Casa eliminada' })
  @ApiResponse({ status: 404, description: 'Casa no encontrada' })
  @ApiResponse({ status: 403, description: 'No tienes permiso para eliminar esta casa' })
  remove(@Param('id') id: string, @getUser() user: User) {
    return this.casasService.remove(id, user);
  }

  @Auth()
  @Post(':id/images')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Subir imágenes a una casa' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Imágenes subidas exitosamente' })
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @getUser() user: User,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    return this.casasService.uploadImages(id, files, user);
  }

  @Auth()
  @Delete(':id/images/:fileName')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una imagen de una casa' })
  @ApiResponse({ status: 200, description: 'Imagen eliminada' })
  deleteImage(
    @Param('id') id: string,
    @Param('fileName') fileName: string,
    @getUser() user: User,
  ) {
    return this.casasService.deleteImage(id, fileName, user);
  }
}
