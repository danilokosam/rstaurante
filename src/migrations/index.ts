import * as migration_20261124_205719_initial from './20261124_205719_initial';
import * as migration_20261125_122312 from './20261125_122312';

export const migrations = [
  {
    up: migration_20261124_205719_initial.up,
    down: migration_20261124_205719_initial.down,
    name: '20261124_205719_initial',
  },
  {
    up: migration_20261125_122312.up,
    down: migration_20261125_122312.down,
    name: '20261125_122312'
  },
];
