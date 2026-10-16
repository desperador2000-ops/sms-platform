import { Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import crypto from 'crypto';

function isValidTwilioSignature(url: string, params: Record<string, any>, authToken: string, signatureHeader?: string) {
  if (!signatureHeader) return false;
  const sortedKeys = Object.keys(params).sort();
  const concatenated = sortedKeys.map((k) => `${k}${params[k]}`).join('');
  const data = url + concatenated;
  const computed = crypto.createHmac('sha1', authToken).update(data).digest('base64');
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signatureHeader));
  } catch (err) {
    return false;
  }
}

@Controller('/api/webhooks/sms')
export class WebhooksController {
  @Post('/TWILIO')
  async twilioWebhook(@Req() req: Request, @Res() res: Response) {
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    if (!authToken) {
      // If no auth token configured, refuse to accept unsigned webhooks in prod
      return res.status(HttpStatus.FORBIDDEN).json({ error: 'Twilio auth token not configured' });
    }

    const signature = req.header('X-Twilio-Signature') ?? undefined;
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    // Parse form/body parameters
    const params = { ...(req.body || {}) } as Record<string, any>;

    if (!isValidTwilioSignature(fullUrl, params, authToken, signature)) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ error: 'Invalid Twilio signature' });
    }

    // Basic idempotence / anti-replay should be applied here: check MessageSid already processed
    // For now accept and return 200
    return res.status(HttpStatus.OK).json({ status: 'ok' });
  }
}
