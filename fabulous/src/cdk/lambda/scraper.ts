import { SQSEvent, Context } from 'aws-lambda';

exports.handler = async (event: SQSEvent, context: Context) => {
  console.log('Scraper event:', event);
  // Your scraper logic here
  return { statusCode: 200, body: 'Scraped data processed' };
};
