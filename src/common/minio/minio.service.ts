import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MinioService implements OnModuleInit {
  private readonly logger = new Logger(MinioService.name);
  private minioClient: Minio.Client;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('MINIO_BUCKET_NAME') || 'alkilo-uploads';

    this.minioClient = new Minio.Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') || 'localhost',
      port: parseInt(this.configService.get<string>('MINIO_PORT') || '9000'),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY') || 'minioadmin',
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY') || 'minioadmin123',
    });
  }

  async onModuleInit() {
    await this.ensureBucketExists();
  }

  private async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.log(`✓ Bucket "${this.bucketName}" created successfully`);

        // Configurar política de acceso público para lectura
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${this.bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(
          this.bucketName,
          JSON.stringify(policy),
        );
        this.logger.log(`✓ Bucket policy set for public read access`);
      } else {
        this.logger.log(`✓ Bucket "${this.bucketName}" already exists`);
      }
    } catch (error) {
      this.logger.error(`Error ensuring bucket exists: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sube una imagen a MinIO
   * @param file - Buffer del archivo
   * @param originalName - Nombre original del archivo
   * @param folder - Carpeta donde se guardará (ej: 'casas', 'users')
   * @returns Nombre del archivo en MinIO
   */
  async uploadImage(
    file: Buffer,
    originalName: string,
    folder: string = 'images',
  ): Promise<string> {
    try {
      const fileExtension = originalName.split('.').pop();
      if (!fileExtension) {
        throw new BadRequestException('File must have an extension');
      }

      const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

      if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
        throw new BadRequestException(
          'Invalid file type. Only images are allowed (jpg, jpeg, png, webp, gif)',
        );
      }

      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;
      const metaData = {
        'Content-Type': this.getContentType(fileExtension),
        'Content-Length': file.length.toString(),
      };

      await this.minioClient.putObject(
        this.bucketName,
        fileName,
        file,
        file.length,
        metaData,
      );

      this.logger.log(`✓ File uploaded: ${fileName}`);
      return fileName;
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sube múltiples imágenes
   * @param files - Array de buffers de archivos
   * @param folder - Carpeta donde se guardarán
   * @returns Array de nombres de archivos en MinIO
   */
  async uploadMultipleImages(
    files: Array<{ buffer: Buffer; originalName: string }>,
    folder: string = 'images',
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadImage(file.buffer, file.originalName, folder),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Elimina una imagen de MinIO
   * @param fileName - Nombre del archivo en MinIO
   */
  async deleteImage(fileName: string): Promise<void> {
    try {
      await this.minioClient.removeObject(this.bucketName, fileName);
      this.logger.log(`✓ File deleted: ${fileName}`);
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Elimina múltiples imágenes
   * @param fileNames - Array de nombres de archivos
   */
  async deleteMultipleImages(fileNames: string[]): Promise<void> {
    const deletePromises = fileNames.map((fileName) =>
      this.deleteImage(fileName),
    );
    await Promise.all(deletePromises);
  }

  /**
   * Genera una URL pre-firmada para acceder a un archivo
   * @param fileName - Nombre del archivo en MinIO
   * @param expirySeconds - Tiempo de expiración en segundos (por defecto 24 horas)
   * @returns URL pre-firmada
   */
  async getPresignedUrl(
    fileName: string,
    expirySeconds: number = 24 * 60 * 60,
  ): Promise<string> {
    try {
      const url = await this.minioClient.presignedGetObject(
        this.bucketName,
        fileName,
        expirySeconds,
      );
      return url;
    } catch (error) {
      this.logger.error(`Error generating presigned URL: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera URLs pre-firmadas para múltiples archivos
   * @param fileNames - Array de nombres de archivos
   * @param expirySeconds - Tiempo de expiración en segundos
   * @returns Array de URLs pre-firmadas
   */
  async getMultiplePresignedUrls(
    fileNames: string[],
    expirySeconds: number = 24 * 60 * 60,
  ): Promise<string[]> {
    const urlPromises = fileNames.map((fileName) =>
      this.getPresignedUrl(fileName, expirySeconds),
    );
    return Promise.all(urlPromises);
  }

  /**
   * Obtiene la URL pública del archivo (si el bucket tiene política pública)
   * @param fileName - Nombre del archivo
   * @returns URL pública
   */
  getPublicUrl(fileName: string): string {
    const protocol = this.configService.get<string>('MINIO_USE_SSL') === 'true' ? 'https' : 'http';
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = this.configService.get<string>('MINIO_PORT');
    return `${protocol}://${endpoint}:${port}/${this.bucketName}/${fileName}`;
  }

  /**
   * Obtiene el tipo de contenido basado en la extensión del archivo
   */
  private getContentType(extension: string): string {
    const contentTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}
