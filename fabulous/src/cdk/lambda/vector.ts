import { SQSEvent, Context } from 'aws-lambda';

exports.handler = async (event: SQSEvent, context: Context) => {
  console.log('Vector event:', event);
  // Your vector processing logic here
  return { statusCode: 200, body: 'Vector data processed' };
};
