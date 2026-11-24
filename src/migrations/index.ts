import * as migration_20261124_205719_initial from './20261124_205719_initial';

export const migrations = [
  {
    up: migration_20261124_205719_initial.up,
    down: migration_20261124_205719_initial.down,
    name: '20261124_205719_initial',
  },
];
