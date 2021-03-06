import { Database as SqliteDatabase } from 'better-sqlite3';
import { ILogEntry } from '@secret-agent/commons/Logger';
import BaseTable from '../lib/BaseTable';

export default class SessionLogsTable extends BaseTable<ISessionLogRecord> {
  constructor(readonly db: SqliteDatabase) {
    super(db, 'SessionLogs', [
      ['id', 'INTEGER'],
      ['timestamp', 'TEXT'],
      ['action', 'TEXT'],
      ['level', 'TEXT'],
      ['module', 'TEXT'],
      ['isGlobal', 'INTEGER'],
      ['parentId', 'INTEGER'],
      ['data', 'TEXT'],
    ]);
  }

  public insert(log: ILogEntry) {
    if (log.data instanceof Error) {
      log.data = {
        stack: log.data.stack,
        ...log.data,
      };
    }
    const data = log.data ? JSON.stringify(log.data) : null;
    return this.queuePendingInsert([
      log.id,
      log.timestamp.toISOString(),
      log.action,
      log.level,
      log.module,
      log.sessionId !== null ? 0 : 1,
      log.parentId,
      data,
    ]);
  }

  public allErrors() {
    return this.db
      .prepare(`select * from ${this.tableName} where level = 'error'`)
      .all() as ISessionLogRecord[];
  }
}

export interface ISessionLogRecord {
  id: number;
  timestamp: string;
  action: string;
  level: string;
  module: string;
  isGlobal?: boolean;
  parentId?: number;
  data?: any;
}
