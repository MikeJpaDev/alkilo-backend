import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CasasService } from './casas.service';
import { CreateCasaDto } from './dto/create-casa.dto';
import { UpdateCasaDto } from './dto/update-casa.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { getUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';

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
  @ApiResponse({ status: 200, description: 'Lista de casas' })
  findAll() {
    return this.casasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una casa por ID' })
  @ApiResponse({ status: 200, description: 'Casa encontrada' })
  @ApiResponse({ status: 404, description: 'Casa no encontrada' })
  findOne(@Param('id') id: string) {
    return this.casasService.findOne(+id);
  }

  @Auth()
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar una casa' })
  @ApiResponse({ status: 200, description: 'Casa actualizada' })
  @ApiResponse({ status: 404, description: 'Casa no encontrada' })
  update(@Param('id') id: string, @Body() updateCasaDto: UpdateCasaDto) {
    return this.casasService.update(+id, updateCasaDto);
  }

  @Auth()
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar una casa' })
  @ApiResponse({ status: 200, description: 'Casa eliminada' })
  @ApiResponse({ status: 404, description: 'Casa no encontrada' })
  remove(@Param('id') id: string) {
    return this.casasService.remove(+id);
  }
}
