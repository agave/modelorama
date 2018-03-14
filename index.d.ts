import type { GrownInterface, GrownInstance } from '@grown/bud';
import type { DatabaseConfig } from '@grown/model';
import { JSONSchema4 } from 'json-schema';

export { Request, Connection } from '@grown/server';
export { GrownInstance } from '@grown/bud';
export { MailorTemplate } from 'mailor';
export * from '@grown/model';

import '@grown/static';
import '@grown/upload';
import '@grown/session';
import '@grown/graphql';
import '@grown/grpc';
import '@grown/router';
import '@grown/render';
import '@grown/conn';
import '@grown/test';

interface ModelsConfig {
  config: DatabaseConfig;
  models?: string;
  types?: string;
  hooks?: string;
  refs?: JSONSchema4[];
}

export interface Modelorama<Server> {
  main(cwd?: string): Promise<void>;
  exec(cwd?: string): Promise<void>;
  connect<DB>(opts?: ModelsConfig): DB;
  getInstance(cwd?: string): Server;
}

export interface ServicesInterface {
  close(): void;
}

export interface Application extends GrownInterface {
  Services: ServicesInterface;
  startApp(): Promise<GrownInstance>;
}

declare const _default: any;
export default _default;
