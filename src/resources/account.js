const PAGE_SLUGS = new Set(["archive", "subscribe", "confirmation", "unsubscribe"]);

/**
 * Operations for account profile, settings, page design, and themes.
 */
export class AccountResource {
  constructor(transport) {
    this.transport = transport;
  }

  get() {
    return this.transport.requestJson("GET", "/account");
  }

  update(data) {
    return this.transport.requestJson("PATCH", "/account", { jsonBody: data });
  }

  downloadPicture() {
    return this.transport.requestBytes("GET", "/account/picture");
  }

  uploadPicture(filePath) {
    return this.transport.requestJson("PUT", "/account/picture", {
      fileUpload: { filePath },
    });
  }

  deletePicture() {
    return this.transport.requestNone("DELETE", "/account/picture");
  }

  getSettings() {
    return this.transport.requestJson("GET", "/account/settings");
  }

  updateSettings(data) {
    return this.transport.requestJson("PATCH", "/account/settings", { jsonBody: data });
  }

  getNewsletterSettings() {
    return this.transport.requestJson("GET", "/account/newsletter-settings");
  }

  updateNewsletterSettings(data) {
    return this.transport.requestJson("PATCH", "/account/newsletter-settings", {
      jsonBody: data,
    });
  }

  listThemes() {
    return this.transport.requestJson("GET", "/account/themes");
  }

  createTheme(data) {
    return this.transport.requestJson("POST", "/account/themes", { jsonBody: data });
  }

  getTheme(themeId) {
    return this.transport.requestJson("GET", `/account/themes/${themeId}`);
  }

  updateTheme(themeId, data) {
    return this.transport.requestJson("PATCH", `/account/themes/${themeId}`, {
      jsonBody: data,
    });
  }

  deleteTheme(themeId) {
    return this.transport.requestNone("DELETE", `/account/themes/${themeId}`);
  }

  getPageDesign(page) {
    return this.transport.requestJson("GET", `/account/${pageSlug(page)}-page`);
  }

  updatePageDesign(page, data) {
    return this.transport.requestJson("PATCH", `/account/${pageSlug(page)}-page`, {
      jsonBody: data,
    });
  }

  uploadPageBackgroundImage(page, filePath) {
    return this.transport.requestNone("PUT", `/account/${pageSlug(page)}-page/background-image`, {
      fileUpload: { filePath },
    });
  }

  deletePageBackgroundImage(page) {
    return this.transport.requestNone(
      "DELETE",
      `/account/${pageSlug(page)}-page/background-image`,
    );
  }

  getConfirmationEmail() {
    return this.transport.requestJson("GET", "/account/confirmation-email");
  }

  updateConfirmationEmail(data) {
    return this.transport.requestJson("PATCH", "/account/confirmation-email", {
      jsonBody: data,
    });
  }
}

function pageSlug(page) {
  if (!PAGE_SLUGS.has(page)) {
    throw new TypeError("page must be one of: archive, confirmation, subscribe, unsubscribe");
  }
  return page;
}
