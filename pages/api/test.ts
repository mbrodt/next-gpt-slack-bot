import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default function MyEdgeFunction(
  request: NextRequest,
  context: NextFetchEvent
) {
  return NextResponse.json({
    name: `Hello, from ${request.url} I'm an Edge Function!`,
  });
}
