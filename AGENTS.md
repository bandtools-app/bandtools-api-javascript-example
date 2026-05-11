# Repository Guidelines

## Project Overview

This repository is example JavaScript code for using the BandTools REST API. Keep it readable and practical for developers who want to adapt the code for their own integrations.

## Development Commands

- Install dependencies with `npm install`.
- Run tests with `npm test`.
- Run linting with `npm run lint`.

## Code Style

- Support Node.js 20 and newer.
- Use plain JavaScript modules, not TypeScript.
- Prefer explicit, dependency-light code using built-in Node APIs.
- Keep resource methods small and named after BandTools API resources.
- Centralize HTTP behavior, authentication, response parsing, and error handling in `src/transport.js`.
- Put endpoint-specific methods in the appropriate file under `src/resources/`.
- Do not add generated OpenAPI client output to this example repository.

## Testing

- Add focused unit tests for every new public client behavior.
- Mock network access; unit tests must not call the live BandTools API.
- Cover error handling for non-2xx API responses and connection failures when changing request behavior.

## Documentation

- Keep `README.md` aligned with the public API exposed by `src/`.
- Make it clear that this repository is example code, not an official SDK.
