import logger from '../lib/logger';

export const handle = (event, _context, callback) => {
  logger.info('Received event:', JSON.stringify(event, null, 2));
  callback(null, 'Finished');
};