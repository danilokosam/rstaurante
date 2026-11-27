import * as migration_20261124_205719_initial from './20261124_205719_initial';
import * as migration_20261125_122312 from './20261125_122312';
import * as migration_20261126_185820_media_and_user_name from './20261126_185820_media_and_user_name';
import * as migration_20261126_191721_globals from './20261126_191721_globals';
import * as migration_20261126_193305_storage_fields from './20261126_193305_storage_fields';
import * as migration_20261126_203258_menu_categories_and_dishes from './20261126_203258_menu_categories_and_dishes';

export const migrations = [
  {
    up: migration_20261124_205719_initial.up,
    down: migration_20261124_205719_initial.down,
    name: '20261124_205719_initial',
  },
  {
    up: migration_20261125_122312.up,
    down: migration_20261125_122312.down,
    name: '20261125_122312',
  },
  {
    up: migration_20261126_185820_media_and_user_name.up,
    down: migration_20261126_185820_media_and_user_name.down,
    name: '20261126_185820_media_and_user_name',
  },
  {
    up: migration_20261126_191721_globals.up,
    down: migration_20261126_191721_globals.down,
    name: '20261126_191721_globals',
  },
  {
    up: migration_20261126_193305_storage_fields.up,
    down: migration_20261126_193305_storage_fields.down,
    name: '20261126_193305_storage_fields'
  },
  {
    up: migration_20261126_203258_menu_categories_and_dishes.up,
    down: migration_20261126_203258_menu_categories_and_dishes.down,
    name: '20261126_203258_menu_categories_and_dishes'
  },
];
