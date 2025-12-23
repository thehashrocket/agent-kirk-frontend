#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const scalarTypes = new Set([
  "String",
  "Boolean",
  "Int",
  "BigInt",
  "Float",
  "Decimal",
  "DateTime",
  "Json",
  "Bytes",
]);

function usage() {
  return [
    "Usage:",
    "  node scripts/generate-prisma-schema-diagram.js [schemaPath] [outputPath]",
    "",
    "Defaults:",
    "  schemaPath: prisma/schema.prisma",
    "  outputPath: docs/prisma-schema-diagram.md",
    "",
  ].join("\n");
}

function parseSchema(schemaText) {
  const lines = schemaText.split(/\r?\n/);

  const models = [];
  const enums = [];

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();
    if (trimmed.startsWith("model ")) {
      const name = trimmed.split(/\s+/)[1];
      const blockLines = [];

      // Seek to opening brace, then collect until closing brace.
      while (index < lines.length && !lines[index].includes("{")) index += 1;
      index += 1;
      while (index < lines.length) {
        const line = lines[index];
        if (line.trim().startsWith("}")) break;
        blockLines.push(line);
        index += 1;
      }

      models.push({ name, blockLines });
    } else if (trimmed.startsWith("enum ")) {
      const name = trimmed.split(/\s+/)[1];
      const values = [];

      while (index < lines.length && !lines[index].includes("{")) index += 1;
      index += 1;
      while (index < lines.length) {
        const line = lines[index].trim();
        if (line.startsWith("}")) break;
        if (line && !line.startsWith("//")) values.push(line.split(/\s+/)[0]);
        index += 1;
      }

      enums.push({ name, values });
    }
  }

  return { models, enums };
}

function parseModel(model, modelNames) {
  const fields = [];
  const modelDirectives = [];

  for (const rawLine of model.blockLines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;
    if (line.startsWith("@@")) {
      modelDirectives.push(line);
      continue;
    }

    const [fieldName, typeToken, ...rest] = line.split(/\s+/);
    if (!fieldName || !typeToken) continue;

    const attributes = rest.join(" ");
    let baseType = typeToken;
    let isArray = false;
    let isOptional = false;

    if (baseType.endsWith("[]")) {
      isArray = true;
      baseType = baseType.slice(0, -2);
    }
    if (baseType.endsWith("?")) {
      isOptional = true;
      baseType = baseType.slice(0, -1);
    }

    const isRelation = modelNames.has(baseType) && !scalarTypes.has(baseType);

    const relationMatch = attributes.match(/@relation\(([^)]*)\)/);
    const relationArgs = relationMatch ? relationMatch[1] : null;
    const relationFieldsMatch = relationArgs
      ? relationArgs.match(/fields\s*:\s*\[([^\]]+)\]/)
      : null;
    const relationFields = relationFieldsMatch
      ? relationFieldsMatch[1]
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    fields.push({
      name: fieldName,
      rawType: typeToken,
      baseType,
      isArray,
      isOptional,
      attributes,
      isRelation,
      relationFields,
    });
  }

  const pkFields = new Set();
  const uniqueFields = new Set();

  for (const field of fields) {
    if (field.attributes.includes("@id")) pkFields.add(field.name);
    if (field.attributes.includes("@unique")) uniqueFields.add(field.name);
  }

  for (const directive of modelDirectives) {
    const idMatch = directive.match(/^@@id\(\s*\[([^\]]+)\]/);
    if (idMatch) {
      for (const name of idMatch[1].split(",").map((value) => value.trim())) {
        if (name) pkFields.add(name);
      }
    }

    const uniqueMatch = directive.match(/^@@unique\(\s*\[([^\]]+)\]/);
    if (uniqueMatch) {
      const names = uniqueMatch[1].split(",").map((value) => value.trim());
      if (names.length === 1 && names[0]) uniqueFields.add(names[0]);
    }
  }

  return { fields, pkFields, uniqueFields, modelDirectives };
}

function buildMermaid({ models }) {
  const modelNames = new Set(models.map((model) => model.name));
  const parsedModels = new Map();

  for (const model of models) {
    parsedModels.set(model.name, parseModel(model, modelNames));
  }

  /** @type {Array<{from: string, to: string, leftCard: string, rightCard: string, label: string}>} */
  const edges = [];
  const edgeKeys = new Set();

  function addEdge(edge) {
    const key = `${edge.from}|${edge.leftCard}|${edge.rightCard}|${edge.to}|${edge.label}`;
    if (edgeKeys.has(key)) return;
    edgeKeys.add(key);
    edges.push(edge);
  }

  // 1) Explicit relations with `fields: [...]` (FK lives on current model).
  for (const model of models) {
    const parsed = parsedModels.get(model.name);
    if (!parsed) continue;

    for (const field of parsed.fields) {
      if (!field.isRelation) continue;
      if (field.isArray) continue;
      if (field.relationFields.length === 0) continue;

      const referencedModel = field.baseType;
      const referencingModel = model.name;

      const leftCard = field.isOptional ? "o|" : "||";

      let rightCard = "o{";
      if (field.relationFields.length === 1) {
        const fkFieldName = field.relationFields[0];
        const isUnique =
          parsed.uniqueFields.has(fkFieldName) || parsed.pkFields.has(fkFieldName);
        if (isUnique) rightCard = "o|";
      }

      addEdge({
        from: referencedModel,
        to: referencingModel,
        leftCard,
        rightCard,
        label: field.name,
      });
    }
  }

  function hasAnyEdgeBetween(a, b) {
    for (const edge of edges) {
      if ((edge.from === a && edge.to === b) || (edge.from === b && edge.to === a)) {
        return true;
      }
    }
    return false;
  }

  // 2) Implicit many-to-many (both sides are lists, no FK edge found).
  const m2mSeen = new Set();
  for (const modelA of models) {
    const parsedA = parsedModels.get(modelA.name);
    if (!parsedA) continue;

    const listRelationsA = parsedA.fields.filter(
      (field) => field.isRelation && field.isArray && field.relationFields.length === 0,
    );

    for (const fieldA of listRelationsA) {
      const modelBName = fieldA.baseType;
      const parsedB = parsedModels.get(modelBName);
      if (!parsedB) continue;

      const fieldB = parsedB.fields.find(
        (candidate) =>
          candidate.isRelation &&
          candidate.isArray &&
          candidate.baseType === modelA.name &&
          candidate.relationFields.length === 0,
      );

      if (!fieldB) continue;
      if (hasAnyEdgeBetween(modelA.name, modelBName)) continue;

      const key = [modelA.name, modelBName].sort().join("|");
      if (m2mSeen.has(key)) continue;
      m2mSeen.add(key);

      const [left, right] =
        modelA.name < modelBName
          ? [modelA.name, modelBName]
          : [modelBName, modelA.name];
      addEdge({
        from: left,
        to: right,
        leftCard: "o{",
        rightCard: "o{",
        label: "many-to-many",
      });
    }
  }

  // 3) Remaining list relations (best-effort one-to-many).
  for (const model of models) {
    const parsed = parsedModels.get(model.name);
    if (!parsed) continue;

    for (const field of parsed.fields) {
      if (!field.isRelation) continue;
      if (!field.isArray) continue;
      if (hasAnyEdgeBetween(model.name, field.baseType)) continue;

      addEdge({
        from: model.name,
        to: field.baseType,
        leftCard: "||",
        rightCard: "o{",
        label: field.name,
      });
    }
  }

  const entityBlocks = models
    .map((model) => {
      const parsed = parsedModels.get(model.name);
      if (!parsed) return "";

      const attributeLines = [];
      for (const field of parsed.fields) {
        // Skip relation object/list fields; keep scalar fields (including FK columns).
        if (field.isRelation) continue;

        const constraints = [];
        if (parsed.pkFields.has(field.name)) constraints.push("PK");
        if (parsed.uniqueFields.has(field.name) && !parsed.pkFields.has(field.name))
          constraints.push("UK");

        let typeLabel = field.baseType;
        if (field.isArray) typeLabel = `${typeLabel}[]`;
        const constraintLabel = constraints.length ? ` ${constraints.join(",")}` : "";
        const optionalLabel = field.isOptional ? ' "nullable"' : "";
        attributeLines.push(
          `    ${typeLabel} ${field.name}${constraintLabel}${optionalLabel}`,
        );
      }

      if (attributeLines.length === 0) return "";
      return [`  ${model.name} {`, ...attributeLines, "  }"].join("\n");
    })
    .filter(Boolean)
    .join("\n\n");

  const edgeLines = edges
    .sort((a, b) => {
      const aKey = `${a.from}|${a.to}|${a.label}`;
      const bKey = `${b.from}|${b.to}|${b.label}`;
      return aKey.localeCompare(bKey);
    })
    .map((edge) => `  ${edge.from} ${edge.leftCard}--${edge.rightCard} ${edge.to} : "${edge.label}"`)
    .join("\n");

  return ["```mermaid", "erDiagram", entityBlocks, edgeLines, "```"].join("\n");
}

function main() {
  const [, , schemaPathArg, outputPathArg, ...rest] = process.argv;
  if (rest.includes("--help") || rest.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }

  const schemaPath = schemaPathArg || "prisma/schema.prisma";
  const outputPath = outputPathArg || "docs/prisma-schema-diagram.md";

  const schemaText = fs.readFileSync(schemaPath, "utf8");
  const { models } = parseSchema(schemaText);
  const mermaid = buildMermaid({ models });

  const contents = [
    "# Prisma Schema Diagram",
    "",
    "This diagram is generated from `prisma/schema.prisma`.",
    "",
    mermaid,
    "",
  ].join("\n");

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, contents, "utf8");
  process.stdout.write(`Wrote ${outputPath}\n`);
}

main();
