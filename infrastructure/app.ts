import { Function, AssetCode, Runtime } from '@aws-cdk/aws-lambda';
import { RestApi } from '@aws-cdk/aws-apigateway';
import { App, Stack, StackProps } from '@aws-cdk/core';
import { HttpLambda } from './http-lambda';
import { Effect, PolicyStatement, Role, ServicePrincipal } from '@aws-cdk/aws-iam';

class Infrastructure extends App {
  constructor() {
    super();
    const env = {
      account: process.env.AWS_DEFAULT_ACCOUNT,
      region: process.env.AWS_DEFAULT_REGION,
    };
    new PocStack(this, "rsc-cloudwatch-rule-creation-poc-stack", { env });    
  }
}

class PocStack extends Stack {
  constructor(app: App, id: string, props?:StackProps) {
    super(app, id, props);

    // Provision lambda for processing events triggered by a Cloudwatch Rule
    const scheduledEventHandler = new Function(this, 'rsc-scheduled-events-handler', {
      functionName: 'rsc-scheduled-events-handler',
      code: new AssetCode('dist'),
      handler: 'handle-scheduled-event.handle',
      runtime: Runtime.NODEJS_12_X,
    });
    scheduledEventHandler.addPermission('RscCloudWatchEventsPermissionForRscScheduledEventsHandler', {
      principal: new ServicePrincipal('events.amazonaws.com'),
      action: 'lambda:InvokeFunction'
    });

    // Provision lambda (with API Gateway) for creating Cloudwatch Rules
    const cloudwatchEventsPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:events:${this.region}:*:*`],
      actions: [
          "events:PutRule",
          "events:DeleteRule",
          "events:EnableRule",
          "events:DisableRule",
          "events:PutTargets"
      ]
    });
    const passRolePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:iam::*:role/*`],
      actions: [
        "iam:PassRole"
      ]
    })
    const api = new RestApi(this, 'rsc-cloudwatch-events-poc', {
      restApiName: 'RSC Cloudwatch Events POC'
    });

    new HttpLambda(this, 'rsc-create-scheduled-rule', {
      addCors: true,
      api,
      endpoint: 'rsc-create-scheduled-event-rule',
      functionName: 'rsc-create-scheduled-event-rule',
      handlerName: 'create-scheduled-event-rule.handle',
      httpMethod: 'POST',
      policies: [cloudwatchEventsPolicy, passRolePolicy],
      environment: {
        SCHEDULED_EVENTS_HANDLER_FUNCTION_NAME: scheduledEventHandler.functionName,
        SCHEDULED_EVENTS_HANDLER_FUNCTION_ARN: scheduledEventHandler.functionArn
      }
    });
  }
}

const app = new Infrastructure(); 