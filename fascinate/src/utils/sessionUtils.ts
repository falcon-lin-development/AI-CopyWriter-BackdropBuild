import { v4 as uuidv4 } from 'uuid';
import { UAParser } from 'ua-parser-js';

export async function generateSessionId(req: any): Promise<string> {
  const parser = new UAParser(req.headers['user-agent']);
  const browserInfo = parser.getResult();

  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const timestamp = new Date().toISOString();

  const sessionData = {
    id: uuidv4(),
    timestamp,
    ip,
    browser: browserInfo.browser.name,
    browserVersion: browserInfo.browser.version,
    os: browserInfo.os.name,
    osVersion: browserInfo.os.version,
    device: browserInfo.device.type || 'desktop',
  };

  return Buffer.from(JSON.stringify(sessionData)).toString('base64');
}