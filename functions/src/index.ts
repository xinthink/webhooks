import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as request from 'request';
import * as crypto from 'crypto';
// import { inspect } from 'util';

import { BOT } from './local';

admin.initializeApp();

/**
 * Telegram notification webhook for Travis-CI
 */
export const travisTelegram = functions
  // .region('asia-east2', 'asia-northeast1')
  .https.onRequest(onTravisResult);

/** Handle Travis-CI result */
function onTravisResult(req: functions.https.Request, res: functions.Response) {
  verifyWebhookRequest(req)
    .then(sendTravisResultToTelegram)
    .then(() => res.send({}))
    .catch((e) => {
      console.error('notify to telegram failed', e);
      res.sendStatus(500)
    })
}

/**
 * Verifying Travis-CI webhook requests.
 * {@link https://docs.travis-ci.com/user/notifications/#verifying-webhook-requests | Verifying Webhook requests}
 */
function verifyWebhookRequest(req: functions.https.Request): Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      _verifyWebhookRequest(req, resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Implements the signature verification procedure.
 * @param req the request to be verified
 * @param resolve callback to resolve the promise
 * @param reject callback to reject the promise
 */
function _verifyWebhookRequest(
  req: functions.https.Request,
  resolve: (value?: any) => void,
  reject: (reason?: any) => void,
) {
  const payload = req.body.payload;
  const travisSignature = Buffer.from(req.header('Signature') || '', 'base64');
  request.get('https://api.travis-ci.org/config', (e: any, res: request.Response, body: any) => {
    if (e || !res || res.statusCode >= 400) {
      const statusCode = (res || {}).statusCode;
      reject(new Error(`Failed to verify Webhook request: [${statusCode}] ${e}: ${body}`));
    } else {
      const travisPublicKey = JSON.parse(body).config.notifications.webhook.public_key;
      const verifier = crypto.createVerify('sha1');
      verifier.update(payload);
      if (verifier.verify(travisPublicKey, travisSignature)) {
        resolve(payload);
      } else {
        reject(new Error('Invalid Webhook request'));
      }
    }
  });
}

/**
 * Broadcast Travis-CI result using a Telegram Bot, to a configured target.
 * @param data result of the build
 */
function sendTravisResultToTelegram(payload: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // console.log(`--- handling payload: ${inspect(payload)}`);
      _sendTravisResultToTelegram(payload, resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Implementation of Travis-CI result handler.
 * @param payloadJson CI result payload as a JSON string
 * @param resolve callback to resolve the promise
 * @param reject callback to reject the promise
 */
function _sendTravisResultToTelegram(
  payloadJson: any,
  resolve: (value?: any) => void,
  reject: (reason?: any) => void,
) {
  const payload = JSON.parse(payloadJson);
  const {
    number, build_url, status, status_message, duration,
    repository, commit, branch, message, author_name,
  } = payload;
  const icon = status === 0 ? '✅' : '🔴';
  const text = `${icon} [${repository.name} Build#${number}](${build_url}) *${status_message}* in ${duration}s.

    \`${branch}\` \`${commit.substr(0, 7)}\` by *${author_name}*

    _${message}_`;
  request.post(`${BOT.apiPrefix}/sendMessage`, {
    body: {
      text,
      chat_id: BOT.chatId,
      parse_mode: 'Markdown',
    },
    json: true,
  }, (e: any, res: request.Response, body: any) => {
    if (e || !res || res.statusCode >= 400) {
      const statusCode = (res || {}).statusCode;
      reject(new Error(`Failed to send message: [${statusCode}] ${e}: ${body}`));
    } else {
      resolve();
    }
  });
}
