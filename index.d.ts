import type { GRPCInterface } from '@grown/grpc';
import type { GrownInterface } from '@grown/bud';
import type { Repository, DatabaseConfig } from '@grown/model';
import type { Request } from '@grown/server';
import { JSONSchema4 } from 'json-schema';

export { GrownInstance, GrownInterface } from '@grown/bud';
export { GRPCService } from '@grown/grpc';
export * from '@grown/model';

import '@grown/server';

interface ModelsConfig {
  config: DatabaseConfig;
  models?: string;
  types?: string;
  hooks?: string;
  refs?: JSONSchema4[];
}

export interface Modelorama {
  setup<DB>(fn: (Grown: GrownInterface) => void): (opts: ModelsConfig) => (Grown: GrownInterface) => Promise<Repository<DB>>;
}

export interface ModeloramaServices extends GRPCInterface {
}

export interface ModeloramaApplication extends GrownInterface {
}

export interface Auth<P> {
  input: this;
  session: this;
  (req: Request, args?: Ctx<P>, schema?: string): Promise<void>;
}

export type keyOf<T> = Extract<keyof T, string>;

export type Call<R, P> = {
  guid?: string;
  params?: P;
  request?: R;
};

export type Req<T> = {
  req: Request;
  args: Ctx<T>;
};

export type Ctx<T> = {
  input: T;
};

declare const _default: Modelorama;
export default _default;
