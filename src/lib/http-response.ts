import { APIGatewayProxyResult } from 'aws-lambda';

const apiGatewayHttpResponse = (statusCode: number, body: object, allowCors: boolean = false): APIGatewayProxyResult => {
    const response: APIGatewayProxyResult = {
        statusCode,
        body: JSON.stringify(body)
    }
    if (allowCors) {
        response.headers = {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json"
        }
    }
    return response;
}

export const ok = (responseBody: object, allowCors: boolean = false): APIGatewayProxyResult => {
    return apiGatewayHttpResponse(200, responseBody, allowCors);
}

export const resourceNotFound = (responseBody: object, allowCors: boolean = false): APIGatewayProxyResult => {
    return apiGatewayHttpResponse(404, responseBody, allowCors);
}

export const badRequest = (responseBody: object): APIGatewayProxyResult => {
    return apiGatewayHttpResponse(400, responseBody);
}

export const internalServerError = (responseBody: object): APIGatewayProxyResult => {
    return apiGatewayHttpResponse(500, responseBody);
}

export const unauthorized = (responseBody: object): APIGatewayProxyResult => {
    return apiGatewayHttpResponse(401, responseBody);
}

export const forbidden = (responseBody: object): APIGatewayProxyResult => {
    return apiGatewayHttpResponse(403, responseBody);
}
