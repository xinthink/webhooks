# [Firebase cloud functions] as Webhooks

[![Build Status][ci-badge]][ci]
[![MIT][license-badge]][license]

## Broadcast [Travis CI] results to a [Telegram] Channel

First, get your own [Telegram Bot] token.

Create file *functions/src/local.ts*, with content:
  ```
  export const BOT = {
    token: '<telegram-bot-token>',
    apiPrefix: 'https://api.telegram.org/bot<telegram-bot-token>',
    chatId: '<telegram-chat-id>',
  };
  ```

The `chatId` can be a Telegram Channel or a Group, you can find it easily through [Telegram Web].

  - **Channel**: find this in the browser address bar: `im?p=c<channel-id>_xxx`, `chatId` for this channel will be `-100<channel-id>`
  - Likewise, for **Group** `im?p=g<group-id>`, the `chatId` will be `-<group-id>`

Finally, don't forget to add your bot to the Channel or Group!

## Deployment

- Run `firebase init`
- or create *.firebaserc* manually
  ```
  {
    "projects": {
      "default": "<firebase-project-id>"
    }
  }
  ```
- run `(cd functions && yarn deploy)`

[Firebase Cloud Functions]: https://firebase.google.com/docs/functions
[Telegram]: https://telegram.org/
[Telegram Bot]: https://core.telegram.org/bots
[Telegram Web]: https://web.telegram.org
[license-badge]: https://img.shields.io/dub/l/vibe-d.svg
[license]: https://raw.githubusercontent.com/xinthink/webhooks/master/LICENSE
[ci-badge]: https://travis-ci.org/xinthink/webhooks.svg?branch=master
[ci]: https://travis-ci.org/xinthink/webhooks
[Travis CI]: https://travis-ci.org/
