import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from '../entities/provinces.entity';
import { Municipality } from '../entities/municipality.entity';
import { provincesMunicipalitiesData } from './provinces-municipalities.seed';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
  ) {}

  async onModuleInit() {
    await this.seedProvincesAndMunicipalities();
  }

  private async seedProvincesAndMunicipalities() {
    // Verificar si ya existen provincias
    const count = await this.provinceRepository.count();
    if (count > 0) {
      console.log('✓ Provinces and municipalities already seeded');
      return;
    }

    console.log('⏳ Seeding provinces and municipalities...');

    for (const provinceData of provincesMunicipalitiesData) {
      // Crear provincia
      const province = this.provinceRepository.create({
        name: provinceData.name,
      });
      const savedProvince = await this.provinceRepository.save(province);

      // Crear municipios
      for (const municipalityName of provinceData.municipalities) {
        const municipality = this.municipalityRepository.create({
          name: municipalityName,
          province: savedProvince,
        });
        await this.municipalityRepository.save(municipality);
      }
    }

    console.log('✓ Provinces and municipalities seeded successfully');
  }
}
