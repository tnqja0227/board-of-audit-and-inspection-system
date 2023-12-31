import logger from '../config/winston';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import fileType from 'file-type';

export async function uploadFileToS3(filePath: any) {
    // file: local temp file path. After invoking this function successfully, delete the temp file.
    logger.info('Uploading file to S3...');
    logger.info(filePath);
    logger.info('File uploaded to S3');
    // upload file to s3 and return the url and status code
    const fileContent = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    const fileTypeResult = await fileType.fileTypeFromBuffer(fileContent);

    let contentType = 'text/plain';
    if (fileTypeResult) {
        const contentType = fileTypeResult.mime;
    } else {
        const contentType = 'text/plain';
        logger.warn('fileTypeResult is null. Defaulting to text/plain');
    }

    const apiGatewayFullURL = `${process.env.AWS_S3_API_GATEWAY_URL}/${fileName}`;

    try {
        const response = await axios.put(apiGatewayFullURL, fileContent, {
            headers: {
                'Content-Type': contentType,
            },
        });

        logger.info(response);
        const ret = {
            url: apiGatewayFullURL,
            statusCode: response.status,
        };
        return ret;
    } catch (error) {
        logger.error(error);
        throw error; // TODO: Error handling
    }
}

export async function deleteFileFromS3(url: string) {
    logger.info('Deleting file from S3...');
    logger.info(url);
    logger.info('File deleted from S3');
    // delete file from s3

    try {
        const response = await axios.delete(url);
        logger.info(response);
        const ret = {
            statusCode: response.status,
        };
        return ret;
    } catch (error) {
        logger.error(error);
        throw error; // TODO: Error handling
    }
    return; // return status code
}
