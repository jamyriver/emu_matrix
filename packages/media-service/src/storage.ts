import * as Minio from 'minio';

let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
  if (!minioClient) {
    minioClient = new Minio.Client({
      endPoint: (process.env.MINIO_ENDPOINT || 'localhost').split(':')[0],
      port: parseInt((process.env.MINIO_ENDPOINT || 'localhost:9000').split(':')[1] || '9000', 10),
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
    });
  }
  return minioClient;
}

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'emu-matrix';

export async function ensureBucket(): Promise<void> {
  const client = getMinioClient();
  const exists = await client.bucketExists(BUCKET_NAME);
  if (!exists) {
    await client.makeBucket(BUCKET_NAME);
  }
}

export async function uploadObject(objectName: string, data: Buffer, contentType?: string): Promise<string> {
  const client = getMinioClient();
  await client.putObject(BUCKET_NAME, objectName, data, data.length, {
    'Content-Type': contentType || 'application/octet-stream',
  });
  return `/${BUCKET_NAME}/${objectName}`;
}

export async function deleteObject(objectName: string): Promise<void> {
  const client = getMinioClient();
  await client.removeObject(BUCKET_NAME, objectName);
}

export function getObjectUrl(objectName: string): string {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
  const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
  return `${protocol}://${endpoint}/${BUCKET_NAME}/${objectName}`;
}
