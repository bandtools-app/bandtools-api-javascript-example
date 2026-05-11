import { AccountResource } from "./resources/account.js";
import { AutomaticNewslettersResource } from "./resources/automaticNewsletters.js";
import { NewslettersResource } from "./resources/newsletters.js";
import { SubscribersResource } from "./resources/subscribers.js";
import { WebhooksResource } from "./resources/webhooks.js";
import { Transport } from "./transport.js";

/**
 * Client for the BandTools REST API.
 */
export class BandToolsClient {
  static DEFAULT_BASE_URL = "https://bandtools.app/api/v1";

  constructor(
    apiToken,
    {
      baseUrl = BandToolsClient.DEFAULT_BASE_URL,
      timeout = 30_000,
      fetchImpl = globalThis.fetch,
    } = {},
  ) {
    this.transport = new Transport(apiToken, { baseUrl, timeout, fetchImpl });
    this.subscribers = new SubscribersResource(this.transport);
    this.account = new AccountResource(this.transport);
    this.newsletters = new NewslettersResource(this.transport);
    this.automaticNewsletters = new AutomaticNewslettersResource(this.transport);
    this.webhooks = new WebhooksResource(this.transport);
  }

  /**
   * Create a client from BANDTOOLS_API_TOKEN and optional BANDTOOLS_API_URL.
   */
  static fromEnvironment(options = {}) {
    return new BandToolsClient(process.env.BANDTOOLS_API_TOKEN, {
      ...options,
      baseUrl:
        options.baseUrl ?? process.env.BANDTOOLS_API_URL ?? BandToolsClient.DEFAULT_BASE_URL,
    });
  }
}
