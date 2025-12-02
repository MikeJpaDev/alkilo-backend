import { Module } from '@nestjs/common';
import { CasasService } from './casas.service';
import { CasasController } from './casas.controller';
import { ProvincesController } from './provinces.controller';
import { ProvincesService } from './provinces.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Casa } from './entities/casa.entity';
import { Province } from './entities/provinces.entity';
import { Municipality } from './entities/municipality.entity';
import { ContactPhone } from './entities/contact-phone.entity';
import { AuthModule } from 'src/auth/auth.module';
import { SeedService } from './seeds/seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Casa, Province, Municipality, ContactPhone]),
    AuthModule,
  ],
  controllers: [CasasController, ProvincesController],
  providers: [CasasService, ProvincesService, SeedService],
})
export class CasasModule {}
