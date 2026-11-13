#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/046f93c849a6dd56cf7e425b8e5be06b28a53df2129025d265f8d51fae6dcb14/contract';
import endContract from '../../snapshots/046f93c849a6dd56cf7e425b8e5be06b28a53df2129025d265f8d51fae6dcb14/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/eb50bbea0d0b63e5d34c4c25983ea1ddf90ffc736cfe8ca7ba212bdd92646167/contract';
import startContract from '../../snapshots/eb50bbea0d0b63e5d34c4c25983ea1ddf90ffc736cfe8ca7ba212bdd92646167/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'passwordReset',
        columns: [
          col('attempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('challengeId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('otpHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('passwordHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('requestCount', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('requestWindowStart', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('requestedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-temporal@1' },
          }),
          col('resetTokenHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('usedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('verifiedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-temporal@1' } }),
        ],
        constraints: [primaryKey(['userId'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('sessionVersion', 'int4', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'passwordReset',
        constraint: 'passwordReset_challengeId_key',
        columns: ['challengeId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'passwordReset',
        foreignKey: {
          name: 'passwordReset_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
