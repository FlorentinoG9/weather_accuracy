/** biome-ignore-all lint/suspicious/useAwait: false positive */

import type { APIContext } from "astro";
import { Hono } from "hono";
import { accuracyRouter } from "../../../server/routes/accuracy.js";
import { locationRouter } from "../../../server/routes/location.js";
import { weatherRouter } from "../../../server/routes/weather.js";

// This is an API route - no getStaticPaths needed
// Mark as server route (not prerendered)
export const prerender = false;

const app = new Hono();

// CORS middleware
app.use("/*", async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (c.req.method === "OPTIONS") {
    return c.text("", 200);
  }

  await next();
});

// Mount routers
app.route("/location", locationRouter);
app.route("/weather", weatherRouter);
app.route("/accuracy", accuracyRouter);

export async function GET(context: APIContext) {
  return handleRequest(context);
}

export async function POST(context: APIContext) {
  return handleRequest(context);
}

export async function PUT(context: APIContext) {
  return handleRequest(context);
}

export async function DELETE(context: APIContext) {
  return handleRequest(context);
}

export async function OPTIONS(context: APIContext) {
  return handleRequest(context);
}

async function handleRequest(context: APIContext) {
  try {
    const path = context.params.path || "";
    const url = new URL(context.request.url);

    // Construct the request path for Hono
    // The path param from Astro is like "weather/compare" or "location"
    // Hono expects paths like "/weather/compare" or "/location"
    const honoPath = path.startsWith("/") ? path : `/${path}`;

    // Construct the request for Hono
    const honoRequest = new Request(`${url.origin}${honoPath}${url.search}`, {
      method: context.request.method,
      headers: context.request.headers,
      body:
        context.request.method !== "GET" && context.request.method !== "HEAD"
          ? await context.request.text()
          : undefined,
    });

    const response = await app.fetch(honoRequest);

    // Convert Hono response to Astro response
    const responseBody = await response.text();
    const headers = Object.fromEntries(response.headers.entries());

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    // Log the error for debugging in Cloudflare
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error("API route error:", {
      message: errorMessage,
      stack: errorStack,
      error: error,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        message: errorMessage,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
