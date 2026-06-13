// api/_lib/data/supabaseConfig.ts
import dotenv from "dotenv";
import path from "node:path";

// api/_lib/data/taskTables.ts
var BLOCK_ROMANS = ["I", "II", "III", "IV"];
var BLOCK_DEPT_COUNTS = [3, 9, 3, 2];
function listTaskTableNames() {
  return BLOCK_ROMANS.flatMap(
    (block, blockIndex) => Array.from({ length: BLOCK_DEPT_COUNTS[blockIndex] }, (_, deptIndex) => `${block}.${deptIndex + 1}`)
  );
}
function isTaskTableName(tableName) {
  return listTaskTableNames().includes(tableName.trim());
}
function taskTableToSupabaseName(taskTable) {
  const normalized = taskTable.trim();
  const match = normalized.match(/^([IV]+)\.(\d+)$/i);
  if (!match) {
    return normalized.toLowerCase().replace(".", "_");
  }
  return `${match[1].toLowerCase()}_${match[2]}`;
}

// api/_lib/data/supabaseConfig.ts
var REPORT_TABLE_LOGICAL = "BC \u0111\u1ECBnh k\u1EF3";
var REPORT_TABLE_SUPABASE = "bc_dinh_ky";
function readEnv() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ANON_KEY?.trim();
  if (url && key) {
    return process.env;
  }
  if (!process.env.VERCEL) {
    dotenv.config({ path: path.join(process.cwd(), ".env"), override: true });
  }
  return process.env;
}
function cleanEnvValue(value) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return void 0;
  }
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (first === '"' && last === '"' || first === "'" && last === "'") {
    return trimmed.slice(1, -1).trim() || void 0;
  }
  return trimmed;
}
function isReportTable(tableName) {
  return tableName.trim() === REPORT_TABLE_LOGICAL;
}
function resolveSupabaseTableName(logicalTable) {
  const normalized = logicalTable.trim();
  if (isReportTable(normalized)) {
    return cleanEnvValue(readEnv().SUPABASE_TABLE_BC_DINH_KY) ?? REPORT_TABLE_SUPABASE;
  }
  const envKey = `SUPABASE_TABLE_${normalized.replace(".", "_").toUpperCase()}`;
  const fromEnv = cleanEnvValue(readEnv()[envKey]);
  if (fromEnv) {
    return fromEnv;
  }
  return taskTableToSupabaseName(normalized);
}
function loadSupabaseConfig(env = readEnv()) {
  const url = cleanEnvValue(env.SUPABASE_URL);
  const anonKey = cleanEnvValue(env.SUPABASE_ANON_KEY);
  if (!url || !anonKey) {
    throw new Error("Thi\u1EBFu SUPABASE_URL ho\u1EB7c SUPABASE_ANON_KEY trong .env.");
  }
  return { url, anonKey };
}
function isSupabaseConfigured(env = readEnv()) {
  const url = cleanEnvValue(env.SUPABASE_URL);
  const anonKey = cleanEnvValue(env.SUPABASE_ANON_KEY);
  return Boolean(url && anonKey);
}
function describeSupabaseConfiguration(env = readEnv()) {
  if (!isSupabaseConfigured(env)) {
    return "Thi\u1EBFu SUPABASE_URL ho\u1EB7c SUPABASE_ANON_KEY. Th\xEAm bi\u1EBFn m\xF4i tr\u01B0\u1EDDng tr\xEAn Vercel ho\u1EB7c file .env local.";
  }
  return null;
}

// api/_lib/data/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";
var client = null;
function getSupabaseClient() {
  if (!client) {
    const config = loadSupabaseConfig();
    client = createClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return client;
}

// api/_lib/data/supabaseErrors.ts
function throwSupabaseError(message, table) {
  if (message.includes("schema cache") || message.includes("Could not find the table") || message.includes("does not exist")) {
    throw new Error(
      `B\u1EA3ng public.${table} ch\u01B0a \u0111\xFAng tr\xEAn Supabase. M\u1EDF Supabase \u2192 SQL Editor \u2192 ch\u1EA1y to\xE0n b\u1ED9 file supabase/schema.sql \u2192 Run, r\u1ED3i npm run db:check.`
    );
  }
  throw new Error(message);
}

// api/_lib/data/supabaseReportStore.ts
function pickReportId(row) {
  for (const key of ["id", "ID", "Id"]) {
    const value = row[key];
    if (value === null || value === void 0) {
      continue;
    }
    const trimmed = String(value).trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return "";
}
function dbRowToReport(row) {
  const id = row.id;
  return {
    ...row.data,
    id: pickReportId(row.data) || id
  };
}
function reportRowToDb(row) {
  const id = pickReportId(row);
  if (!id) {
    throw new Error("Thi\u1EBFu c\u1ED9t id \u0111\u1EC3 ghi Supabase (b\xE1o c\xE1o).");
  }
  const data = { ...row, id };
  delete data._RowNumber;
  return { id, data };
}
async function findSupabaseReportRows(logicalTable = REPORT_TABLE_LOGICAL) {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(table).select("id,data").order("id", { ascending: true });
  if (error) {
    throwSupabaseError(error.message, table);
  }
  const rows = (data ?? []).map((item) => dbRowToReport(item));
  return { rows, raw: data };
}
async function addSupabaseReportRows(logicalTable, rows) {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  const payload = rows.map(reportRowToDb);
  const { data, error } = await supabase.from(table).insert(payload).select("id,data");
  if (error) {
    throwSupabaseError(error.message, table);
  }
  return (data ?? []).map((item) => dbRowToReport(item));
}
async function editSupabaseReportRows(logicalTable, rows) {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  const updated = [];
  for (const row of rows) {
    const { id, data } = reportRowToDb(row);
    const { data: saved, error } = await supabase.from(table).update({ data }).eq("id", id).select("id,data").maybeSingle();
    if (error) {
      throwSupabaseError(error.message, table);
    }
    if (!saved) {
      throw new Error(`Kh\xF4ng t\xECm th\u1EA5y b\xE1o c\xE1o id=${id} trong b\u1EA3ng ${table}.`);
    }
    updated.push(dbRowToReport(saved));
  }
  return updated;
}
async function deleteSupabaseReportRows(logicalTable, rows) {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  for (const row of rows) {
    const id = pickReportId(row);
    if (!id) {
      throw new Error("Thi\u1EBFu id \u0111\u1EC3 x\xF3a b\xE1o c\xE1o tr\xEAn Supabase.");
    }
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      throwSupabaseError(error.message, table);
    }
  }
  return null;
}

// api/_lib/data/supabaseTaskStore.ts
function pickTt(row) {
  for (const key of ["TT", "tt", "STT", "Stt", "stt"]) {
    const value = row[key];
    if (value === null || value === void 0) {
      continue;
    }
    const trimmed = String(value).trim();
    if (trimmed) {
      return trimmed;
    }
  }
  return "";
}
function parseTtFromSelector(selector) {
  if (!selector?.trim()) {
    return null;
  }
  const quoted = selector.match(/Filter\(\[TT\],\s*="([^"]+)"\)/i);
  if (quoted?.[1]) {
    return quoted[1].trim();
  }
  const numeric = selector.match(/Filter\(\[TT\],\s*=([^")\s]+)\)/i);
  if (numeric?.[1]) {
    return numeric[1].trim();
  }
  return null;
}
function dbRowToRecord(row) {
  const tt = row.tt;
  return {
    ...row.data,
    TT: pickTt(row.data) || tt
  };
}
function recordRowToDb(row) {
  const tt = pickTt(row);
  if (!tt) {
    throw new Error("Thi\u1EBFu c\u1ED9t TT \u0111\u1EC3 ghi Supabase.");
  }
  const data = { ...row, TT: tt };
  return { tt, data };
}
async function findSupabaseTaskRows(logicalTable, options) {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  const tt = parseTtFromSelector(options?.selector);
  let query = supabase.from(table).select("tt,data").order("tt", { ascending: true });
  if (tt) {
    query = query.eq("tt", tt);
  }
  const { data, error } = await query;
  if (error) {
    throwSupabaseError(error.message, table);
  }
  const rows = (data ?? []).map((item) => dbRowToRecord(item));
  return { rows, raw: data };
}
async function addSupabaseTaskRows(logicalTable, rows) {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  const payload = rows.map(recordRowToDb);
  const { data, error } = await supabase.from(table).insert(payload).select("tt,data");
  if (error) {
    throwSupabaseError(error.message, table);
  }
  return (data ?? []).map((item) => dbRowToRecord(item));
}
async function editSupabaseTaskRows(logicalTable, rows) {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  const updated = [];
  for (const row of rows) {
    const { tt, data } = recordRowToDb(row);
    const { data: saved, error } = await supabase.from(table).update({ data }).eq("tt", tt).select("tt,data").maybeSingle();
    if (error) {
      throwSupabaseError(error.message, table);
    }
    if (!saved) {
      throw new Error(`Kh\xF4ng t\xECm th\u1EA5y d\xF2ng TT=${tt} trong b\u1EA3ng ${table}.`);
    }
    updated.push(dbRowToRecord(saved));
  }
  return updated;
}
async function deleteSupabaseTaskRows(logicalTable, rows) {
  const table = resolveSupabaseTableName(logicalTable);
  const supabase = getSupabaseClient();
  for (const row of rows) {
    const tt = pickTt(row);
    if (!tt) {
      throw new Error("Thi\u1EBFu TT \u0111\u1EC3 x\xF3a tr\xEAn Supabase.");
    }
    const { error } = await supabase.from(table).delete().eq("tt", tt);
    if (error) {
      throwSupabaseError(error.message, table);
    }
  }
  return null;
}

// api/_lib/data/supabaseDataStore.ts
function isKnownDataTable(tableName) {
  return isTaskTableName(tableName) || isReportTable(tableName);
}
async function findSupabaseRows(tableName, options) {
  if (isReportTable(tableName)) {
    return findSupabaseReportRows(tableName);
  }
  if (isTaskTableName(tableName)) {
    return findSupabaseTaskRows(tableName, options);
  }
  throw new Error(`B\u1EA3ng kh\xF4ng h\u1ED7 tr\u1EE3: ${tableName}`);
}
async function addSupabaseRows(tableName, rows) {
  if (isReportTable(tableName)) {
    return addSupabaseReportRows(tableName, rows);
  }
  if (isTaskTableName(tableName)) {
    return addSupabaseTaskRows(tableName, rows);
  }
  throw new Error(`B\u1EA3ng kh\xF4ng h\u1ED7 tr\u1EE3: ${tableName}`);
}
async function editSupabaseRows(tableName, rows) {
  if (isReportTable(tableName)) {
    return editSupabaseReportRows(tableName, rows);
  }
  if (isTaskTableName(tableName)) {
    return editSupabaseTaskRows(tableName, rows);
  }
  throw new Error(`B\u1EA3ng kh\xF4ng h\u1ED7 tr\u1EE3: ${tableName}`);
}
async function deleteSupabaseRows(tableName, rows) {
  if (isReportTable(tableName)) {
    return deleteSupabaseReportRows(tableName, rows);
  }
  if (isTaskTableName(tableName)) {
    return deleteSupabaseTaskRows(tableName, rows);
  }
  throw new Error(`B\u1EA3ng kh\xF4ng h\u1ED7 tr\u1EE3: ${tableName}`);
}

// api/_lib/dataHandlers.ts
var DEFAULT_TABLE = "I.1";
function sendJson(res, status, payload) {
  if (res.headersSent) {
    return;
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
function withJsonApiHandler(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      sendJson(res, 500, {
        message: error instanceof Error ? error.message : "L\u1ED7i server khi g\u1ECDi API d\u1EEF li\u1EC7u."
      });
    }
  };
}
function tableError(tableName) {
  if (!isKnownDataTable(tableName)) {
    return `B\u1EA3ng kh\xF4ng h\u1ED7 tr\u1EE3: ${tableName}`;
  }
  return describeSupabaseConfiguration();
}
async function handleDataStatus(req, res) {
  if (!isSupabaseConfigured()) {
    const message = describeSupabaseConfiguration() ?? "Ch\u01B0a c\u1EA5u h\xECnh Supabase.";
    sendJson(res, 503, { configured: false, connected: false, backend: "supabase", message });
    return;
  }
  const url = new URL(req.url ?? "/api/data/status", "http://localhost");
  const tableName = url.searchParams.get("table")?.trim() || DEFAULT_TABLE;
  const err = tableError(tableName);
  if (err) {
    sendJson(res, 400, { configured: true, connected: false, backend: "supabase", message: err });
    return;
  }
  try {
    const result = await findSupabaseRows(tableName);
    sendJson(res, 200, {
      configured: true,
      connected: true,
      table: tableName,
      rowCount: result.rows.length,
      backend: "supabase"
    });
  } catch (error) {
    sendJson(res, 502, {
      configured: true,
      connected: false,
      backend: "supabase",
      message: error instanceof Error ? error.message : "Kh\xF4ng th\u1EC3 k\u1EBFt n\u1ED1i Supabase."
    });
  }
}
async function handleDataFindGet(req, res) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? "Ch\u01B0a c\u1EA5u h\xECnh Supabase." });
    return;
  }
  const url = new URL(req.url ?? "/api/data/find", "http://localhost");
  const tableName = url.searchParams.get("table")?.trim() || DEFAULT_TABLE;
  const err = tableError(tableName);
  if (err) {
    sendJson(res, 400, { table: tableName, message: err });
    return;
  }
  try {
    const selector = url.searchParams.get("selector")?.trim();
    const result = await findSupabaseRows(tableName, { selector });
    sendJson(res, 200, { table: tableName, rows: result.rows, raw: result.raw });
  } catch (error) {
    sendJson(res, 502, {
      table: tableName,
      message: error instanceof Error ? error.message : "G\u1ECDi Supabase th\u1EA5t b\u1EA1i."
    });
  }
}
async function readBody(req) {
  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve());
    req.on("error", reject);
  });
  if (!chunks.length) return {};
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}
async function handleDataFindPost(req, res) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? "Ch\u01B0a c\u1EA5u h\xECnh Supabase." });
    return;
  }
  try {
    const body = await readBody(req);
    const tableName = String(body.table ?? DEFAULT_TABLE);
    const err = tableError(tableName);
    if (err) {
      sendJson(res, 400, { table: tableName, message: err });
      return;
    }
    const result = await findSupabaseRows(tableName, {
      selector: typeof body.selector === "string" ? body.selector : void 0
    });
    sendJson(res, 200, { table: tableName, rows: result.rows, raw: result.raw });
  } catch (error) {
    sendJson(res, 502, { message: error instanceof Error ? error.message : "G\u1ECDi Supabase th\u1EA5t b\u1EA1i." });
  }
}
async function handleDataAdd(req, res) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? "Ch\u01B0a c\u1EA5u h\xECnh Supabase." });
    return;
  }
  try {
    const body = await readBody(req);
    const tableName = String(body.table ?? DEFAULT_TABLE);
    const err = tableError(tableName);
    if (err) {
      sendJson(res, 400, { table: tableName, message: err });
      return;
    }
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const raw = await addSupabaseRows(tableName, rows);
    sendJson(res, 200, { table: tableName, raw });
  } catch (error) {
    sendJson(res, 502, { message: error instanceof Error ? error.message : "G\u1ECDi Supabase th\u1EA5t b\u1EA1i." });
  }
}
async function handleDataEdit(req, res) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? "Ch\u01B0a c\u1EA5u h\xECnh Supabase." });
    return;
  }
  try {
    const body = await readBody(req);
    const tableName = String(body.table ?? DEFAULT_TABLE);
    const err = tableError(tableName);
    if (err) {
      sendJson(res, 400, { table: tableName, message: err });
      return;
    }
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const raw = await editSupabaseRows(tableName, rows);
    sendJson(res, 200, { table: tableName, raw });
  } catch (error) {
    sendJson(res, 502, { message: error instanceof Error ? error.message : "G\u1ECDi Supabase th\u1EA5t b\u1EA1i." });
  }
}
async function handleDataDelete(req, res) {
  if (!isSupabaseConfigured()) {
    sendJson(res, 503, { message: describeSupabaseConfiguration() ?? "Ch\u01B0a c\u1EA5u h\xECnh Supabase." });
    return;
  }
  try {
    const body = await readBody(req);
    const tableName = String(body.table ?? DEFAULT_TABLE);
    const err = tableError(tableName);
    if (err) {
      sendJson(res, 400, { table: tableName, message: err });
      return;
    }
    const rows = Array.isArray(body.rows) ? body.rows : [];
    const raw = await deleteSupabaseRows(tableName, rows);
    sendJson(res, 200, { table: tableName, raw });
  } catch (error) {
    sendJson(res, 502, { message: error instanceof Error ? error.message : "G\u1ECDi Supabase th\u1EA5t b\u1EA1i." });
  }
}

// api-src/data/[action].ts
function sendJson2(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}
function resolveAction(req) {
  const fromQuery = req.query?.action;
  if (typeof fromQuery === "string" && fromQuery.trim()) {
    return fromQuery.trim();
  }
  if (Array.isArray(fromQuery) && fromQuery[0]?.trim()) {
    return fromQuery[0].trim();
  }
  const pathname = new URL(req.url ?? "/api/data", "http://localhost").pathname;
  const segments = pathname.replace(/^\/api\/data\/?/, "").split("/").filter(Boolean);
  return segments[0] ?? "";
}
async function routeDataApi(req, res) {
  const action = resolveAction(req);
  const method = req.method ?? "GET";
  if (action === "debug" && method === "GET") {
    sendJson2(res, 200, {
      backend: "supabase",
      configured: isSupabaseConfigured(),
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nodeEnv: process.env.NODE_ENV ?? null
    });
    return;
  }
  if (action === "status" && method === "GET") {
    await handleDataStatus(req, res);
    return;
  }
  if (action === "find") {
    if (method === "POST") {
      await handleDataFindPost(req, res);
      return;
    }
    if (method === "GET") {
      await handleDataFindGet(req, res);
      return;
    }
  }
  if (action === "add" && method === "POST") {
    await handleDataAdd(req, res);
    return;
  }
  if (action === "edit" && method === "POST") {
    await handleDataEdit(req, res);
    return;
  }
  if (action === "delete" && method === "POST") {
    await handleDataDelete(req, res);
    return;
  }
  sendJson2(res, 404, { message: `Kh\xF4ng t\xECm th\u1EA5y endpoint /api/data/${action || ""}.` });
}
var action_default = withJsonApiHandler(routeDataApi);
export {
  action_default as default
};
