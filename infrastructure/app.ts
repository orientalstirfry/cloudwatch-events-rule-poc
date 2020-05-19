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
    new PocStack(this, "cloudwatch-rule-creation-poc-stack", { env });    
  }
}

class PocStack extends Stack {
  constructor(app: App, id: string, props?:StackProps) {
    super(app, id, props);

    const eventsRole = new Role(this, `LinkedInRSC_JobSync_Role`, {
      assumedBy: new ServicePrincipal('events.amazonaws.com'),
      roleName: 'LinkedInRscCloudwatchEventsPocRole',
    });

    const cloudwatchEventsPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:events:${this.region}:*:*`],
      actions: [
          "events:PutRule",
          "events:DeleteRule",
          "events:EnableRule",
          "events:DisableRule",
          "events:PutTargets",
      ]
    });
    const cloudwatchLogsPolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:logs:${this.region}:*:*`],
      actions: [
          "logs:CreateLogStream",
          "logs:CreateLogGroup",
          "logs:PutLogEvents"
      ]
    });    
    const passRolePolicy = new PolicyStatement({
      effect: Effect.ALLOW,
      resources: [`arn:aws:iam::*:role/*`],
      actions: [
        "iam:PassRole"
      ]
    })
    eventsRole.addToPolicy(cloudwatchEventsPolicy);
    eventsRole.addToPolicy(cloudwatchLogsPolicy);
    eventsRole.addToPolicy(passRolePolicy);

    const scheduledEventHandler = new Function(this, 'scheduled-events-handler', {
      functionName: 'scheduled-events-handler',
      code: new AssetCode('dist'),
      handler: 'scheduled-event.handle',
      runtime: Runtime.NODEJS_12_X,
    });
    scheduledEventHandler.addToRolePolicy(cloudwatchEventsPolicy);

    const api = new RestApi(this, 'linkedin-rsc-cloudwatch-rule-poc', {
      restApiName: 'LinkedIn RSC Cloudwatch Rule POC'
    });

    new HttpLambda(this, 'create-schedule-rule', {
      addCors: true,
      api,
      endpoint: 'create-schedule-rule',
      functionName: 'create-schedule-rule',
      handlerName: 'create-event-schedule.handle',
      httpMethod: 'POST',
      policies: [cloudwatchEventsPolicy, cloudwatchLogsPolicy, passRolePolicy],
      environment: {
        SCHEDULED_EVENT_HANDLER_FUNCTION_ARN: scheduledEventHandler.functionArn,
        EVENTS_ROLE_ARN: eventsRole.roleArn
      }
    });
  }
}

const app = new Infrastructure(); 