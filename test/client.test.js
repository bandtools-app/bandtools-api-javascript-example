import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { BandToolsApiError, BandToolsClient, BandToolsConnectionError } from "../src/index.js";

function jsonResponse(body, { status = 200, statusText = "OK" } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    statusText,
    headers: { "content-type": "application/json" },
  });
}

function createFetch(response = jsonResponse({ data: { id: "acct_123" } })) {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, init });
    if (response instanceof Error) {
      throw response;
    }
    return response.clone();
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

test("client can be created from environment with custom API URL", async () => {
  const originalToken = process.env.BANDTOOLS_API_TOKEN;
  const originalUrl = process.env.BANDTOOLS_API_URL;
  process.env.BANDTOOLS_API_TOKEN = "env-token";
  process.env.BANDTOOLS_API_URL = "https://sandbox.example.test/api/v1";
  const fetchImpl = createFetch();

  try {
    const client = BandToolsClient.fromEnvironment({ fetchImpl, timeout: 5_000 });

    await client.account.get();

    assert.equal(fetchImpl.calls[0].url, "https://sandbox.example.test/api/v1/account");
    assert.equal(fetchImpl.calls[0].init.headers.Authorization, "Bearer env-token");
    assert.equal(fetchImpl.calls[0].init.signal.constructor.name, "AbortSignal");
  } finally {
    restoreEnv("BANDTOOLS_API_TOKEN", originalToken);
    restoreEnv("BANDTOOLS_API_URL", originalUrl);
  }
});

test("client from environment falls back to production API URL", async () => {
  const originalToken = process.env.BANDTOOLS_API_TOKEN;
  const originalUrl = process.env.BANDTOOLS_API_URL;
  process.env.BANDTOOLS_API_TOKEN = "env-token";
  delete process.env.BANDTOOLS_API_URL;
  const fetchImpl = createFetch();

  try {
    const client = BandToolsClient.fromEnvironment({ fetchImpl });

    await client.account.get();

    assert.equal(fetchImpl.calls[0].url, "https://bandtools.app/api/v1/account");
  } finally {
    restoreEnv("BANDTOOLS_API_TOKEN", originalToken);
    restoreEnv("BANDTOOLS_API_URL", originalUrl);
  }
});

test("account responses include plan features", async () => {
  const fetchImpl = createFetch(
    jsonResponse({
      data: {
        id: "acct_123",
        features: {
          automatic_newsletters: true,
          duplicate_newsletter: true,
          subscriber_limit: 1000,
          unlimited_newsletters: true,
        },
      },
    }),
  );
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });

  const result = await client.account.get();

  assert.equal(result.data.features.automatic_newsletters, true);
  assert.equal(result.data.features.subscriber_limit, 1000);
  assert.equal(fetchImpl.calls[0].url, "https://example.test/api/v1/account");
});

test("account responses include social profile links", async () => {
  const fetchImpl = createFetch(
    jsonResponse({
      data: {
        id: "acct_123",
        social_links: {
          bandcamp: "https://testuser.bandcamp.com",
          bluesky: "https://bsky.app/profile/testuser.example",
          instagram: "https://instagram.com/testuser",
          soundcloud: "https://soundcloud.com/testuser",
          spotify: "https://open.spotify.com/artist/example",
          tiktok: "https://tiktok.com/@testuser",
          x: "https://x.com/testuser",
          youtube: "https://youtube.com/@testuser",
        },
      },
    }),
  );
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });

  const result = await client.account.get();

  assert.equal(result.data.social_links.bandcamp, "https://testuser.bandcamp.com");
  assert.equal(result.data.social_links.bluesky, "https://bsky.app/profile/testuser.example");
  assert.equal(result.data.social_links.x, "https://x.com/testuser");
});

test("account updates can set and clear social profile links", async () => {
  const fetchImpl = createFetch(jsonResponse({ data: { id: "acct_123" } }));
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });

  await client.account.update({
    account: {
      social_links: {
        bandcamp: "https://testuser.bandcamp.com",
        bluesky: "https://bsky.app/profile/testuser.example",
        facebook: null,
        instagram: "",
        soundcloud: "https://soundcloud.com/testuser",
        spotify: "https://open.spotify.com/artist/example",
        tiktok: "https://tiktok.com/@testuser",
        x: "https://x.com/testuser",
        youtube: "https://youtube.com/@testuser",
      },
    },
  });

  assert.equal(fetchImpl.calls[0].url, "https://example.test/api/v1/account");
  assert.equal(fetchImpl.calls[0].init.method, "PATCH");
  assert.deepEqual(JSON.parse(fetchImpl.calls[0].init.body), {
    account: {
      social_links: {
        bandcamp: "https://testuser.bandcamp.com",
        bluesky: "https://bsky.app/profile/testuser.example",
        facebook: null,
        instagram: "",
        soundcloud: "https://soundcloud.com/testuser",
        spotify: "https://open.spotify.com/artist/example",
        tiktok: "https://tiktok.com/@testuser",
        x: "https://x.com/testuser",
        youtube: "https://youtube.com/@testuser",
      },
    },
  });
});

test("GET requests include auth headers and query params", async () => {
  const fetchImpl = createFetch();
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });

  const result = await client.subscribers.list({ page: 2, perPage: 50, sort: "email_desc" });

  assert.deepEqual(result, { data: { id: "acct_123" } });
  assert.equal(
    fetchImpl.calls[0].url,
    "https://example.test/api/v1/subscribers?page=2&per_page=50&sort=email_desc",
  );
  assert.equal(fetchImpl.calls[0].init.method, "GET");
  assert.equal(fetchImpl.calls[0].init.headers.Authorization, "Bearer test-token");
  assert.equal(fetchImpl.calls[0].init.headers.Accept, "application/json");
});

test("JSON requests encode bodies", async () => {
  const fetchImpl = createFetch(jsonResponse({ data: { id: "sub_123" } }, { status: 201 }));
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });

  const result = await client.subscribers.add("fan@example.com");

  assert.deepEqual(result, { data: { id: "sub_123" } });
  assert.equal(fetchImpl.calls[0].init.method, "POST");
  assert.equal(fetchImpl.calls[0].init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(fetchImpl.calls[0].init.body), {
    email_address: "fan@example.com",
  });
});

test("204 responses return undefined from no-body helpers", async () => {
  const fetchImpl = createFetch(new Response(null, { status: 204 }));
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });

  const result = await client.subscribers.delete("sub_123");

  assert.equal(result, undefined);
  assert.equal(fetchImpl.calls[0].init.method, "DELETE");
});

test("binary responses are returned as bytes", async () => {
  const fetchImpl = createFetch(new Response(new Uint8Array([1, 2, 3])));
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });

  const result = await client.account.downloadPicture();

  assert.deepEqual([...result], [1, 2, 3]);
});

test("file uploads use multipart FormData", async () => {
  const fetchImpl = createFetch(jsonResponse({ data: { id: "att_123" } }, { status: 201 }));
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });
  const directory = await mkdtemp(join(tmpdir(), "bandtools-js-test-"));
  const filePath = join(directory, "cover.jpg");
  await writeFile(filePath, "image-bytes");

  const result = await client.newsletters.uploadAttachment(filePath);

  assert.deepEqual(result, { data: { id: "att_123" } });
  assert.equal(fetchImpl.calls[0].init.method, "POST");
  assert.equal(fetchImpl.calls[0].init.body.constructor.name, "FormData");
  assert.equal(fetchImpl.calls[0].init.headers["Content-Type"], undefined);
});

test("newsletter operations use schema paths and bodies", async () => {
  const fetchImpl = createFetch(jsonResponse({ data: { id: "nws_123" } }, { status: 202 }));
  const client = new BandToolsClient("test-token", {
    baseUrl: "https://example.test/api/v1",
    fetchImpl,
  });

  await client.newsletters.addToArchive("nws_123");
  await client.newsletters.removeFromArchive("nws_123");
  await client.newsletters.duplicate("nws_123");
  await client.newsletters.sendToNewSubscribers("nws_123");
  await client.newsletters.schedule("nws_123", "2026-06-01T10:00:00Z");

  assert.equal(fetchImpl.calls[0].url, "https://example.test/api/v1/newsletters/nws_123/archive");
  assert.equal(fetchImpl.calls[0].init.method, "POST");
  assert.equal(fetchImpl.calls[1].url, "https://example.test/api/v1/newsletters/nws_123/archive");
  assert.equal(fetchImpl.calls[1].init.method, "DELETE");
  assert.equal(fetchImpl.calls[2].url, "https://example.test/api/v1/newsletters/nws_123/duplicate");
  assert.equal(
    fetchImpl.calls[3].url,
    "https://example.test/api/v1/newsletters/nws_123/send-to-new-subscribers",
  );
  assert.deepEqual(JSON.parse(fetchImpl.calls[4].init.body), {
    scheduled_for: "2026-06-01T10:00:00Z",
  });
});

test("API error responses raise BandToolsApiError", async () => {
  const fetchImpl = createFetch(
    jsonResponse(
      { error: { message: "Email address is invalid" } },
      { status: 422, statusText: "Unprocessable Entity" },
    ),
  );
  const client = new BandToolsClient("test-token", { fetchImpl });

  await assert.rejects(() => client.subscribers.add("not-an-email"), (error) => {
    assert.equal(error instanceof BandToolsApiError, true);
    assert.equal(error.statusCode, 422);
    assert.equal(error.apiMessage, "Email address is invalid");
    assert.deepEqual(error.response, { error: { message: "Email address is invalid" } });
    return true;
  });
});

test("connection errors are wrapped", async () => {
  const fetchImpl = createFetch(new Error("network down"));
  const client = new BandToolsClient("test-token", { fetchImpl });

  await assert.rejects(() => client.account.get(), BandToolsConnectionError);
});

test("invalid page design slugs are rejected before request", async () => {
  const fetchImpl = createFetch();
  const client = new BandToolsClient("test-token", { fetchImpl });

  assert.throws(() => client.account.getPageDesign("landing"), TypeError);
  assert.equal(fetchImpl.calls.length, 0);
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
