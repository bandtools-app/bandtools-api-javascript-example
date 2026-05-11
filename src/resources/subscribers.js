/**
 * Operations for newsletter subscribers and subscriber imports.
 */
export class SubscribersResource {
  constructor(transport) {
    this.transport = transport;
  }

  list({ page, perPage, sort, filter } = {}) {
    return this.transport.requestJson("GET", "/subscribers", {
      query: { page, per_page: perPage, sort, filter },
    });
  }

  add(emailAddress) {
    return this.transport.requestJson("POST", "/subscribers", {
      jsonBody: { email_address: emailAddress },
    });
  }

  deleteAll() {
    return this.transport.requestJson("DELETE", "/subscribers", {
      query: { confirm: "true" },
    });
  }

  get(subscriberId) {
    return this.transport.requestJson("GET", `/subscribers/${subscriberId}`);
  }

  delete(subscriberId) {
    return this.transport.requestNone("DELETE", `/subscribers/${subscriberId}`);
  }

  importEmails(emailAddresses) {
    return this.transport.requestJson("POST", "/subscribers/imports", {
      jsonBody: { email_addresses: emailAddresses },
    });
  }

  importCsv(filePath) {
    return this.transport.requestJson("POST", "/subscribers/imports", {
      fileUpload: { filePath, contentType: "text/csv" },
    });
  }

  getImport(importId) {
    return this.transport.requestJson("GET", `/subscribers/imports/${importId}`);
  }
}
