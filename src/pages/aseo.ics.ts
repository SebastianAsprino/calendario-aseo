import type { APIRoute } from "astro";
import { ICS_CONTENT_TYPE, generalFeed } from "../lib/ics";

export const GET: APIRoute = () =>
  new Response(generalFeed(), { headers: { "Content-Type": ICS_CONTENT_TYPE } });
