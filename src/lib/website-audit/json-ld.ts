import type { CheerioAPI } from "cheerio";

export function normalizeSchemaType(value: string): string {
  const trimmed = value.trim();
  const separator = Math.max(
    trimmed.lastIndexOf("/"),
    trimmed.lastIndexOf(":"),
  );

  return separator >= 0 ? trimmed.slice(separator + 1) : trimmed;
}

export function asJsonRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function asJsonList(value: unknown): unknown[] {
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function schemaTypesOf(value: unknown): string[] {
  const record = asJsonRecord(value);

  if (!record) {
    return [];
  }

  return asJsonList(record["@type"])
    .filter((item): item is string => typeof item === "string")
    .map(normalizeSchemaType)
    .filter(Boolean);
}

export function collectJsonLdNodes(
  value: unknown,
  nodes: Record<string, unknown>[] = [],
): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectJsonLdNodes(item, nodes);
    }

    return nodes;
  }

  const record = asJsonRecord(value);

  if (!record) {
    return nodes;
  }

  nodes.push(record);

  const graph = record["@graph"];

  if (graph != null) {
    collectJsonLdNodes(graph, nodes);
  }

  for (const [key, nested] of Object.entries(record)) {
    if (key === "@graph" || key.startsWith("@")) {
      continue;
    }

    collectJsonLdNodes(nested, nodes);
  }

  return nodes;
}

export function parseJsonLdDocuments($: CheerioAPI): unknown[] {
  const documents: unknown[] = [];

  $('script[type="application/ld+json"]').each((_, element) => {
    const rawJson = $(element).html()?.trim();

    if (!rawJson) {
      return;
    }

    try {
      documents.push(JSON.parse(rawJson) as unknown);
    } catch {
      // Malformed JSON-LD must not stop the audit.
    }
  });

  return documents;
}

export function extractStructuredDataTypes(
  documents: unknown[],
): string[] {
  const schemaTypes = new Set<string>();

  for (const document of documents) {
    for (const node of collectJsonLdNodes(document)) {
      for (const type of schemaTypesOf(node)) {
        schemaTypes.add(type);
      }
    }
  }

  return [...schemaTypes].sort((left, right) => left.localeCompare(right));
}

export function plainSchemaString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = plainSchemaString(item);

      if (nested) {
        return nested;
      }
    }

    return null;
  }

  const record = asJsonRecord(value);

  if (!record) {
    return null;
  }

  return (
    plainSchemaString(record.name) ??
    plainSchemaString(record.text) ??
    plainSchemaString(record.value) ??
    null
  );
}
