import { APIGatewayProxyHandler } from 'aws-lambda';
import { CloudWatchEvents } from 'aws-sdk';
import logger from '../lib/logger';
import * as httpResponse from '../lib/http-response';

export const handle: APIGatewayProxyHandler = async (_event, _context) => {
  logger.info(`Received Create Cloudwatch Event Scheduled Creation request`);

  try {
    const instanceId = 543;
    const ruleName = `LinkedIn_RSC_JobSync_${instanceId}`;
    const cloudwatchEvents = new CloudWatchEvents();

    const ruleResponse = await createRule(cloudwatchEvents, {
      Name: ruleName,
      Description: `5 minute rule to trigger LinkedIn RSC Job Sync for instance ${instanceId}`,
      ScheduleExpression: 'rate(5 minutes)',
      State: 'ENABLED',
      RoleArn: process.env.EVENTS_ROLE_ARN
    });

    const ruleTarget = await createTarget(cloudwatchEvents, {
      Rule: ruleName,
      Targets: [
        {
          Arn: process.env.SCHEDULED_EVENT_HANDLER_FUNCTION_ARN,
          Id: `${ruleName}_Target`,
          Input: `{ "instanceId" : ${instanceId} }`
        }
      ]
    });

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
