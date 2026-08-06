import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ResendAccount } from '../types';
import { readDb } from '../db/store';

function parseEnvFile(filename: string): Record<string, string> {
  const filePath = path.join(/*turbopackIgnore: true*/ process.cwd(), filename);
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  return dotenv.parse(content);
}

export function getAllAccounts(userId?: string): ResendAccount[] {
  const accounts: ResendAccount[] = [];
  const db = readDb();

  const currentUser = userId ? (db.users || []).find((u) => u.id === userId) : undefined;
  const isDefaultAdmin =
    !userId ||
    userId === 'user_demo' ||
    userId === 'user_aasim' ||
    currentUser?.email.toLowerCase() === 'contact@aasimshah.com' ||
    currentUser?.email.toLowerCase() === 'admin@resend-webui.com';

  // 1. Primary .env profiles (ONLY included for admin/owner workspace)
  if (isDefaultAdmin) {
    const defaultEnv = parseEnvFile('.env');
    const apiKey1 = process.env.RESEND_API_KEY || defaultEnv.RESEND_API_KEY;
    if (apiKey1) {
      accounts.push({
        id: 'aasim-shah',
        userId: userId || 'user_demo',
        name: 'Aasim Shah',
        apiKey: apiKey1,
        fromEmail: process.env.FROM_EMAIL || defaultEnv.FROM_EMAIL || 'contact@aasimshah.com',
        fromName: process.env.FROM_NAME || defaultEnv.FROM_NAME || 'Aasim Shah',
        isDefault: true,
        source: 'env',
      });
    }

    const corebyteEnv = parseEnvFile('.env.corebyte');
    const apiKey2 = corebyteEnv.RESEND_API_KEY;
    if (apiKey2) {
      accounts.push({
        id: 'corebyte-studio',
        userId: userId || 'user_demo',
        name: 'CoreByte Studio',
        apiKey: apiKey2,
        fromEmail: corebyteEnv.FROM_EMAIL || 'info@corebytestudio.com',
        fromName: corebyteEnv.FROM_NAME || 'CoreByte Studio',
        isDefault: false,
        source: 'env.corebyte',
      });
    }

    const feedwinkEnv = parseEnvFile('.env.feedwink');
    const apiKey3 = feedwinkEnv.RESEND_API_KEY;
    if (apiKey3) {
      accounts.push({
        id: 'feedwink',
        userId: userId || 'user_demo',
        name: 'FeedWink',
        apiKey: apiKey3,
        fromEmail: feedwinkEnv.FROM_EMAIL || 'sales@feedwink.com',
        fromName: feedwinkEnv.FROM_NAME || 'FeedWink',
        isDefault: false,
        source: 'env.feedwink',
      });
    }
  }

  // 2. Custom accounts stored in database strictly for this userId
  if (db.customAccounts && db.customAccounts.length > 0) {
    for (const customAcc of db.customAccounts) {
      if (userId) {
        if (customAcc.userId === userId && !accounts.some((a) => a.id === customAcc.id)) {
          accounts.push(customAcc);
        }
      } else {
        if (!accounts.some((a) => a.id === customAcc.id)) {
          accounts.push(customAcc);
        }
      }
    }
  }

  return accounts;
}

export function getAccountById(id: string, userId?: string): ResendAccount | undefined {
  const accounts = getAllAccounts(userId);
  return accounts.find((a) => a.id === id);
}
