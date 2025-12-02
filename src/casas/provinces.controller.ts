import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ProvincesService } from './provinces.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRoles } from 'src/auth/interfaces/valid-roles';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Provinces')
@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Auth(ValidRoles.user, ValidRoles.admin, ValidRoles.superUser)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener todas las provincias' })
  @ApiResponse({ status: 200, description: 'Lista de provincias con paginación' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.provincesService.findAll(paginationDto);
  }

  @Auth(ValidRoles.user, ValidRoles.admin, ValidRoles.superUser)
  @Get(':id/municipalities')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener municipios de una provincia' })
  @ApiParam({ name: 'id', description: 'ID de la provincia', example: 3 })
  @ApiResponse({ status: 200, description: 'Lista de municipios de la provincia' })
  @ApiResponse({ status: 404, description: 'Provincia no encontrada' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getMunicipalities(@Param('id') id: string) {
    return this.provincesService.getMunicipalities(+id);
  }
}
