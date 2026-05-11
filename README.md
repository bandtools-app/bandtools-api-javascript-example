# BandTools API JavaScript Example

This repository contains example JavaScript code for authenticating with and using the BandTools REST API.
It is intended as a practical starting point for developers who want to build their own integrations with BandTools.
This is example code rather than an official SDK. The [BandTools API reference](https://bandtools.app/api/v1) remains the source of truth for supported endpoints, request formats, and response formats.

## Requirements

Use Node.js 20 or newer. The client uses built-in `fetch`, `FormData`, and `Blob`.

```bash
npm install
```

## Usage

Create a client with a BandTools API token. `BandToolsClient.fromEnvironment()` reads the required token from `BANDTOOLS_API_TOKEN`. Set `BANDTOOLS_API_URL` only when you need to point the example client at a non-production API endpoint; otherwise it falls back to the production API URL.

```bash
export BANDTOOLS_API_TOKEN="your-api-token"
# Optional:
export BANDTOOLS_API_URL="https://bandtools.app/api/v1"
```

```js
import { BandToolsClient } from "./src/index.js";

const client = BandToolsClient.fromEnvironment();
```

The client is organised by resource area:

```js
client.subscribers;
client.account;
client.newsletters;
client.automaticNewsletters;
client.webhooks;
```

### Subscribers

List, create, fetch, delete, and import subscribers.

```js
const subscribers = await client.subscribers.list({
  perPage: 25,
  sort: "subscribed_recent",
  filter: "confirmed",
});
console.log(subscribers);

const subscriber = await client.subscribers.add("fan@example.com");
const subscriberId = subscriber.data.id;

const sameSubscriber = await client.subscribers.get(subscriberId);
console.log(sameSubscriber);

await client.subscribers.delete(subscriberId);
```

Bulk imports can be sent as JSON or uploaded from a CSV file:

```js
const importJob = await client.subscribers.importEmails([
  "first@example.com",
  "second@example.com",
]);

const csvImportJob = await client.subscribers.importCsv("subscribers.csv");

const status = await client.subscribers.getImport(importJob.data.id);
console.log(status, csvImportJob);
```

### Account Settings

Read and update account, app, newsletter, theme, page design, and confirmation email settings.

```js
const account = await client.account.get();
console.log(account);

await client.account.update({
  account: {
    name: "Example Band",
    website_url: "https://example.com",
  },
});

await client.account.updateNewsletterSettings({
  newsletter_settings: {
    newsletter_name: "Example Band Updates",
    newsletter_description: "News, tour dates, and releases.",
  },
});

const theme = await client.account.createTheme({
  theme: {
    name: "High contrast",
    body_background_colour: "#ffffff",
    body_text_colour: "#111111",
    link_colour: "#005fcc",
  },
});

await client.account.updatePageDesign("subscribe", {
  subscribe_page: {
    page_theme_id: theme.data.id,
    content: "<p>Join the mailing list.</p>",
  },
});
```

### Newsletters

Request bodies are objects that mirror the BandTools API reference.

```js
const draft = await client.newsletters.create({
  subject: "Spring tour dates",
  message: "<p>Tickets are on sale now.</p>",
});

await client.newsletters.sendPreview(draft.data.id);
```

Newsletter drafts can be updated, duplicated, scheduled, sent, archived, pinned, and deleted.

```js
const newsletterId = draft.data.id;

await client.newsletters.update(newsletterId, {
  subject: "Spring tour dates announced",
  message: "<p>New shows have been added.</p>",
});

const copy = await client.newsletters.duplicate(newsletterId);
const copyId = copy.data.id;

await client.newsletters.schedule(newsletterId, "2026-06-01T10:00:00Z");
await client.newsletters.cancelSchedule(newsletterId);

await client.newsletters.send(newsletterId);

await client.newsletters.addToArchive(newsletterId);
await client.newsletters.pin(newsletterId);
await client.newsletters.unpin(newsletterId);
await client.newsletters.removeFromArchive(newsletterId);

await client.newsletters.delete(copyId);
```

A previously sent newsletter can also be sent only to subscribers who joined after the original send.

```js
const result = await client.newsletters.sendToNewSubscribers(newsletterId);
console.log(result.data.new_subscribers_count);
```

Collaborator and lock helpers are available for shared editing workflows:

```js
await client.newsletters.inviteCollaborator(newsletterId, "collaborator@example.com");
const collaborators = await client.newsletters.listCollaborators(newsletterId);

const lock = await client.newsletters.acquireLock(newsletterId);
await client.newsletters.refreshLock(newsletterId);
await client.newsletters.releaseLock(newsletterId);

console.log(collaborators, lock);
```

### Uploads

Uploads accept filesystem paths.

```js
const attachment = await client.newsletters.uploadAttachment("poster.jpg");
console.log(attachment);

await client.account.uploadPicture("profile.png");
await client.account.uploadPageBackgroundImage("subscribe", "background.jpg");
```

### Automatic Newsletters

Automatic newsletters can be created from feed URLs, paused, resumed, and validated.

```js
const validation = await client.automaticNewsletters.validateFeed("https://example.com/feed.xml");
console.log(validation);

const automatic = await client.automaticNewsletters.create({
  automatic_newsletter: {
    name: "Blog updates",
    feed_url: "https://example.com/feed.xml",
    behaviour: "draft",
    frequency: "daily",
  },
});

const automaticId = automatic.data.id;
await client.automaticNewsletters.pause(automaticId);
await client.automaticNewsletters.resume(automaticId);
```

### Webhooks

Use webhooks to receive BandTools events in your own application.

```js
const webhook = await client.webhooks.create({
  webhook: {
    name: "Production sync",
    url: "https://example.com/bandtools/webhooks",
    event_types: ["subscriber.created", "newsletter.sent"],
  },
});

const webhookId = webhook.data.id;
await client.webhooks.rotateSigningSecret(webhookId);
await client.webhooks.update(webhookId, { webhook: { enabled: true } });
await client.webhooks.delete(webhookId);
```

### Error Handling

API errors raise `BandToolsApiError`; connection failures raise `BandToolsConnectionError`.

```js
import { BandToolsApiError, BandToolsConnectionError } from "./src/index.js";

try {
  await client.subscribers.get("sub_123");
} catch (error) {
  if (error instanceof BandToolsApiError) {
    console.error(error.statusCode, error.apiMessage);
  } else if (error instanceof BandToolsConnectionError) {
    console.error(`Could not reach BandTools: ${error.message}`);
  } else {
    throw error;
  }
}
```

## Development

Run the test suite and linting locally:

```bash
npm test
npm run lint
```

GitHub Actions runs the unit tests and ESLint on Node.js 20 and 22.

## Copyright

Copyright (c) 2026 BandTools Ltd.

This project is licensed under the MIT license. See [LICENSE](LICENSE).
