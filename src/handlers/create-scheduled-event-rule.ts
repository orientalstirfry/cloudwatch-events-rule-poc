import { APIGatewayProxyHandler } from 'aws-lambda';
import { CloudWatchEvents, Lambda } from 'aws-sdk';
import logger from '../lib/logger';
import * as httpResponse from '../lib/http-response';

export const handle: APIGatewayProxyHandler = async (_event, _context) => {
  logger.info(`Received Create Cloudwatch Event Scheduled Creation request`);

  try {
    const instanceId = 543;
    const ruleName = `rsc-scheduled-sync-for-tenant-${instanceId}`;
    const cloudwatchEvents = new CloudWatchEvents();

    // Create CloudWatch Event Rule with associated Target
    const ruleResponse = await createRule(cloudwatchEvents, {
      Name: ruleName,
      Description: `1 minute rule to trigger LinkedIn RSC Job Sync for instance ${instanceId}`,
      ScheduleExpression: 'rate(1 minute)',
      State: 'ENABLED',
    });

    const scheduledEventData = `{ "instanceId" : ${instanceId} }`;
    const ruleTarget = await createTarget(cloudwatchEvents, {
      Rule: ruleName,
      Targets: [
        {
          Arn: process.env.SCHEDULED_EVENTS_HANDLER_FUNCTION_ARN,
          Id: `${ruleName}-target`,
          Input: scheduledEventData
        }
      ]
    });

    // Trigger initial run of scheduled event
    const lambda = new Lambda();
    lambda.invoke({
      FunctionName: process.env.SCHEDULED_EVENTS_HANDLER_FUNCTION_NAME,
      InvocationType: 'Event',
      Payload: scheduledEventData
  },function(_err,_data){});


    return httpResponse.ok({ data: 'Cloudwatch Events Rule create successfully'}, true);
  } catch (error) {
    logger.error(error);
    return httpResponse.internalServerError(error);
  }
}

const createRule = async (cloudwatchEvents:CloudWatchEvents, params:CloudWatchEvents.PutRuleRequest):Promise<CloudWatchEvents.PutRuleResponse> => {
  return new Promise((resolve, reject) => {
    cloudwatchEvents.putRule(params, (err, data) => {
      if (err) reject(err); // an error occurred
      else resolve(data);  // successful response
    });
  });
};

const createTarget = async (cloudwatchEvents:CloudWatchEvents, params:CloudWatchEvents.PutTargetsRequest):Promise<CloudWatchEvents.PutTargetsResponse> => {
  return new Promise((resolve, reject) => {
    cloudwatchEvents.putTargets(params, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    })
  });
};
