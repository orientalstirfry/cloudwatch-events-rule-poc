import { addCorsOptions } from "./util";
import { Construct } from "@aws-cdk/core";
import { PolicyStatement } from "@aws-cdk/aws-iam";
import { RestApi, LambdaIntegration, AuthorizationType, IAuthorizer, CfnAuthorizer } from '@aws-cdk/aws-apigateway';
import { Function, AssetCode, Runtime } from "@aws-cdk/aws-lambda";

export interface HttpLambdaProps {
    api: RestApi;
    endpoint: string;
    httpMethod: string;
    handlerName: string;
    functionName: string;
    addCors: boolean;
    policies?: PolicyStatement[];
    environment?: Record<string, string>;
    authorizer?: CfnAuthorizer
}

export class HttpLambda extends Construct {
    public readonly LambdaFunc: Function;

    constructor(
        scope: Construct,
        id: string,
        props: HttpLambdaProps
    ) {
        super(scope, id);

        const { authorizer,api, functionName, endpoint, httpMethod, handlerName, addCors, policies, environment } = props;
        this.LambdaFunc = new Function(this, id, {
            functionName,
            code: new AssetCode('dist'),
            handler: handlerName,
            runtime: Runtime.NODEJS_10_X,
            environment
        });

        const provisionEndpoint = api.root.addResource(endpoint);
        const provisionIntegration = new LambdaIntegration(this.LambdaFunc);

        if(authorizer){
            provisionEndpoint.addMethod(httpMethod, provisionIntegration,{
                authorizationType: AuthorizationType.CUSTOM,
                authorizer: {authorizerId: authorizer.ref}
            });
        }else{
            provisionEndpoint.addMethod(httpMethod, provisionIntegration);
        }

        if(addCors) addCorsOptions(provisionEndpoint);
        if(policies) policies.forEach(policy => this.LambdaFunc.addToRolePolicy(policy));
    }

}
