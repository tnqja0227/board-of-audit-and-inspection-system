import {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { config } from 'dotenv';
import logger from '../config/winston';

config();

const client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
    region: process.env.AWS_REGION as string,
});

export async function uploadFileToS3(file: Express.Multer.File, key: string) {
    logger.info(`Uploading file ${file.originalname} to S3`);

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_STORAGE_BUCKET_NAME as string,
        Key: key,
        Body: file.buffer,
    });

    try {
        const res = await client.send(command);
        return {
            statusCode: res.$metadata.httpStatusCode,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}

export async function deleteFileFromS3(key: string) {
    logger.info(`Deleting file (${key}) from S3`);

    const command = new DeleteObjectCommand({
        Bucket: process.env.AWS_STORAGE_BUCKET_NAME as string,
        Key: key,
    });

    try {
        const res = await client.send(command);
        return {
            statusCode: res.$metadata.httpStatusCode,
        };
    } catch (error) {
        logger.error(error);
        throw error;
    }
}
