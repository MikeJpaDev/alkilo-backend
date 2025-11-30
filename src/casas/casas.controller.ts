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
import { Auth } from 'src/auth/decorators/auth.decorator';
import { getUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities/user.entity';

@Controller('casas')
export class CasasController {
  constructor(private readonly casasService: CasasService) {}

  @Auth()
  @Post()
  create(@Body() createCasaDto: CreateCasaDto, @getUser() user: User) {
    return this.casasService.create(createCasaDto, user);
  }

  @Get()
  findAll() {
    return this.casasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.casasService.findOne(+id);
  }

  @Auth()
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCasaDto: UpdateCasaDto) {
    return this.casasService.update(+id, updateCasaDto);
  }

  @Auth()
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.casasService.remove(+id);
  }
}
