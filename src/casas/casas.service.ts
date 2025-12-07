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
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, ILike } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { Municipality } from './entities/municipality.entity';
import { Province } from './entities/provinces.entity';
import { MinioService } from 'src/common/minio/minio.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchSuggestionsDto } from './dto/search-suggestions.dto';
import { SearchCasasDto } from './dto/search-casas.dto';
import { Review } from 'src/review/entities/review.entity';

@Injectable()
export class CasasService {
  constructor(
    @InjectRepository(Casa)
    private readonly casaRepository: Repository<Casa>,
    @InjectRepository(Municipality)
    private readonly municipalityRepository: Repository<Municipality>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
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

  async findAll(paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10, userId, precioMax, precioMinimo, direccion } = paginationDto;
      const skip = (page - 1) * limit;

      // Construir el objeto where dinámicamente
      const where: any = {};
      
      if (userId) {
        where.createdBy = { id: userId };
      }
      
      // Filtro de precio
      if (precioMax !== undefined && precioMinimo !== undefined) {
        where.price = Between(precioMinimo, precioMax);
      } else if (precioMinimo !== undefined) {
        where.price = MoreThanOrEqual(precioMinimo);
      } else if (precioMax !== undefined) {
        where.price = LessThanOrEqual(precioMax);
      }
      
      if (direccion) {
        where.address = ILike(`%${direccion}%`);
      }

      const [casas, total] = await this.casaRepository.findAndCount({
        where,
        relations: ['createdBy', 'munipalityId', 'provinceId', 'contacts'],
        select: {
          createdBy: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        take: limit,
        skip: skip,
      });

      // Generar URLs pre-firmadas para las imágenes de cada casa
      const casasWithUrls = await Promise.all(
        casas.map(async (casa) => {
          let imageUrls: { fileName: string; url: string }[] = [];
          if (casa.images && casa.images.length > 0) {
            const presignedUrls = await this.minioService.getMultiplePresignedUrls(casa.images);
            imageUrls = casa.images.map((fileName, index) => ({
              fileName,
              url: presignedUrls[index],
            }));
          }
          
          // Eliminar el campo images de la respuesta
          delete (casa as any).images;
          
          return {
            ...casa,
            imageUrls,
          };
        }),
      );

      return {
        data: casasWithUrls,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasPrevious: page > 1,
          hasNext: page < Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findByUser(userId: string, paginationDto: PaginationDto) {
    try {
      const { page = 1, limit = 10 } = paginationDto;
      const skip = (page - 1) * limit;

      const [casas, total] = await this.casaRepository.findAndCount({
        where: { createdBy: { id: userId } },
        relations: ['createdBy', 'munipalityId', 'provinceId', 'contacts'],
        select: {
          createdBy: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        take: limit,
        skip: skip,
        order: {
          createDate: 'DESC',
        },
      });

      // Generar URLs pre-firmadas para las imágenes de cada casa
      const casasWithUrls = await Promise.all(
        casas.map(async (casa) => {
          let imageUrls: { fileName: string; url: string }[] = [];
          if (casa.images && casa.images.length > 0) {
            const presignedUrls = await this.minioService.getMultiplePresignedUrls(casa.images);
            imageUrls = casa.images.map((fileName, index) => ({
              fileName,
              url: presignedUrls[index],
            }));
          }
          
          delete (casa as any).images;
          
          return {
            ...casa,
            imageUrls,
          };
        }),
      );

      return {
        data: casasWithUrls,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasPrevious: page > 1,
          hasNext: page < Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async findOne(id: string, currentUser?: User) {
    try {
      const casa = await this.casaRepository.findOne({
        where: { id: id },
        relations: ['createdBy', 'munipalityId', 'provinceId', 'contacts'],
        select: {
          createdBy: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      });

      if (!casa) {
        throw new NotFoundException(`Casa with ID ${id} not found`);
      }

      // Obtener todas las reseñas de esta casa
      const reviews = await this.reviewRepository.find({
        where: { casaFk: { id: id } },
        relations: ['userFk'],
        select: {
          userFk: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        order: { createdAt: 'DESC' },
      });

      // Verificar si el usuario actual ya ha comentado (solo si está autenticado)
      let userHasReviewed: boolean | null = null;
      let userReviewId: number | null = null;
      if (currentUser) {
        const userReview = reviews.find(
          (review) => review.userFk.id === currentUser.id,
        );
        if (userReview) {
          userHasReviewed = true;
          userReviewId = userReview.id;
        } else {
          userHasReviewed = false;
        }
      }

      // Formatear las reseñas
      const formattedReviews = reviews.map((review) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        user: review.userFk,
      }));

      // Calcular promedio de calificaciones
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          : 0;

      // Generar URLs pre-firmadas para las imágenes
      let imageUrls: { fileName: string; url: string }[] = [];
      if (casa.images && casa.images.length > 0) {
        const presignedUrls = await this.minioService.getMultiplePresignedUrls(
          casa.images,
        );
        imageUrls = casa.images.map((fileName, index) => ({
          fileName,
          url: presignedUrls[index],
        }));
      }

      // Eliminar el campo images de la respuesta
      delete (casa as any).images;

      return {
        ...casa,
        imageUrls,
        reviews: formattedReviews,
        reviewsCount: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10, // Redondear a 1 decimal
        userHasReviewed,
        userReviewId,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async update(id: string, updateCasaDto: UpdateCasaDto, user: User) {
    try {
      const casa = await this.casaRepository.findOne({
        where: { id: id },
        relations: ['createdBy'],
      });

      if (!casa) {
        throw new NotFoundException(`Casa with ID ${id} not found`);
      }

      // Verificar que el usuario sea el dueño de la casa
      if (casa.createdBy.id !== user.id) {
        throw new ForbiddenException('You can only update your own properties');
      }

      // Actualizar los campos
      Object.assign(casa, updateCasaDto);

      await this.casaRepository.save(casa);

      // Retornar la casa actualizada sin información sensible del usuario
      const updatedCasa = await this.casaRepository.findOne({
        where: { id: id },
        relations: ['createdBy', 'munipalityId', 'provinceId', 'contacts'],
        select: {
          createdBy: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      });

      return updatedCasa;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async remove(id: string, user: User) {
    try {
      const casa = await this.casaRepository.findOne({
        where: { id: id },
        relations: ['createdBy'],
      });

      if (!casa) {
        throw new NotFoundException(`Casa with ID ${id} not found`);
      }

      // Verificar que el usuario sea el dueño de la casa
      if (casa.createdBy.id !== user.id) {
        throw new ForbiddenException('You can only delete your own properties');
      }

      // Eliminar todas las imágenes de MinIO si existen
      if (casa.images && casa.images.length > 0) {
        await this.minioService.deleteMultipleImages(casa.images);
      }

      await this.casaRepository.remove(casa);

      return {
        message: 'Casa deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async uploadImages(id: string, files: Express.Multer.File[], user: User) {
    try {
      const casa = await this.casaRepository.findOne({
        where: { id: id },
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
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async deleteImage(id: string, fileName: string, user: User) {
    try {
      const casa = await this.casaRepository.findOne({
        where: { id: id },
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
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(error);
    }
  }

  async searchSuggestions(searchDto: SearchSuggestionsDto) {
    try {
      const { query, limit = 10 } = searchDto;
      const searchTerm = `%${query}%`;

      const casas = await this.casaRepository
        .createQueryBuilder('casa')
        .leftJoinAndSelect('casa.munipalityId', 'municipality')
        .leftJoinAndSelect('casa.provinceId', 'province')
        .where('LOWER(casa.title) LIKE LOWER(:searchTerm)', { searchTerm })
        .orWhere('LOWER(casa.address) LIKE LOWER(:searchTerm)', { searchTerm })
        .orWhere('LOWER(municipality.name) LIKE LOWER(:searchTerm)', { searchTerm })
        .orWhere('LOWER(province.name) LIKE LOWER(:searchTerm)', { searchTerm })
        .take(limit)
        .getMany();

      // Crear sugerencias con relevancia
      const suggestions = casas.map((casa) => {
        const title = casa.title;
        const address = casa.address;
        const municipality = casa.munipalityId?.name || '';
        const province = casa.provinceId?.name || '';

        // Calcular relevancia basada en dónde se encontró la coincidencia
        let relevance = 0;
        const lowerQuery = query.toLowerCase();

        if (title.toLowerCase().includes(lowerQuery)) {
          relevance += 4; // Mayor peso al título
        }
        if (municipality.toLowerCase().includes(lowerQuery)) {
          relevance += 3;
        }
        if (province.toLowerCase().includes(lowerQuery)) {
          relevance += 2;
        }
        if (address.toLowerCase().includes(lowerQuery)) {
          relevance += 1;
        }

        // Generar la frase de sugerencia
        const suggestion = `${title} - ${municipality}, ${province}`;

        return {
          id: casa.id,
          suggestion,
          title,
          address,
          municipality,
          province,
          relevance,
        };
      });

      // Ordenar por relevancia descendente
      suggestions.sort((a, b) => b.relevance - a.relevance);

      // Retornar solo las sugerencias únicas
      const uniqueSuggestions = suggestions
        .filter((item, index, self) =>
          index === self.findIndex((t) => t.suggestion === item.suggestion)
        )
        .map(({ suggestion, id, title, municipality, province }) => ({
          id,
          suggestion,
          title,
          location: `${municipality}, ${province}`,
        }));

      return uniqueSuggestions;
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async searchCasas(searchDto: SearchCasasDto) {
    try {
      const { query, page = 1, limit = 10, sortBy = 'relevance' } = searchDto;
      const skip = (page - 1) * limit;
      const searchTerm = `%${query}%`;

      // Construir query base
      const queryBuilder = this.casaRepository
        .createQueryBuilder('casa')
        .leftJoinAndSelect('casa.createdBy', 'createdBy')
        .leftJoinAndSelect('casa.munipalityId', 'municipality')
        .leftJoinAndSelect('casa.provinceId', 'province')
        .leftJoinAndSelect('casa.contacts', 'contacts')
        .select([
          'casa',
          'createdBy.id',
          'createdBy.firstName',
          'createdBy.lastName',
          'createdBy.email',
          'municipality',
          'province',
          'contacts',
        ])
        .where('LOWER(casa.title) LIKE LOWER(:searchTerm)', { searchTerm })
        .orWhere('LOWER(casa.address) LIKE LOWER(:searchTerm)', { searchTerm })
        .orWhere('LOWER(municipality.name) LIKE LOWER(:searchTerm)', { searchTerm })
        .orWhere('LOWER(province.name) LIKE LOWER(:searchTerm)', { searchTerm });

      // Aplicar ordenamiento
      switch (sortBy) {
        case 'price_asc':
          queryBuilder.orderBy('casa.pricePerNight', 'ASC');
          break;
        case 'price_desc':
          queryBuilder.orderBy('casa.pricePerNight', 'DESC');
          break;
        case 'newest':
          queryBuilder.orderBy('casa.createDate', 'DESC');
          break;
        case 'relevance':
        default:
          // Para relevancia, ordenamos por título primero
          queryBuilder.orderBy('casa.title', 'ASC');
          break;
      }

      // Obtener total y datos con paginación
      const [casas, total] = await queryBuilder
        .skip(skip)
        .take(limit)
        .getManyAndCount();

      // Calcular relevancia para ordenamiento si es necesario
      let casasWithRelevance = casas;
      if (sortBy === 'relevance') {
        casasWithRelevance = casas.map((casa) => {
          let relevance = 0;
          const lowerQuery = query.toLowerCase();

          if (casa.title.toLowerCase().includes(lowerQuery)) relevance += 4;
          if (casa.munipalityId?.name.toLowerCase().includes(lowerQuery)) relevance += 3;
          if (casa.provinceId?.name.toLowerCase().includes(lowerQuery)) relevance += 2;
          if (casa.address.toLowerCase().includes(lowerQuery)) relevance += 1;

          return { ...casa, relevance };
        });

        // Ordenar por relevancia
        casasWithRelevance.sort((a: any, b: any) => b.relevance - a.relevance);
      }

      // Generar URLs pre-firmadas para las imágenes
      const casasWithUrls = await Promise.all(
        casasWithRelevance.map(async (casa) => {
          let imageUrls: { fileName: string; url: string }[] = [];
          if (casa.images && casa.images.length > 0) {
            const presignedUrls = await this.minioService.getMultiplePresignedUrls(casa.images);
            imageUrls = casa.images.map((fileName, index) => ({
              fileName,
              url: presignedUrls[index],
            }));
          }

          // Eliminar el campo images y relevance de la respuesta
          delete (casa as any).images;
          delete (casa as any).relevance;

          return {
            ...casa,
            imageUrls,
          };
        }),
      );

      const totalPages = Math.ceil(total / limit);

      return {
        data: casasWithUrls,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasPrevious: page > 1,
          hasNext: page < totalPages,
        },
        searchInfo: {
          query,
          sortBy,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
