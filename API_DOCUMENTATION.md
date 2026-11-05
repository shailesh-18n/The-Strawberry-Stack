# API Documentation

The currently mounted HTTP surface is limited to the Phase 1 application shell and process health. Existing feature-route files are not mounted.

## `GET /`

Returns the Phase 1 foundation page identifying VidyaChain and its current
technical components.

## `GET /health/live`

Liveness probe; confirms the HTTP process is responsive independently of MongoDB.

**Success — `200 OK`**

```json
{
  "status": "ok"
}
```

## `GET /health/ready`

Readiness probe; returns ready only when Mongoose is connected to MongoDB.

**Ready — `200 OK`**

```json
{
  "status": "ready",
  "database": "connected"
}
```

**Not ready — `503 Service Unavailable`**

```json
{
  "status": "not_ready",
  "database": "disconnected"
}
```

Unknown routes return an HTML 404 page. Invalid JSON requests return HTTP 400, and bodies above the 10 KB limit return HTTP 413. Unexpected server errors return a generic HTML 500 page without exposing exception details. The prior draft routes documented elsewhere in the workspace are not currently available over HTTP.
