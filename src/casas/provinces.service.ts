import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/provinces.entity';
import { Municipality } from './entities/municipality.entity';

@Injectable()
export class ProvincesService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
  ) {}

  async findAll() {
    return await this.provinceRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getMunicipalities(provinceId: number) {
    const province = await this.provinceRepository.findOne({
      where: { id: provinceId },
    });

    if (!province) {
      throw new NotFoundException(`Provincia con ID ${provinceId} no encontrada`);
    }

    const municipalities = await this.municipalityRepository.find({
      where: { province: { id: provinceId } },
      order: { name: 'ASC' },
    });

    return {
      province: province.name,
      municipalities,
    };
  }
}
