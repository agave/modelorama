import { GrownInterface, Repository } from '..';
import type Models from './schema/models';

export { default as DB } from './schema/models';
export * from './schema/models';

export interface Application extends GrownInterface {
  Models: Promise<Repository<Models>>;
}

declare const _default: Application;
export default _default;
