/**
 * Operations for RSS or Atom powered automatic newsletters.
 */
export class AutomaticNewslettersResource {
  constructor(transport) {
    this.transport = transport;
  }

  list() {
    return this.transport.requestJson("GET", "/automatic-newsletters");
  }

  create(data) {
    return this.transport.requestJson("POST", "/automatic-newsletters", { jsonBody: data });
  }

  get(automaticNewsletterId) {
    return this.transport.requestJson("GET", `/automatic-newsletters/${automaticNewsletterId}`);
  }

  update(automaticNewsletterId, data) {
    return this.transport.requestJson("PATCH", `/automatic-newsletters/${automaticNewsletterId}`, {
      jsonBody: data,
    });
  }

  delete(automaticNewsletterId) {
    return this.transport.requestNone("DELETE", `/automatic-newsletters/${automaticNewsletterId}`);
  }

  pause(automaticNewsletterId) {
    return this.transport.requestJson("POST", `/automatic-newsletters/${automaticNewsletterId}/pause`);
  }

  resume(automaticNewsletterId) {
    return this.transport.requestJson("POST", `/automatic-newsletters/${automaticNewsletterId}/resume`);
  }

  validateFeed(feedUrl) {
    return this.transport.requestJson("POST", "/automatic-newsletters/validate", {
      jsonBody: { feed_url: feedUrl },
    });
  }
}
