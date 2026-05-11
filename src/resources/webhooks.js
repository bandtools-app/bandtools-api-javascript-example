/**
 * Operations for BandTools webhook subscriptions.
 */
export class WebhooksResource {
  constructor(transport) {
    this.transport = transport;
  }

  list() {
    return this.transport.requestJson("GET", "/webhooks");
  }

  create(data) {
    return this.transport.requestJson("POST", "/webhooks", { jsonBody: data });
  }

  get(webhookId) {
    return this.transport.requestJson("GET", `/webhooks/${webhookId}`);
  }

  update(webhookId, data) {
    return this.transport.requestJson("PATCH", `/webhooks/${webhookId}`, { jsonBody: data });
  }

  delete(webhookId) {
    return this.transport.requestNone("DELETE", `/webhooks/${webhookId}`);
  }

  rotateSigningSecret(webhookId) {
    return this.transport.requestJson("POST", `/webhooks/${webhookId}/rotate-signing-secret`);
  }
}
