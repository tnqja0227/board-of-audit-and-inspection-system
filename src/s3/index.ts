import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { config } from 'dotenv';

config();

const client = new S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
    region: 'ap-northeast-2',
});

export async function uploadFile(filename: string, file: Buffer) {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_STORAGE_BUCKET_NAME as string,
        Key: filename,
        Body: file,
    });
    const response = await client.send(command);
    console.log(response);
}
