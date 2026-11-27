import { createHash, randomUUID } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";

const REPOSITORY_ROOT = path.resolve(import.meta.dirname, "..");
const LOOP_ROOT = path.join(REPOSITORY_ROOT, "content", "curadoria-loop");
const DEFAULT_RUNS_ROOT = path.join(LOOP_ROOT, "runs");
const DEFAULT_CATALOG = path.join(LOOP_ROOT, "catalogo-candidato.json");
const CONTRACT_FILE = path.join(LOOP_ROOT, "PROMPT-CONTRACT.md");
const MAX_LEASE_COUNT = 20;
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

const MODULES = [
  ["dossie", "Dossiê clínico", "Delimite a condição, critérios de entrada/exclusão, diferenciais, sinais de alarme, perguntas rápidas, exame físico dirigido, reavaliação e orientação. Não detalhe medicamentos neste módulo."],
  ["medicamentos_amb", "Medicamentos ambulatoriais e de alta", "Mapeie alternativas condicionais para ambulatório/alta. Para cada campo operacional, exija fonte e localizador; não gere uma receita cumulativa."],
  ["medicamentos_ps", "Medicamentos de porta-PS e observação", "Mapeie opções de tratamento imediato e observação, separando via, apresentação, preparo, monitorização e escalonamento quando aplicáveis."],
  ["medicamentos_sv", "Sala vermelha", "Delimite uma variante de emergência e as fases de estabilização, tratamento e transferência. Não trate qualquer medicamento parenteral como critério de sala vermelha."],
  ["populacoes", "Populações especiais e personalização", "Compare explicitamente pediatria, gestação, lactação, geriatria, função renal/hepática, alergias e polifarmácia quando aplicáveis."],
  ["exames", "Exames diagnósticos", "Separe laboratório, testes à beira-leito, ECG, imagem e outros métodos. Para cada exame, informe a pergunta clínica e quando não pedir; não forme painel indiscriminado."],
  ["escores", "Escores e calculadoras", "Inclua somente ferramentas pertinentes e verificáveis, com versão, população validada, entradas, unidades, limites e limitações. Um escore não decide sozinho a conduta."],
  ["destino", "Encaminhamento, transferência e admissão", "Diferencie alta/APS, especialista, observação, internação e transferência. Não invente disponibilidade, vaga, aceite, APAC ou AIH."],
  ["documentos", "Documentos clínicos", "Crie campos a confirmar para anamnese, exame físico, receita, exames, orientação, atestado, relatório e encaminhamento. Não ateste fatos clínicos não confirmados."],
];

function fail(message) {
  throw new Error(message);
}

function now() {
  return new Date().toISOString();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (!token.startsWith("--")) fail(`Argumento inesperado: ${token}`);
    const key = token.slice(2);
    const next = rest[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = true;
    } else {
      options[key] = next;
      index += 1;
    }
  }
  return { command, options };
}

function required(options, key) {
  const value = options[key];
  if (!value || value === true) fail(`Informe --${key}.`);
  return String(value);
}

function runName(value) {
  if (!/^[a-z0-9][a-z0-9_-]{1,80}$/i.test(value)) {
    fail("O nome do lote deve usar letras, números, hífen ou sublinhado (2 a 81 caracteres).");
  }
  return value;
}

function taskId(value) {
  if (!/^[A-Z0-9][A-Z0-9_-]{2,160}$/.test(value)) fail(`ID de tarefa inválido: ${value}`);
  return value;
}

function runDirectory(name, options) {
  const runsRoot = path.resolve(options["runs-root"] ? String(options["runs-root"]) : DEFAULT_RUNS_ROOT);
  const directory = path.resolve(runsRoot, runName(name));
  if (!directory.startsWith(`${runsRoot}${path.sep}`)) fail("Diretório de lote inválido.");
  return directory;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (error) {
    fail(`Não foi possível ler JSON em ${file}: ${error.message}`);
  }
}

async function writeJson(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, file);
}

async function loadManifest(directory) {
  const file = path.join(directory, "manifest.json");
  const manifest = await readJson(file);
  if (manifest.schemaVersion !== "prescrimed-curadoria-loop-1.0" || !Array.isArray(manifest.tasks)) {
    fail("Manifesto inválido ou incompatível.");
  }
  return manifest;
}

async function saveManifest(directory, manifest) {
  manifest.updatedAt = now();
  await writeJson(path.join(directory, "manifest.json"), manifest);
}

function slug(value) {
  const base = String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "condicao";
}

function candidateRef(categoryId, name, index) {
  return `${categoryId.toUpperCase()}-${String(index + 1).padStart(3, "0")}-${slug(name).toUpperCase()}`;
}

function createTask(input) {
  return {
    id: input.id,
    stage: input.stage,
    title: input.title,
    category: input.category ?? null,
    conditionRef: input.conditionRef ?? null,
    conditionName: input.conditionName ?? null,
    lane: input.lane ?? null,
    moduleLabel: input.moduleLabel ?? null,
    dependencies: input.dependencies ?? [],
    status: "pending",
    attempts: 0,
    leasedAt: null,
    submittedAt: null,
    reviewedAt: null,
    reviewer: null,
    responseFile: null,
    responseSha256: null,
    decisionNote: null,
    createdAt: now(),
  };
}

function catalogTasks(catalog) {
  if (!Array.isArray(catalog.categories) || catalog.categories.length === 0) fail("Catálogo sem categorias.");
  const tasks = [];
  for (const category of catalog.categories) {
    if (!category.id || !category.name || !Array.isArray(category.candidates)) fail("Categoria candidata inválida.");
    const categoryId = slug(category.id).toUpperCase();
    for (const lane of ["A", "B"]) {
      tasks.push(createTask({
        id: `CAT-${categoryId}-${lane}`,
        stage: "catalog",
        title: `Descoberta de catálogo — ${category.name} — pesquisa ${lane}`,
        category: category.id,
        lane,
      }));
    }
    tasks.push(createTask({
      id: `CAT-${categoryId}-CONSOLIDAR`,
      stage: "catalog_consolidation",
      title: `Consolidação do catálogo — ${category.name}`,
      category: category.id,
      dependencies: [`CAT-${categoryId}-A`, `CAT-${categoryId}-B`],
    }));
  }
  return tasks;
}

function dependenciesAccepted(manifest, task) {
  const byId = new Map(manifest.tasks.map((item) => [item.id, item]));
  return task.dependencies.every((id) => byId.get(id)?.status === "accepted");
}

async function loadContract() {
  return readFile(CONTRACT_FILE, "utf8");
}

function taskInstruction(task) {
  if (task.stage === "catalog") {
    return [
      `TAREFA: DESCUBRA O CATÁLOGO DA CATEGORIA ${task.category}.`,
      "Use os termos candidatos como sementes, sem assumir que sejam entidades canônicas. Distingua queixa, síndrome, diagnóstico, complicação e procedimento.",
      "Para cada entrada, proponha nome preferido, termos equivalentes verificáveis, termos relacionados não equivalentes, população/ambiente aplicáveis, sinais de alarme a pesquisar, documentos potenciais, risco de duplicidade e prioridade qualitativa com limitação explícita.",
      "Não forneça posologia nesta etapa. Preserve lacunas, fontes e localizadores por afirmação.",
    ].join("\n");
  }
  if (task.stage === "catalog_consolidation") {
    return [
      `TAREFA: CONSOLIDE AS PESQUISAS INDEPENDENTES DA CATEGORIA ${task.category}.`,
      "Anexe as duas respostas dependentes. Mantenha origens separadas, não resolva divergência por maioria e não misture relações com sinônimos.",
      "Produza um catálogo provisório com condition_ref, nome, tipo, categoria, termos de busca, relações, fonte e lacunas. A saída é rascunho para revisão humana.",
    ].join("\n");
  }
  const module = MODULES.find(([id]) => id === task.stage);
  if (module) {
    return [
      `TAREFA: ${module[1].toUpperCase()}.`,
      `Condição: ${task.conditionName} (${task.conditionRef}). Categoria: ${task.category}. Pesquisa independente: ${task.lane}.`,
      module[2],
      "Delimite população, ambiente, gravidade e fase. Devolva rascunho estruturado, afirmações com fontes/localizadores, divergências e campos bloqueados.",
    ].join("\n");
  }
  if (task.stage === "audit") {
    return [
      "TAREFA: AUDITORIA INDEPENDENTE DE LACUNAS E RISCOS.",
      `Condição: ${task.conditionName} (${task.conditionRef}).`,
      "Pesquise sem usar respostas de outras IAs. Procure omissões por população, ambiente, gravidade, medicação, exame, escore, destino, recursos e documentação. Não dê selo de segurança.",
    ].join("\n");
  }
  if (task.stage === "comparison") {
    return [
      `TAREFA: COMPARAR PESQUISAS DO MÓDULO ${task.moduleLabel}.`,
      `Condição: ${task.conditionName} (${task.conditionRef}). Anexe as respostas das tarefas dependentes.`,
      "Alinhe afirmações por população, ambiente, apresentação e unidade. Diferencie conflito clínico, diferença de escopo e erro de transcrição. Não faça média de doses nem aprove por consenso.",
    ].join("\n");
  }
  if (task.stage === "normalization") {
    return [
      "TAREFA: NORMALIZAR RASCUNHOS PARA INTERCÂMBIO, SEM IMPORTAR.",
      `Condição: ${task.conditionName} (${task.conditionRef}).`,
      "Anexe comparações aceitas. Mantenha cada item como draft, valores clínicos separados, afirmações vinculadas a fontes, lacunas e divergências. Não invente tabelas nem IDs de produção.",
    ].join("\n");
  }
  if (task.stage === "validation") {
    return [
      "TAREFA: PLANO DE VALIDAÇÃO ANTES DE QUALQUER PUBLICAÇÃO.",
      `Condição: ${task.conditionName} (${task.conditionRef}).`,
      "Verifique estrutura, fontes, unidades, cálculos, populações, comportamento da interface e contenção. Liste bloqueios e evidências de teste necessárias; não declare segurança ou aprovação.",
    ].join("\n");
  }
  fail(`Etapa não reconhecida: ${task.stage}`);
}

function taskContext(manifest, task) {
  const byId = new Map(manifest.tasks.map((item) => [item.id, item]));
  return {
    run: manifest.run,
    taskId: task.id,
    taskTitle: task.title,
    dependencies: task.dependencies.map((id) => {
      const dependency = byId.get(id);
      return {
        taskId: id,
        status: dependency?.status ?? "missing",
        responseFile: dependency?.responseFile ?? null,
        responseSha256: dependency?.responseSha256 ?? null,
      };
    }),
    instruction: "Anexe os arquivos de resposta aceitos indicados acima quando esta tarefa depender deles. Não use respostas não aceitas como fonte de verdade.",
  };
}

async function materializeTask(directory, manifest, task, contract) {
  const outbox = path.join(directory, "outbox");
  const contextDirectory = path.join(directory, "context");
  await mkdir(outbox, { recursive: true });
  await mkdir(contextDirectory, { recursive: true });
  const prompt = [
    `# Lote ${manifest.run} · tarefa ${task.id}`,
    "",
    contract.trim(),
    "",
    "---",
    "",
    taskInstruction(task),
    "",
    "---",
    "",
    "Metadados da tarefa:",
    `- Categoria: ${task.category ?? "não aplicável"}`,
    `- Condição: ${task.conditionName ?? "não aplicável"}`,
    `- Referência: ${task.conditionRef ?? "não aplicável"}`,
    `- Faixa de pesquisa: ${task.lane ?? "consolidação/validação"}`,
    "- Entregue somente rascunho de pesquisa; o status clínico continua pendente de revisão humana.",
    "",
  ].join("\n");
  await writeFile(path.join(outbox, `${task.id}.md`), prompt, "utf8");
  await writeJson(path.join(contextDirectory, `${task.id}.json`), taskContext(manifest, task));
}

function moduleTasks(condition, category) {
  const tasks = [];
  const categoryTask = `CAT-${slug(category).toUpperCase()}-CONSOLIDAR`;
  const moduleTaskIds = new Map();
  for (const [moduleId, moduleName] of MODULES) {
    const ids = [];
    for (const lane of ["A", "B"]) {
      const id = `COND-${condition.conditionRef}-${moduleId.toUpperCase()}-${lane}`;
      ids.push(id);
      tasks.push(createTask({
        id,
        stage: moduleId,
        title: `${moduleName} — ${condition.name} — pesquisa ${lane}`,
        category,
        conditionRef: condition.conditionRef,
        conditionName: condition.name,
        lane,
        dependencies: [categoryTask],
      }));
    }
    moduleTaskIds.set(moduleId, ids);
  }
  const auditId = `COND-${condition.conditionRef}-AUDIT-C`;
  tasks.push(createTask({
    id: auditId,
    stage: "audit",
    title: `Auditoria independente — ${condition.name}`,
    category,
    conditionRef: condition.conditionRef,
    conditionName: condition.name,
    lane: "C",
    dependencies: [categoryTask],
  }));
  const comparisonIds = [];
  for (const [moduleId, moduleName] of MODULES) {
    const id = `COND-${condition.conditionRef}-${moduleId.toUpperCase()}-COMPARAR`;
    comparisonIds.push(id);
    tasks.push(createTask({
      id,
      stage: "comparison",
      title: `Comparação — ${moduleName} — ${condition.name}`,
      category,
      conditionRef: condition.conditionRef,
      conditionName: condition.name,
      moduleLabel: moduleName,
      dependencies: [...moduleTaskIds.get(moduleId), auditId],
    }));
  }
  const normalizationId = `COND-${condition.conditionRef}-NORMALIZAR`;
  tasks.push(createTask({
    id: normalizationId,
    stage: "normalization",
    title: `Normalização de rascunhos — ${condition.name}`,
    category,
    conditionRef: condition.conditionRef,
    conditionName: condition.name,
    dependencies: comparisonIds,
  }));
  tasks.push(createTask({
    id: `COND-${condition.conditionRef}-VALIDAR`,
    stage: "validation",
    title: `Plano de validação — ${condition.name}`,
    category,
    conditionRef: condition.conditionRef,
    conditionName: condition.name,
    dependencies: [normalizationId],
  }));
  return tasks;
}

function normalizeCatalog(catalog) {
  if (Array.isArray(catalog.conditions)) {
    return catalog.conditions.map((item, index) => ({
      conditionRef: String(item.condition_ref ?? item.conditionRef ?? `COND-${String(index + 1).padStart(3, "0")}`),
      name: String(item.name ?? item.nome ?? ""),
      category: String(item.category ?? item.categoria ?? ""),
    }));
  }
  if (Array.isArray(catalog.categories)) {
    return catalog.categories.flatMap((category) => (category.candidates ?? []).map((name, index) => ({
      conditionRef: candidateRef(category.id, name, index),
      name: String(name),
      category: String(category.id),
    })));
  }
  fail("O catálogo precisa conter conditions[] ou categories[].");
}

function validateConditions(conditions, manifest) {
  const knownCategories = new Set(manifest.catalog.categories.map((item) => item.id));
  const refs = new Set();
  for (const condition of conditions) {
    if (!condition.name || !condition.category || !condition.conditionRef) fail("Condição sem nome, categoria ou referência.");
    if (!knownCategories.has(condition.category)) fail(`Categoria desconhecida para ${condition.name}: ${condition.category}`);
    if (!/^[A-Z0-9][A-Z0-9_-]{2,160}$/.test(condition.conditionRef)) fail(`condition_ref inválido: ${condition.conditionRef}`);
    if (refs.has(condition.conditionRef)) fail(`condition_ref duplicado: ${condition.conditionRef}`);
    refs.add(condition.conditionRef);
  }
}

async function init(options) {
  const name = required(options, "run");
  const directory = runDirectory(name, options);
  try {
    await stat(directory);
    fail(`O lote já existe: ${directory}`);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const catalogFile = path.resolve(options.catalog ? String(options.catalog) : DEFAULT_CATALOG);
  const catalog = await readJson(catalogFile);
  const tasks = catalogTasks(catalog);
  await mkdir(directory, { recursive: true });
  await mkdir(path.join(directory, "responses"), { recursive: true });
  await cp(catalogFile, path.join(directory, "catalogo-candidato.json"));
  const manifest = {
    schemaVersion: "prescrimed-curadoria-loop-1.0",
    run: name,
    createdAt: now(),
    updatedAt: now(),
    mode: "draft_research_only",
    publicationAllowed: false,
    catalog,
    catalogStatus: "candidate_terms_pending_human_review",
    expandedFrom: null,
    tasks,
    events: [{ at: now(), type: "initialized", detail: `${tasks.length} tarefas de descoberta e consolidação criadas.` }],
  };
  await saveManifest(directory, manifest);
  process.stdout.write(JSON.stringify({ run: name, directory, tasks: tasks.length, publicationAllowed: false }, null, 2));
}

async function next(options) {
  const name = required(options, "run");
  const directory = runDirectory(name, options);
  const manifest = await loadManifest(directory);
  const requested = Number(options.count ?? 1);
  if (!Number.isInteger(requested) || requested < 1 || requested > MAX_LEASE_COUNT) fail(`--count deve estar entre 1 e ${MAX_LEASE_COUNT}.`);
  const contract = await loadContract();
  const selected = manifest.tasks
    .filter((task) => task.status === "pending" && dependenciesAccepted(manifest, task))
    .slice(0, requested);
  for (const task of selected) {
    task.status = "leased";
    task.leasedAt = now();
    task.attempts += 1;
    await materializeTask(directory, manifest, task, contract);
  }
  manifest.events.push({ at: now(), type: "leased", detail: `${selected.length} tarefa(s) materializada(s).`, taskIds: selected.map((task) => task.id) });
  await saveManifest(directory, manifest);
  process.stdout.write(JSON.stringify({ run: name, leased: selected.map((task) => ({ id: task.id, prompt: `outbox/${task.id}.md`, context: `context/${task.id}.json` })), waitingForReview: selected.length === 0 }, null, 2));
}

async function ingest(options) {
  const name = required(options, "run");
  const id = taskId(required(options, "task"));
  const source = path.resolve(required(options, "file"));
  const directory = runDirectory(name, options);
  const manifest = await loadManifest(directory);
  const task = manifest.tasks.find((item) => item.id === id);
  if (!task) fail(`Tarefa não encontrada: ${id}`);
  if (task.status !== "leased") fail(`A tarefa ${id} está em ${task.status}; só respostas de tarefas leased podem ser recebidas.`);
  const info = await stat(source);
  if (!info.isFile() || info.size > MAX_RESPONSE_BYTES) fail("A resposta deve ser um arquivo regular de até 16 MiB.");
  const buffer = await readFile(source);
  const extension = path.extname(source).toLowerCase();
  if (![".md", ".txt", ".json"].includes(extension)) fail("A resposta deve ser .md, .txt ou .json.");
  const relative = path.join("responses", `${task.id}-${sha256(buffer).slice(0, 12)}${extension}`);
  await writeFile(path.join(directory, relative), buffer);
  task.status = "submitted";
  task.submittedAt = now();
  task.responseFile = relative.replaceAll("\\", "/");
  task.responseSha256 = sha256(buffer);
  manifest.events.push({ at: now(), type: "response_received", taskId: task.id, responseFile: task.responseFile, sha256: task.responseSha256 });
  await saveManifest(directory, manifest);
  process.stdout.write(JSON.stringify({ run: name, task: id, status: task.status, responseFile: task.responseFile }, null, 2));
}

async function review(options) {
  const name = required(options, "run");
  const id = taskId(required(options, "task"));
  const decision = required(options, "decision");
  const reviewer = required(options, "reviewer").trim();
  if (!reviewer) fail("Informe um identificador real do revisor.");
  if (!["accept", "reject", "block"].includes(decision)) fail("--decision deve ser accept, reject ou block.");
  const directory = runDirectory(name, options);
  const manifest = await loadManifest(directory);
  const task = manifest.tasks.find((item) => item.id === id);
  if (!task) fail(`Tarefa não encontrada: ${id}`);
  if (task.status !== "submitted") fail(`A tarefa ${id} está em ${task.status}; somente tarefas submitted podem ser revisadas.`);
  task.status = decision === "accept" ? "accepted" : decision === "reject" ? "rejected" : "blocked";
  task.reviewer = reviewer;
  task.reviewedAt = now();
  task.decisionNote = options.note && options.note !== true ? String(options.note) : null;
  manifest.events.push({ at: now(), type: "reviewed", taskId: id, decision, reviewer });
  await saveManifest(directory, manifest);
  process.stdout.write(JSON.stringify({ run: name, task: id, status: task.status, publicationAllowed: false }, null, 2));
}

async function expand(options) {
  const name = required(options, "run");
  const catalogFile = path.resolve(required(options, "catalog"));
  const directory = runDirectory(name, options);
  const manifest = await loadManifest(directory);
  if (manifest.expandedFrom) fail("Este lote já foi expandido; crie outro lote para um novo catálogo.");
  const catalog = await readJson(catalogFile);
  if (catalog.status === "candidate_terms_from_product_material" && options["allow-candidate-terms"] !== true) {
    fail("O catálogo é apenas candidato. Para gerar tarefas de rascunho a partir dele, confirme explicitamente --allow-candidate-terms.");
  }
  const conditions = normalizeCatalog(catalog);
  validateConditions(conditions, manifest);
  const existing = new Set(manifest.tasks.map((task) => task.id));
  const newTasks = conditions.flatMap((condition) => moduleTasks(condition, condition.category));
  for (const task of newTasks) if (existing.has(task.id)) fail(`Colisão de ID de tarefa: ${task.id}`);
  await cp(catalogFile, path.join(directory, "catalogo-expandido.json"));
  manifest.tasks.push(...newTasks);
  manifest.expandedFrom = {
    file: "catalogo-expandido.json",
    status: catalog.status ?? "human_reviewed_catalog_not_declared",
    conditionCount: conditions.length,
    expandedAt: now(),
  };
  manifest.events.push({ at: now(), type: "expanded", detail: `${conditions.length} condições e ${newTasks.length} tarefas adicionadas.`, source: manifest.expandedFrom.file });
  await saveManifest(directory, manifest);
  process.stdout.write(JSON.stringify({ run: name, conditions: conditions.length, tasksAdded: newTasks.length, totalTasks: manifest.tasks.length, publicationAllowed: false }, null, 2));
}

async function status(options) {
  const name = required(options, "run");
  const directory = runDirectory(name, options);
  const manifest = await loadManifest(directory);
  const byStatus = {};
  const byStage = {};
  for (const task of manifest.tasks) {
    byStatus[task.status] = (byStatus[task.status] ?? 0) + 1;
    byStage[task.stage] = (byStage[task.stage] ?? 0) + 1;
  }
  const ready = manifest.tasks.filter((task) => task.status === "pending" && dependenciesAccepted(manifest, task)).map((task) => task.id);
  const blockedByDependencies = manifest.tasks.filter((task) => task.status === "pending" && !dependenciesAccepted(manifest, task)).length;
  process.stdout.write(JSON.stringify({
    run: manifest.run,
    mode: manifest.mode,
    publicationAllowed: manifest.publicationAllowed,
    catalogStatus: manifest.catalogStatus,
    expandedFrom: manifest.expandedFrom,
    totalTasks: manifest.tasks.length,
    byStatus,
    byStage,
    ready: ready.slice(0, MAX_LEASE_COUNT),
    readyCount: ready.length,
    blockedByDependencies,
  }, null, 2));
}

async function selfTest() {
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "prescrimed-curadoria-loop-"));
  try {
    const options = { run: "self-test", "runs-root": temporaryRoot };
    await init(options);
    const directory = runDirectory("self-test", options);
    let manifest = await loadManifest(directory);
    if (manifest.tasks.length !== 48) fail("Self-test: quantidade inicial de tarefas inesperada.");
    await next({ ...options, count: "2" });
    manifest = await loadManifest(directory);
    const leased = manifest.tasks.filter((task) => task.status === "leased");
    if (leased.length !== 2) fail("Self-test: tarefas não materializadas.");
    const response = path.join(temporaryRoot, "response.md");
    await writeFile(response, "# Resposta sintética\n\nRascunho sem conteúdo clínico.\n", "utf8");
    await ingest({ ...options, task: leased[0].id, file: response });
    await review({ ...options, task: leased[0].id, decision: "accept", reviewer: "teste-automatizado" });
    manifest = await loadManifest(directory);
    if (manifest.tasks.find((task) => task.id === leased[0].id)?.status !== "accepted") fail("Self-test: revisão não aplicada.");
    process.stdout.write(JSON.stringify({ selfTest: "ok", initialTasks: 48, publicationAllowed: manifest.publicationAllowed }, null, 2));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

function help() {
  process.stdout.write(`Uso:\n  npm run curadoria:loop -- init --run <lote>\n  npm run curadoria:loop -- next --run <lote> [--count 1..20]\n  npm run curadoria:loop -- ingest --run <lote> --task <id> --file <resposta.md|txt|json>\n  npm run curadoria:loop -- review --run <lote> --task <id> --decision <accept|reject|block> --reviewer <id-real> [--note <texto>]\n  npm run curadoria:loop -- expand --run <lote> --catalog <catalogo.json> [--allow-candidate-terms]\n  npm run curadoria:loop -- status --run <lote>\n  npm run curadoria:loop:self-test\n`);
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || command === "help" || command === "--help") return help();
  if (command === "init") return init(options);
  if (command === "next") return next(options);
  if (command === "ingest") return ingest(options);
  if (command === "review") return review(options);
  if (command === "expand") return expand(options);
  if (command === "status") return status(options);
  if (command === "self-test") return selfTest();
  fail(`Comando desconhecido: ${command}`);
}

main().catch((error) => {
  process.stderr.write(`Erro: ${error.message}\n`);
  process.exitCode = 1;
});
