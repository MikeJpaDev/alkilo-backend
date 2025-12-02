import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateCasaDto } from './dto/create-casa.dto';
import { UpdateCasaDto } from './dto/update-casa.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Casa } from './entities/casa.entity';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Municipality } from './entities/municipality.entity';
import { Province } from './entities/provinces.entity';
import { MinioService } from 'src/common/minio/minio.service';

@Injectable()
export class CasasService {
  constructor(
    @InjectRepository(Casa)
    private readonly casaRepository: Repository<Casa>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    private readonly minioService: MinioService,
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
        contacts: createCasaDto.contacts, // Asignar los contactos
      });

      await this.casaRepository.save(casa); // Guarda la nueva casa en la base de datos

      delete (casa as Partial<Casa>).createdBy;

      console.log(createCasaDto.contacts);

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

  async uploadImages(id: number, files: Express.Multer.File[], user: User) {
    try {
      const casa = await this.casaRepository.findOne({
        where: { id: id.toString() },
        relations: ['createdBy'],
      });

      if (!casa) {
        throw new NotFoundException(`Casa with ID ${id} not found`);
      }

      // Verificar que el usuario sea el dueño de la casa
      if (casa.createdBy.id !== user.id) {
        throw new ForbiddenException('You can only upload images to your own properties');
      }

      // Subir las imágenes
      const fileData = files.map((file) => ({
        buffer: file.buffer,
        originalName: file.originalname,
      }));

      const fileNames = await this.minioService.uploadMultipleImages(
        fileData,
        `casas/${id}`,
      );

      // Agregar los nombres de archivos al array de imágenes
      casa.images = [...(casa.images || []), ...fileNames];

      await this.casaRepository.save(casa);

      // Generar URLs pre-firmadas
      const presignedUrls = await this.minioService.getMultiplePresignedUrls(fileNames);

      return {
        message: 'Images uploaded successfully',
        images: fileNames.map((fileName, index) => ({
          fileName,
          url: presignedUrls[index],
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async deleteImage(id: number, fileName: string, user: User) {
    try {
      const casa = await this.casaRepository.findOne({
        where: { id: id.toString() },
        relations: ['createdBy'],
      });

      if (!casa) {
        throw new NotFoundException(`Casa with ID ${id} not found`);
      }

      // Verificar que el usuario sea el dueño de la casa
      if (casa.createdBy.id !== user.id) {
        throw new ForbiddenException('You can only delete images from your own properties');
      }

      // Verificar que la imagen existe en la casa
      if (!casa.images.includes(fileName)) {
        throw new BadRequestException('Image not found in this property');
      }

      // Eliminar la imagen de MinIO
      await this.minioService.deleteImage(fileName);

      // Eliminar el nombre del archivo del array
      casa.images = casa.images.filter((img) => img !== fileName);

      await this.casaRepository.save(casa);

      return {
        message: 'Image deleted successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
