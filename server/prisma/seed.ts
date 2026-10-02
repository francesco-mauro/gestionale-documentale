import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import bcrypt from 'bcryptjs';
import { paths } from '../src/config.js';
import { prisma } from '../src/db.js';
import type { DocumentType, PracticeStatus, PracticeType, Role } from '../src/lists.js';

// Dati di esempio per provare subito il gestionale: 3 utenti (uno per ruolo), 5 clienti,
// 8 pratiche, 8 documenti con file veri (uno nel cestino) e le relative righe nel registro attività.
// Si lancia con: npm run db:seed -w server
// Se il database contiene già utenti non fa nulla, per non cancellare dati veri per sbaglio.
// Per svuotarlo e ricaricare gli esempi: SEED_RESET=1 npm run db:seed -w server

export const SEED_PASSWORD = 'password123';

const seedFilesDir = fileURLToPath(new URL('./seed-files/', import.meta.url));

export async function runSeed({ reset }: { reset: boolean }): Promise<'seeded' | 'skipped'> {
  if ((await prisma.user.count()) > 0) {
    if (!reset) return 'skipped';
    await clearAll();
  }
  const users = await createUsers();
  const clients = await createClients(users);
  const practices = await createPractices(clients, users);
  await createDocuments(practices, users);
  return 'seeded';
}

// Svuota tutte le tabelle, nell'ordine giusto per i vincoli tra tabelle,
// e rimuove dal disco solo i file dei documenti registrati nel database.
async function clearAll() {
  for (const doc of await prisma.document.findMany()) {
    fs.rmSync(path.join(paths.uploadDir, doc.storedName), { force: true });
  }
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.practice.deleteMany();
  await prisma.client.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
}

type SeedUser = { id: number };
type Users = { admin: SeedUser; operator: SeedUser; seller: SeedUser };

async function createUsers(): Promise<Users> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const create = (name: string, email: string, role: Role) =>
    prisma.user.create({ data: { name, email, passwordHash, role } });
  return {
    admin: await create('Anna Ferrari', 'admin@esempio.it', 'ADMIN'),
    operator: await create('Luca Bianchi', 'operatore@esempio.it', 'OPERATOR'),
    seller: await create('Marco Colombo', 'venditore@esempio.it', 'SELLER'),
  };
}

// Campi comuni a clienti, pratiche e documenti: chi ha creato il record e se è confermato.
// I record creati da Admin e Operatore nascono confermati; quelli del Venditore no.
function ownership(by: SeedUser, confirmed: boolean, when: string) {
  return {
    createdById: by.id,
    confirmedById: confirmed ? by.id : null,
    confirmedAt: confirmed ? new Date(when) : null,
  };
}

async function createClients(u: Users) {
  const create = (data: Parameters<typeof prisma.client.create>[0]['data']) =>
    prisma.client.create({ data });
  return {
    rossi: await create({
      name: 'Rossi Mario',
      phone: '333 1234567',
      email: 'mario.rossi@esempio.it',
      address: 'Via Garibaldi 12, Bergamo',
      notes: 'Preferisce essere contattato al pomeriggio.',
      ...ownership(u.operator, true, '2026-02-10'),
    }),
    condominio: await create({
      name: 'Condominio Via Roma 8',
      phone: '035 123456',
      email: 'amministratore@esempio.it',
      address: 'Via Roma 8, Bergamo',
      notes: 'Amministratore: Studio Neri. Decisioni in assemblea.',
      ...ownership(u.operator, true, '2026-04-15'),
    }),
    bar: await create({
      name: 'Bar Centrale di Bianchi Anna',
      phone: '035 654321',
      address: 'Piazza Matteotti 3, Treviglio',
      ...ownership(u.admin, true, '2026-06-20'),
    }),
    verdi: await create({
      name: 'Impresa Edile Verdi Srl',
      phone: '035 987654',
      email: 'info@verdi-esempio.it',
      address: "Via dell'Industria 22, Dalmine",
      notes: 'Cantieri multipli. Fatturare a fine mese.',
      ...ownership(u.operator, true, '2026-01-12'),
    }),
    // Cliente proposto dal venditore: resta "da confermare" finché un operatore non lo conferma.
    esposito: await create({
      name: 'Esposito Giulia',
      phone: '340 7654321',
      address: 'Via Manzoni 5, Seriate',
      notes: 'Contatto preso in fiera, da richiamare.',
      ...ownership(u.seller, false, ''),
    }),
  };
}

type Clients = Awaited<ReturnType<typeof createClients>>;

type PracticeSeed = {
  client: SeedUser;
  type: PracticeType;
  status: PracticeStatus;
  openedAt: string;
  siteAddress: string;
  notes: string;
  by: SeedUser;
  confirmed: boolean;
};

async function createPractices(c: Clients, u: Users) {
  const rows: PracticeSeed[] = [
    {
      client: c.rossi,
      type: 'preventivo',
      status: 'chiusa',
      openedAt: '2026-02-10',
      siteAddress: 'Via Garibaldi 12, Bergamo',
      notes: '4 finestre in PVC bianco, vetro doppio.',
      by: u.operator,
      confirmed: true,
    },
    {
      client: c.rossi,
      type: 'ordine',
      status: 'in corso',
      openedAt: '2026-03-05',
      siteAddress: 'Via Garibaldi 12, Bergamo',
      notes: 'Ordine confermato, consegna prevista ad aprile.',
      by: u.operator,
      confirmed: true,
    },
    {
      client: c.condominio,
      type: 'installazione',
      status: 'in corso',
      openedAt: '2026-04-15',
      siteAddress: 'Via Roma 8, Bergamo',
      notes: "Sostituzione del portone d'ingresso e di 12 finestre delle scale.",
      by: u.operator,
      confirmed: true,
    },
    {
      client: c.condominio,
      type: 'detrazioni fiscali',
      status: 'aperta',
      openedAt: '2026-05-02',
      siteAddress: 'Via Roma 8, Bergamo',
      notes: 'Pratica ENEA per il bonus infissi.',
      by: u.admin,
      confirmed: true,
    },
    {
      client: c.bar,
      type: 'preventivo',
      status: 'aperta',
      openedAt: '2026-06-20',
      siteAddress: 'Piazza Matteotti 3, Treviglio',
      notes: "Vetrina e porta d'ingresso.",
      by: u.operator,
      confirmed: true,
    },
    {
      client: c.verdi,
      type: 'ordine',
      status: 'in corso',
      openedAt: '2026-07-08',
      siteAddress: 'Cantiere Via Verdi 40, Dalmine',
      notes: '20 finestre per palazzina nuova.',
      by: u.operator,
      confirmed: true,
    },
    {
      client: c.verdi,
      type: 'installazione',
      status: 'chiusa',
      openedAt: '2026-01-12',
      siteAddress: 'Cantiere Via Mazzini 3, Dalmine',
      notes: 'Lavoro concluso, in attesa del saldo.',
      by: u.admin,
      confirmed: true,
    },
    // Pratica proposta dal venditore sul cliente proposto dal venditore.
    {
      client: c.esposito,
      type: 'preventivo',
      status: 'aperta',
      openedAt: '2026-09-20',
      siteAddress: 'Via Manzoni 5, Seriate',
      notes: 'Porta blindata e 2 finestre.',
      by: u.seller,
      confirmed: false,
    },
  ];
  const created = [];
  for (const r of rows) {
    created.push(
      await prisma.practice.create({
        data: {
          clientId: r.client.id,
          type: r.type,
          status: r.status,
          openedAt: new Date(r.openedAt),
          siteAddress: r.siteAddress,
          notes: r.notes,
          ...ownership(r.by, r.confirmed, r.openedAt),
        },
      }),
    );
  }
  return created;
}

type Practices = Awaited<ReturnType<typeof createPractices>>;

type DocumentSeed = {
  practice: SeedUser;
  type: DocumentType;
  file: string;
  originalName: string;
  documentDate: string;
  notes: string;
  by: SeedUser;
  confirmed: boolean;
};

const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.png': 'image/png',
};

async function createDocuments(p: Practices, u: Users) {
  const rows: DocumentSeed[] = [
    {
      practice: p[0]!,
      type: 'preventivo',
      file: 'preventivo.pdf',
      originalName: 'Preventivo 2026-014.pdf',
      documentDate: '2026-02-12',
      notes: 'Prima versione inviata al cliente.',
      by: u.operator,
      confirmed: true,
    },
    {
      practice: p[1]!,
      type: 'contratto',
      file: 'contratto.pdf',
      originalName: 'Contratto Rossi firmato.pdf',
      documentDate: '2026-03-05',
      notes: '',
      by: u.operator,
      confirmed: true,
    },
    {
      practice: p[1]!,
      type: 'ordine al fornitore',
      file: 'ordine-fornitore.pdf',
      originalName: 'Ordine fornitore 118.pdf',
      documentDate: '2026-03-07',
      notes: 'Serramenti Alfa Srl.',
      by: u.operator,
      confirmed: true,
    },
    {
      practice: p[2]!,
      type: 'foto del cantiere',
      file: 'foto-cantiere-prima.png',
      originalName: 'Foto ingresso prima dei lavori.png',
      documentDate: '2026-04-15',
      notes: 'Stato prima dei lavori.',
      by: u.seller,
      confirmed: false,
    },
    {
      practice: p[3]!,
      type: 'pratica ENEA',
      file: 'pratica-enea.pdf',
      originalName: 'Ricevuta ENEA condominio.pdf',
      documentDate: '2026-05-15',
      notes: '',
      by: u.admin,
      confirmed: true,
    },
    {
      practice: p[5]!,
      type: 'scheda tecnica',
      file: 'scheda-tecnica.pdf',
      originalName: 'Scheda tecnica finestra PVC Comfort.pdf',
      documentDate: '2026-07-10',
      notes: '',
      by: u.operator,
      confirmed: true,
    },
    {
      practice: p[6]!,
      type: 'fattura',
      file: 'fattura.pdf',
      originalName: 'Fattura 2026-031.pdf',
      documentDate: '2026-02-28',
      notes: 'Saldo lavori.',
      by: u.admin,
      confirmed: true,
    },
  ];
  for (const r of rows) await addDocument(r);

  // Un documento finito nel cestino, per provare il ripristino.
  const trashed = await addDocument({
    practice: p[6]!,
    type: 'foto del cantiere',
    file: 'foto-cantiere-dopo.png',
    originalName: 'Foto lavoro finito (doppione).png',
    documentDate: '2026-02-20',
    notes: 'Caricata due volte per errore.',
    by: u.operator,
    confirmed: true,
  });
  await prisma.document.update({
    where: { id: trashed.id },
    data: { deletedAt: new Date('2026-03-01'), deletedById: u.admin.id },
  });
  await prisma.auditLog.create({
    data: {
      userId: u.admin.id,
      action: 'DELETE',
      entityType: 'DOCUMENT',
      entityId: trashed.id,
      summary: `Ha spostato nel cestino "${trashed.originalName}"`,
      createdAt: new Date('2026-03-01'),
    },
  });
}

// Copia il file di esempio nella cartella uploads con un nome casuale e registra il documento,
// esattamente come farà il caricamento vero dalla fase 5.
async function addDocument(r: DocumentSeed) {
  const extension = path.extname(r.file);
  const storedName = `${randomUUID()}${extension}`;
  const source = path.join(seedFilesDir, r.file);
  fs.mkdirSync(paths.uploadDir, { recursive: true });
  fs.copyFileSync(source, path.join(paths.uploadDir, storedName));

  const doc = await prisma.document.create({
    data: {
      practiceId: r.practice.id,
      type: r.type,
      originalName: r.originalName,
      storedName,
      mimeType: MIME_BY_EXTENSION[extension] ?? 'application/octet-stream',
      sizeBytes: fs.statSync(source).size,
      documentDate: new Date(r.documentDate),
      notes: r.notes,
      uploadedById: r.by.id,
      confirmedById: r.confirmed ? r.by.id : null,
      confirmedAt: r.confirmed ? new Date(r.documentDate) : null,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: r.by.id,
      action: 'CREATE',
      entityType: 'DOCUMENT',
      entityId: doc.id,
      summary: `Ha caricato "${doc.originalName}" nella pratica n. ${doc.practiceId}`,
      createdAt: doc.documentDate,
    },
  });
  return doc;
}

// Eseguito solo quando il file viene lanciato direttamente (npm run db:seed),
// non quando viene importato dai test.
const runDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (runDirectly) {
  const result = await runSeed({ reset: process.env.SEED_RESET === '1' });
  if (result === 'skipped') {
    console.log(
      'Il database contiene già dati: seed saltato. Per svuotarlo e ricaricare gli esempi: SEED_RESET=1 npm run db:seed -w server',
    );
  } else {
    console.log(
      `Dati di esempio caricati. Accedi con admin@esempio.it / ${SEED_PASSWORD} (stessa password per operatore@esempio.it e venditore@esempio.it).`,
    );
  }
  await prisma.$disconnect();
}
