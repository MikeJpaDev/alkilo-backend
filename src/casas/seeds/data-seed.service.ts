import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Casa } from '../entities/casa.entity';
import { Municipality } from '../entities/municipality.entity';
import { Province } from '../entities/provinces.entity';
import * as bcrypt from 'bcrypt';
import { usersSeedData } from 'src/auth/seeds/users.seed';
import { casasSeedData } from './casas.seed';
import { provincesMunicipalitiesData } from './provinces-municipalities.seed';

@Injectable()
export class DataSeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Casa)
    private readonly casaRepository: Repository<Casa>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
  ) {}

  async onModuleInit() {
    await this.seedProvincesAndMunicipalities();
    await this.seedUsers();
    await this.seedCasas();
  }

  private async seedProvincesAndMunicipalities() {
    const count = await this.provinceRepository.count();
    if (count > 0) {
      console.log('✓ Provinces and municipalities already seeded');
      return;
    }

    console.log('🌱 Seeding provinces and municipalities...');

    for (const provinceData of provincesMunicipalitiesData) {
      const province = this.provinceRepository.create({
        name: provinceData.name,
      });
      const savedProvince = await this.provinceRepository.save(province);

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

  private async seedUsers() {
    const existingUsers = await this.userRepository.count();
    if (existingUsers > 0) {
      console.log('✓ Users already seeded');
      return;
    }

    console.log('🌱 Seeding users...');

    for (const userData of usersSeedData) {
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(userData.password, 10),
        roles: ['user'],
      });

      await this.userRepository.save(user);
    }

    console.log(`✓ ${usersSeedData.length} users seeded successfully`);
  }

  private async seedCasas() {
    const existingCasas = await this.casaRepository.count();
    if (existingCasas > 0) {
      console.log('✓ Casas already seeded');
      return;
    }

    console.log('🌱 Seeding casas...');

    for (const casaData of casasSeedData) {
      // Buscar el usuario por email
      const user = await this.userRepository.findOne({
        where: { email: casaData.userEmail },
      });

      if (!user) {
        console.warn(`⚠️  User with email ${casaData.userEmail} not found, skipping casa: ${casaData.title}`);
        continue;
      }

      // Buscar el municipio
      const municipality = await this.municipalityRepository.findOne({
        where: { id: casaData.municipalityId },
        relations: ['province'],
      });

      if (!municipality) {
        console.warn(`⚠️  Municipality with ID ${casaData.municipalityId} not found, skipping casa: ${casaData.title}`);
        continue;
      }

      const casa = this.casaRepository.create({
        title: casaData.title,
        description: casaData.description,
        pricePerNight: casaData.pricePerNight,
        bedroomsCount: casaData.bedroomsCount,
        bathroomsCount: casaData.bathroomsCount,
        capacityPeople: casaData.capacityPeople,
        address: casaData.address,
        createdBy: user,
        munipalityId: municipality,
        provinceId: municipality.province,
        contacts: casaData.contacts,
      });

      await this.casaRepository.save(casa);
    }

    console.log(`✓ ${casasSeedData.length} casas seeded successfully`);
  }
}
