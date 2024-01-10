import logger from '../config/winston';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Dynamically import 'file-type'
const fileType = () => import('file-type');

export async function uploadFileToS3(filePath: any, key: string) {
    // file: local temp file path. After invoking this function successfully, delete the temp file.
    logger.info('Uploading file to S3...');
    logger.info(filePath);

    // 10MB: AWS API Gateway limit
    // TODO: fileName을 organizationID + timestamp + filename 으로 해서 중복 방지
    if (
        !fs.existsSync(filePath) ||
        fs.statSync(filePath).size > 10 * 1024 * 1024
    ) {
        throw new Error('File does not exist or is larger than 10MB');
    }

    // upload file to s3 and return the url and status code
    const fileContent = fs.readFileSync(filePath);

    const fileTypeModule = await fileType();
    const fileTypeResult = await fileTypeModule.fileTypeFromBuffer(fileContent);

    const allowedFileTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
        'application/pdf',
    ];
    let contentType = 'text/plain';
    if (fileTypeResult && allowedFileTypes.includes(fileTypeResult.mime)) {
        const contentType = fileTypeResult.mime;
    } else {
        const contentType = 'text/plain';
        logger.warn('fileTypeResult is null. Defaulting to text/plain');
    }

    const apiGatewayFullURL = `${process.env.AWS_S3_API_GATEWAY_URL}/${process.env.AWS_S3_BUCKET_NAME}/${key}`;

    try {
        const AWSresponse = await axios.put(apiGatewayFullURL, fileContent, {
            headers: {
                'Content-Type': contentType,
            },
        });

        logger.info('File uploaded to S3');
        logger.info(AWSresponse);
        const ret = {
            uri: `${process.env.AWS_S3_BUCKET_NAME}/${key}`,
            statusCode: AWSresponse.status,
        };
        return ret;
    } catch (error) {
        logger.error('error uploading to s3: ', error);
        throw error; // TODO: Error handling
    }
}

export async function deleteFileFromS3(key: string) {
    logger.info('Deleting file from S3...');
    logger.info(key);

    const apiGatewayFullURL = `${process.env.AWS_S3_API_GATEWAY_URL}/${process.env.AWS_S3_BUCKET_NAME}/${key}`;
    try {
        const response = await axios.delete(apiGatewayFullURL);
        logger.info(response);
        const ret = {
            statusCode: response.status,
        };
        return ret;
    } catch (error) {
        logger.error(error);
        throw error; // TODO: Error handling
    }
}
