import {
  DeleteObjectCommand,
  DeleteObjectCommandOutput,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectOutput,
  ListObjectsV2Command,
  ListObjectsV2CommandOutput,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { StorageTypesEnum } from 'src/common/enums';
import S3KeyService from './s3_key.service';
import { createReadStream } from 'node:fs';
import { S3Exception } from 'src/common/error';
import { Progress, Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
class S3Service {
  private _s3ClientObject: S3Client;
  constructor(private _keyService: S3KeyService) {
    this._s3ClientObject = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  uploadFile = async ({
    StorageApproach = StorageTypesEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME!,
    ACL = 'private',
    Path = 'general',
    File,
  }: {
    StorageApproach?: StorageTypesEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    Path?: string;
    File: Express.Multer.File;
  }): Promise<string> => {
    const subKey = this._keyService.generateS3SubKey({
      Path,
      originalname: File.originalname,
    });

    const command = new PutObjectCommand({
      Bucket,
      ACL,
      Key: this._keyService.generateS3KeyFromSubKey(subKey),
      Body:
        StorageApproach === StorageTypesEnum.memory
          ? File.buffer!
          : createReadStream(File.path!),
      ContentType: File.mimetype,
    });

    await this._s3ClientObject.send(command).catch((error) => {
      throw new S3Exception(error, `Failed to upload file ☹️`);
    });
    if (!command.input.Key) {
      throw new S3Exception(undefined, 'Failed to Retrieve Upload Key');
    }
    return subKey;
  };

  uploadFiles = async ({
    StorageApproach = StorageTypesEnum.memory,
    Bucket = process.env.AWS_BUCKET_NAME!,
    ACL = 'private',
    Path = 'general',
    Files,
  }: {
    StorageApproach?: StorageTypesEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    Path?: string;
    Files: Express.Multer.File[];
  }): Promise<string[]> => {
    const subKeys = await Promise.all(
      Files.map(
        (File): Promise<string> =>
          this.uploadFile({
            File,
            StorageApproach,
            Bucket,
            ACL,
            Path,
          }),
      ),
    );
    if (subKeys.length == 0) {
      throw new S3Exception(undefined, 'Failed to Retrieve Upload Keys');
    }
    return subKeys;
  };

  uploadLargeFile = async ({
    StorageApproach = StorageTypesEnum.disk,
    Bucket = process.env.AWS_BUCKET_NAME,
    ACL = 'private',
    Path = 'general',
    File,
  }: {
    StorageApproach?: StorageTypesEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    Path?: string;
    File: Express.Multer.File;
  }): Promise<string> => {
    const subKey = this._keyService.generateS3SubKey({
      Path,
      originalname: File.originalname,
    });

    const upload = new Upload({
      client: this._s3ClientObject,
      params: {
        Bucket,
        ACL,
        Key: this._keyService.generateS3KeyFromSubKey(subKey),
        Body:
          StorageApproach === StorageTypesEnum.memory
            ? File.buffer
            : createReadStream(File.path),
        ContentType: File.mimetype,
      },
    });

    upload.on('httpUploadProgress', (progress: Progress) => {
      console.log('Large Upload File Progress:::', progress);
    });

    upload.done().catch((error) => {
      throw new S3Exception(error, `Failed to upload file ☹️.`);
    });
    const { Key } = await upload.done();
    if (!Key) {
      throw new S3Exception(undefined, 'Failed to Retrieve Upload Key');
    }
    return subKey;
  };

  uploadLargeFiles = async ({
    StorageApproach = StorageTypesEnum.disk,
    Bucket = process.env.AWS_BUCKET_NAME!,
    ACL = 'private',
    Path = 'general',
    Files,
  }: {
    StorageApproach?: StorageTypesEnum;
    Bucket?: string;
    ACL?: ObjectCannedACL;
    Path?: string;
    Files: Express.Multer.File[];
  }): Promise<string[]> => {
    const subKeys = await Promise.all(
      Files.map((File) =>
        this.uploadLargeFile({
          File,
          StorageApproach,
          Bucket,
          ACL,
          Path,
        }),
      ),
    );

    if ((subKeys.length = 0)) {
      throw new S3Exception(undefined, 'Failed to Retrieve Upload Keys');
    }

    return subKeys;
  };

  createPresignedUploadUrl = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    originalname,
    Path = 'general',
    contentType,
    expiresIn = Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS),
  }: {
    Bucket?: string;
    originalname: string;
    Path?: string;
    contentType: string;
    expiresIn?: number;
  }): Promise<{ url: string; key: string }> => {
    const subKey = this._keyService.generateS3SubKey({
      Path,
      tag: 'presigned',
      originalname,
    });

    const command = new PutObjectCommand({
      Bucket,
      Key: this._keyService.generateS3KeyFromSubKey(subKey),
      ContentType: contentType,
    });
    const url = await getSignedUrl(this._s3ClientObject, command, {
      expiresIn,
    }).catch((error) => {
      throw new S3Exception(error, `Failed to create presigned upload url ☹️.`);
    });
    if (!url || !command.input.Key) {
      throw new S3Exception(undefined, 'Failed to Create Presigned URL');
    }
    return { url, key: subKey };
  };

  createPresignedGetUrl = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    SubKey,
    expiresIn = Number(process.env.AWS_PRESIGNED_URL_EXPIRES_IN_SECONDS),
    download = 'false',
    downloadName,
  }: {
    Bucket?: string;
    SubKey: string;
    expiresIn?: number;
    download?: string | undefined;
    downloadName?: string | undefined;
  }): Promise<string> => {
    const command = new GetObjectCommand({
      Bucket,
      Key: this._keyService.generateS3KeyFromSubKey(SubKey),
      ResponseContentDisposition:
        download === 'true'
          ? `attachment; filename="${
              downloadName
                ? `${downloadName}.${SubKey.split('.').pop() ?? ''}`
                : SubKey.split('/').pop()
            }"`
          : undefined,
    });
    const url = await getSignedUrl(this._s3ClientObject, command, {
      expiresIn,
    }).catch((error) => {
      throw new S3Exception(error, `Failed to create presigned get url ☹️.`);
    });
    if (!url || !command.input.Key) {
      throw new S3Exception(undefined, 'Failed to Create Presigned URL');
    }
    return url;
  };

  getFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    SubKey,
  }: {
    Bucket?: string;
    SubKey: string;
  }): Promise<GetObjectOutput> => {
    const command = new GetObjectCommand({
      Bucket,
      Key: this._keyService.generateS3KeyFromSubKey(SubKey),
    });

    return this._s3ClientObject.send(command).catch((error) => {
      throw new S3Exception(error, `Failed to fetch this asset ☹️.`);
    });
  };

  deleteFile = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    SubKey,
  }: {
    Bucket?: string;
    SubKey: string;
  }): Promise<DeleteObjectCommandOutput> => {
    const command = new DeleteObjectCommand({
      Bucket,
      Key: this._keyService.generateS3KeyFromSubKey(SubKey),
    });

    return this._s3ClientObject.send(command).catch((error) => {
      throw new S3Exception(error, `Failed to delete this asset ☹️.`);
    });
  };

  deleteFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    Keys,
    SubKeys,
    Quiet,
  }: {
    Bucket?: string | undefined;
    Keys?: string[];
    SubKeys?: string[];
    Quiet?: boolean | undefined;
  }): Promise<DeleteObjectsCommandOutput> => {
    // Objects = [{Key:""},{Key:""}]
    if (!Keys && !SubKeys) {
      throw new S3Exception(undefined, 'No keys provided for deletion ☹️.');
    }
    const Objects = Keys
      ? Keys!.map<{ Key: string }>((Key) => {
          return { Key };
        })
      : SubKeys!.map<{ Key: string }>((SubKey) => {
          return { Key: this._keyService.generateS3KeyFromSubKey(SubKey) };
        });

    const command = new DeleteObjectsCommand({
      Bucket,
      Delete: {
        Objects,
        Quiet,
      },
    });

    return this._s3ClientObject.send(command).catch((error) => {
      throw new S3Exception(error, `Failed to delete these assets ☹️.`);
    });
  };

  listDirectoryFiles = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    FolderPath,
  }: {
    FolderPath: string;
    Bucket?: string | undefined;
  }): Promise<ListObjectsV2CommandOutput> => {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: this._keyService.generateS3KeyFromSubKey(FolderPath),
    });

    const result = await this._s3ClientObject.send(command).catch((error) => {
      throw new S3Exception(
        error,
        `Failed to list files in this directory ☹️.`,
      );
    });
    if (!result.Contents || result.Contents.length === 0) {
      throw new S3Exception(undefined, 'No files found in this directory ☹️');
    }
    return result;
  };

  deleteFolderByPrefix = async ({
    Bucket = process.env.AWS_BUCKET_NAME,
    FolderPath,
    Quiet,
  }: {
    Bucket?: string;
    FolderPath: string;
    Quiet?: boolean;
  }): Promise<DeleteObjectsCommandOutput> => {
    // List all objects with the given prefix
    const listedObjects = await this.listDirectoryFiles({
      Bucket,
      FolderPath,
    });

    const Keys = listedObjects.Contents!.map((item) => item.Key!);

    return this.deleteFiles({ Bucket, Keys, Quiet });
  };
}

export default S3Service;
