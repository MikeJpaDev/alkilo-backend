import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/provinces.entity';
import { Municipality } from './entities/municipality.entity';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProvincesService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [provinces, total] = await this.provinceRepository.findAndCount({
      order: { name: 'ASC' },
      take: limit,
      skip: skip,
    });

    return {
      data: provinces,
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
