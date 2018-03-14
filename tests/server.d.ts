import { Repository, GrownInterface } from '..';
import type Models from './schema/models';

export { default as DB } from './schema/models';
export * from './schema/models';

export interface Server extends GrownInterface {
  Models: Repository<Models>;
}

declare const _default: Server;
export default _default;
