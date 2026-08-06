import fs from 'fs';
import path from 'path';
import { EmailRecord, ResendAccount, DomainRecord, User } from '../types';

interface DBData {
  users: User[];
  emails: EmailRecord[];
  customAccounts: ResendAccount[];
  domains: DomainRecord[];
  webhooks: any[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const INITIAL_USERS: User[] = [
  {
    id: 'user_demo',
    email: 'admin@resend-webui.com',
    name: 'Admin User',
    password: 'password123',
    createdAt: '2026-08-06T00:00:00Z',
  },
];

const INITIAL_EMAILS: EmailRecord[] = [
  // INBOUND RECEIVED MESSAGES (INBOX)
  {
    id: 'inbound_1',
    resendId: 'msg_inbound_101',
    userId: 'user_demo',
    accountId: 'aasim-shah',
    accountName: 'Aasim Shah',
    from: 'Syed Asim <client@example.com>',
    to: 'contact@aasimshah.com',
    subject: 'Inquiry regarding software development services',
    text: 'Hi Aasim, I saw your portfolio and would like to schedule a call to discuss a web app project.',
    html: '<p>Hi Aasim,</p><p>I saw your portfolio and would like to schedule a call to discuss a web app project.</p><p>Best,<br/>Syed Asim</p>',
    status: 'delivered',
    sentAt: '2026-08-06T10:15:00Z',
    direction: 'inbound',
  },
  {
    id: 'inbound_2',
    resendId: 'msg_inbound_102',
    userId: 'user_demo',
    accountId: 'corebyte-studio',
    accountName: 'CoreByte Studio',
    from: 'Restaurant Client <leads@restaurant.com>',
    to: 'info@corebytestudio.com',
    subject: 'Requesting custom quotation for POS Integration',
    text: 'Hello CoreByte Studio team, We are interested in your software solutions for our 3 restaurant branches.',
    html: '<p>Hello CoreByte Studio team,</p><p>We are interested in your software solutions for our 3 restaurant branches.</p>',
    status: 'opened',
    sentAt: '2026-08-06T09:45:00Z',
    direction: 'inbound',
  },
  {
    id: 'inbound_3',
    resendId: 'msg_inbound_103',
    userId: 'user_demo',
    accountId: 'feedwink',
    accountName: 'FeedWink',
    from: 'Partner Contact <contact@partner.ca>',
    to: 'sales@feedwink.com',
    subject: 'Feedback platform partnership inquiry',
    text: 'Hi FeedWink team, Would love to integrate FeedWink widget into our SaaS dashboard.',
    html: '<p>Hi FeedWink team,</p><p>Would love to integrate FeedWink widget into our SaaS dashboard.</p>',
    status: 'delivered',
    sentAt: '2026-08-05T16:20:00Z',
    direction: 'inbound',
  },

  // OUTBOUND SENT MESSAGES (SENT)
  {
    id: 'outbound_1',
    resendId: 'msg_outbound_201',
    userId: 'user_demo',
    accountId: 'corebyte-studio',
    accountName: 'CoreByte Studio',
    from: 'CoreByte Studio <info@corebytestudio.com>',
    to: 'contact@aasimshah.com',
    subject: 'Important announcement',
    text: 'Writing to follow up regarding our recent project updates.',
    html: '<p>Writing to follow up regarding our recent project updates.</p>',
    status: 'sent',
    sentAt: '2026-08-06T13:12:00Z',
    direction: 'outbound',
  },
  {
    id: 'outbound_2',
    resendId: 'msg_outbound_202',
    userId: 'user_demo',
    accountId: 'corebyte-studio',
    accountName: 'CoreByte Studio',
    from: 'CoreByte Studio <info@corebytestudio.com>',
    to: 'asimshah8110@gmail.com',
    subject: 'Important-update',
    text: 'Just checking in regarding project deliverables.',
    html: '<p>Just checking in regarding project deliverables.</p>',
    status: 'delivered',
    sentAt: '2026-08-06T12:35:00Z',
    direction: 'outbound',
  },
  {
    id: 'outbound_3',
    resendId: 'msg_outbound_203',
    userId: 'user_demo',
    accountId: 'aasim-shah',
    accountName: 'Aasim Shah',
    from: 'Aasim Shah <contact@aasimshah.com>',
    to: 'client@example.com',
    subject: 'Follow up on our recent discussion',
    text: 'Hi there, Just checking in regarding our recent project updates. Best regards, Aasim',
    html: '<p>Hi there,</p><p>Just checking in regarding our recent project updates.</p><p>Best regards,<br/>Aasim</p>',
    status: 'opened',
    sentAt: '2026-08-06T10:31:00Z',
    direction: 'outbound',
  },
  {
    id: 'outbound_4',
    resendId: 'msg_outbound_204',
    userId: 'user_demo',
    accountId: 'feedwink',
    accountName: 'FeedWink',
    from: 'FeedWink <sales@feedwink.com>',
    to: 'contact@partner.ca',
    subject: 'Introducing FeedWink Restaurant Feedback Platform',
    text: 'Hi team, Boost your customer retention with instant feedback widgets.',
    html: '<p>Hi team,</p><p>Boost your customer retention with instant feedback widgets.</p>',
    status: 'sent',
    sentAt: '2026-08-06T12:31:00Z',
    direction: 'outbound',
  },
];

function ensureDirExists(filePath: string) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
}

export function readDB(): DBData {
  ensureDirExists(DB_PATH);
  if (!fs.existsSync(DB_PATH)) {
    const initialData: DBData = {
      users: INITIAL_USERS,
      emails: INITIAL_EMAILS,
      customAccounts: [],
      domains: [],
      webhooks: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(content);
    if (!data.users) data.users = INITIAL_USERS;
    if (!data.emails || data.emails.length === 0) data.emails = INITIAL_EMAILS;
    return data;
  } catch (e) {
    console.error('Error reading db.json, reinitializing:', e);
    const initialData: DBData = {
      users: INITIAL_USERS,
      emails: INITIAL_EMAILS,
      customAccounts: [],
      domains: [],
      webhooks: [],
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

export const readDb = readDB;

export function writeDB(data: DBData): void {
  ensureDirExists(DB_PATH);
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

export function getEmailRecords(filter?: string | { accountId?: string; status?: string; query?: string; userId?: string }): EmailRecord[] {
  const db = readDB();
  let list = db.emails || [];

  if (!filter) return list;

  if (typeof filter === 'string') {
    if (filter && filter !== 'all') {
      return list.filter((e) => e.accountId === filter);
    }
    return list;
  }

  const { accountId, status, query, userId } = filter;

  if (userId) {
    list = list.filter((e) => !e.userId || e.userId === userId);
  }

  if (accountId && accountId !== 'all') {
    list = list.filter((e) => e.accountId === accountId);
  }
  if (status && status !== 'all') {
    list = list.filter((e) => e.status === status);
  }
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(
      (e) =>
        e.subject.toLowerCase().includes(q) ||
        e.from.toLowerCase().includes(q) ||
        (typeof e.to === 'string' ? e.to.toLowerCase().includes(q) : e.to.some((t) => t.toLowerCase().includes(q)))
    );
  }

  return list;
}

export function saveEmailRecord(email: EmailRecord): void {
  const db = readDB();
  if (!email.direction) {
    email.direction = 'outbound';
  }
  db.emails.unshift(email);
  writeDB(db);
}

export function findUserByEmail(email: string): User | undefined {
  const db = readDB();
  return (db.users || []).find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function createUser(email: string, password: string, name: string): User {
  const db = readDB();
  const newUser: User = {
    id: `usr_${Date.now()}`,
    email,
    name,
    password,
    createdAt: new Date().toISOString(),
  };
  if (!db.users) db.users = [];
  db.users.push(newUser);
  writeDB(db);
  return newUser;
}

export function saveCustomAccount(account: ResendAccount): void {
  const db = readDB();
  if (!db.customAccounts) db.customAccounts = [];
  db.customAccounts.push(account);
  writeDB(db);
}

export function deleteCustomAccount(id: string): void {
  const db = readDB();
  db.customAccounts = db.customAccounts.filter((a) => a.id !== id);
  writeDB(db);
}

export function saveWebhookEvent(event: any): void {
  const db = readDB();
  db.webhooks.unshift({ ...event, id: `wh_${Date.now()}` });
  writeDB(db);
}
