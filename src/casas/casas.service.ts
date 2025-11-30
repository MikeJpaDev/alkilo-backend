import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateCasaDto } from './dto/create-casa.dto';
import { UpdateCasaDto } from './dto/update-casa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Casa } from './entities/casa.entity';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Municipality } from './entities/municipality.entity';
import { Province } from './entities/provinces.entity';

@Injectable()
export class CasasService {
  constructor(
    @InjectRepository(Casa)
    private readonly casaRepository: Repository<Casa>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
  ) {}

  async create(createCasaDto: CreateCasaDto, user: User) {
    try {
      const { municipalityId, ...data } = createCasaDto;
      const municipio = await this.municipalityRepository.findOne({
        where: { id: municipalityId },
        relations: ['province'],
      });

      if (!municipio) throw new BadRequestException('Municipio Invalido');

      const casa = this.casaRepository.create({
        ...data,
        createdBy: user, // Relación con el usuario que crea la casa
        munipalityId: municipio, // Relación con el municipio
        provinceId: municipio.province, // Relación con la provincia
      });

      await this.casaRepository.save(casa); // Guarda la nueva casa en la base de datos

      delete (casa as Partial<Casa>).createdBy;

      return casa;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  findAll() {
    try {
      const casas = this.casaRepository.find({});

      return casas;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} casa`;
  }

  update(id: number, updateCasaDto: UpdateCasaDto) {
    return `This action updates a #${id} casa`;
  }

  remove(id: number) {
    return `This action removes a #${id} casa`;
  }
}
