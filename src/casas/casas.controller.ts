import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CasasService } from './casas.service';
import { CreateCasaDto } from './dto/create-casa.dto';
import { UpdateCasaDto } from './dto/update-casa.dto';

@Controller('casas')
export class CasasController {
  constructor(private readonly casasService: CasasService) {}

  @Post()
  create(@Body() createCasaDto: CreateCasaDto) {
    return this.casasService.create(createCasaDto);
  }

  @Get()
  findAll() {
    return this.casasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCasaDto: UpdateCasaDto) {
    return this.casasService.update(+id, updateCasaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casasService.remove(+id);
  }
}
