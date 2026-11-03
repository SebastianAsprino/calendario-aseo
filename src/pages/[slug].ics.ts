import type { APIRoute, GetStaticPaths } from "astro";
import { ICS_CONTENT_TYPE, personFeed } from "../lib/ics";
import { PEOPLE, type Slug } from "../lib/rotation";

export const getStaticPaths = (() => PEOPLE.map(({ slug }) => ({ params: { slug } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) =>
  new Response(personFeed(params.slug as Slug), { headers: { "Content-Type": ICS_CONTENT_TYPE } });
