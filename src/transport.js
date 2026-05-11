import { readFile } from "node:fs/promises";
import { basename } from "node:path";

import { BandToolsApiError, BandToolsConnectionError } from "./errors.js";

const USER_AGENT = "bandtools-api-javascript-example/0.1.0";

const CONTENT_TYPES = new Map([
  [".csv", "text/csv"],
  [".gif", "image/gif"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
]);

/**
 * Shared HTTP transport for BandTools resource clients.
 */
export class Transport {
  constructor(apiToken, { baseUrl, timeout = 30_000, fetchImpl = globalThis.fetch } = {}) {
    if (!apiToken) {
      throw new TypeError("apiToken is required");
    }
    if (typeof fetchImpl !== "function") {
      throw new TypeError("fetchImpl must be a function");
    }

    this.apiToken = apiToken;
    this.baseUrl = (baseUrl ?? "https://bandtools.app/api/v1").replace(/\/+$/, "");
    this.timeout = timeout;
    this.fetchImpl = fetchImpl;
  }

  async requestJson(method, path, options = {}) {
    const response = await this.#request(method, path, options);
    if (response === null || response instanceof ArrayBuffer) {
      throw new BandToolsApiError(0, "Expected a JSON object response");
    }
    return response;
  }

  async requestBytes(method, path, options = {}) {
    const response = await this.#request(method, path, { ...options, expectBytes: true });
    if (!(response instanceof ArrayBuffer)) {
      throw new BandToolsApiError(0, "Expected a binary response");
    }
    return new Uint8Array(response);
  }

  async requestNone(method, path, options = {}) {
    await this.#request(method, path, options);
  }

  async #request(method, path, { query, jsonBody, fileUpload, expectBytes = false } = {}) {
    const url = this.#url(path, query);
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${this.apiToken}`,
      "User-Agent": USER_AGENT,
    };
    const init = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (jsonBody !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(jsonBody);
    } else if (fileUpload !== undefined) {
      init.body = await this.#formData(fileUpload);
    }

    let response;
    try {
      response = await this.fetchImpl(url, init);
    } catch (error) {
      throw new BandToolsConnectionError(error.message, error);
    }

    if (!response.ok) {
      await this.#raiseApiError(response);
    }

    if (response.status === 204) {
      return null;
    }

    if (expectBytes) {
      return response.arrayBuffer();
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      return text ? { data: text } : null;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  #url(path, query) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  async #formData({ fieldName = "file", filePath, contentType }) {
    const filename = basename(filePath);
    const bytes = await readFile(filePath);
    const blob = new Blob([bytes], {
      type: contentType ?? contentTypeForFilename(filename),
    });
    const form = new FormData();
    form.append(fieldName, blob, filename);
    return form;
  }

  async #raiseApiError(response) {
    let parsed = null;
    let message = response.statusText || "Request failed";
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      parsed = await response.json();
      if (typeof parsed?.error?.message === "string") {
        message = parsed.error.message;
      } else if (typeof parsed?.error?.detail === "string") {
        message = parsed.error.detail;
      } else if (typeof parsed?.message === "string") {
        message = parsed.message;
      }
    } else {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new BandToolsApiError(response.status, message, parsed);
  }
}

function contentTypeForFilename(filename) {
  const index = filename.lastIndexOf(".");
  if (index === -1) {
    return "application/octet-stream";
  }
  return CONTENT_TYPES.get(filename.slice(index).toLowerCase()) ?? "application/octet-stream";
}
