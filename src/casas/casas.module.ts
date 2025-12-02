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
import { DataSeedService } from './seeds/data-seed.service';
import { User } from 'src/auth/entities/user.entity';
import { Review } from 'src/review/entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Casa, Province, Municipality, ContactPhone, User, Review]),
    AuthModule,
  ],
  controllers: [CasasController, ProvincesController],
  providers: [CasasService, ProvincesService, DataSeedService],
})
export class CasasModule {}
