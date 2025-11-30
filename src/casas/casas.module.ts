import { Module } from '@nestjs/common';
import { CasasService } from './casas.service';
import { CasasController } from './casas.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Casa } from './entities/casa.entity';
import { Province } from './entities/provinces.entity';
import { Municipality } from './entities/municipality.entity';
import { ContactPhone } from './entities/contact-phone.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Casa, Province, Municipality, ContactPhone]),
  ],
  controllers: [CasasController],
  providers: [CasasService],
})
export class CasasModule {}
