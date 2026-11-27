import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_dishes_allergens" AS ENUM('gluten', 'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'milk', 'nuts', 'celery', 'mustard', 'sesame', 'sulphites', 'lupin', 'molluscs');
  CREATE TYPE "public"."enum_dishes_availability" AS ENUM('available', 'unavailable', 'hidden');
  CREATE TABLE "menu_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"is_visible" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "menu_categories_locales" (
  	"name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "dishes_allergens" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_dishes_allergens",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "dishes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_order" varchar,
  	"price" numeric NOT NULL,
  	"category_id" integer NOT NULL,
  	"image_id" integer,
  	"availability" "enum_dishes_availability" DEFAULT 'available' NOT NULL,
  	"is_featured" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "dishes_locales" (
  	"name" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "menu_categories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "dishes_id" integer;
  ALTER TABLE "menu_categories_locales" ADD CONSTRAINT "menu_categories_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dishes_allergens" ADD CONSTRAINT "dishes_allergens_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dishes" ADD CONSTRAINT "dishes_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."menu_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dishes" ADD CONSTRAINT "dishes_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dishes_locales" ADD CONSTRAINT "dishes_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "menu_categories__order_idx" ON "menu_categories" USING btree ("_order");
  CREATE INDEX "menu_categories_updated_at_idx" ON "menu_categories" USING btree ("updated_at");
  CREATE INDEX "menu_categories_created_at_idx" ON "menu_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "menu_categories_name_idx" ON "menu_categories_locales" USING btree ("name","_locale");
  CREATE UNIQUE INDEX "menu_categories_locales_locale_parent_id_unique" ON "menu_categories_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "menu_categories_locales_parent_id_idx" ON "menu_categories_locales" USING btree ("_parent_id");
  CREATE INDEX "dishes_allergens_order_idx" ON "dishes_allergens" USING btree ("order");
  CREATE INDEX "dishes_allergens_parent_idx" ON "dishes_allergens" USING btree ("parent_id");
  CREATE INDEX "dishes__order_idx" ON "dishes" USING btree ("_order");
  CREATE INDEX "dishes_category_idx" ON "dishes" USING btree ("category_id");
  CREATE INDEX "dishes_image_idx" ON "dishes" USING btree ("image_id");
  CREATE INDEX "dishes_updated_at_idx" ON "dishes" USING btree ("updated_at");
  CREATE INDEX "dishes_created_at_idx" ON "dishes" USING btree ("created_at");
  CREATE UNIQUE INDEX "dishes_locales_locale_parent_id_unique" ON "dishes_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "dishes_locales_parent_id_idx" ON "dishes_locales" USING btree ("_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_menu_categories_fk" FOREIGN KEY ("menu_categories_id") REFERENCES "public"."menu_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dishes_fk" FOREIGN KEY ("dishes_id") REFERENCES "public"."dishes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_menu_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("menu_categories_id");
  CREATE INDEX "payload_locked_documents_rels_dishes_id_idx" ON "payload_locked_documents_rels" USING btree ("dishes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "menu_categories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "menu_categories_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "dishes_allergens" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "dishes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "dishes_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "menu_categories" CASCADE;
  DROP TABLE "menu_categories_locales" CASCADE;
  DROP TABLE "dishes_allergens" CASCADE;
  DROP TABLE "dishes" CASCADE;
  DROP TABLE "dishes_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_menu_categories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_dishes_fk";
  
  DROP INDEX "payload_locked_documents_rels_menu_categories_id_idx";
  DROP INDEX "payload_locked_documents_rels_dishes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "menu_categories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "dishes_id";
  DROP TYPE "public"."enum_dishes_allergens";
  DROP TYPE "public"."enum_dishes_availability";`)
}
