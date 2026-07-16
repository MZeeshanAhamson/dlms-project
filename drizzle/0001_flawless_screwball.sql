CREATE TYPE "public"."gender" AS ENUM('MALE', 'FEMALE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."photo_status" AS ENUM('ACTIVE', 'SUPERSEDED');--> statement-breakpoint
CREATE TABLE "applicant_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"bucket" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"etag" text,
	"version" integer NOT NULL,
	"status" "photo_status" DEFAULT 'ACTIVE' NOT NULL,
	"uploaded_by_id" uuid,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applicant_photos_object_key_unique" UNIQUE("object_key")
);
--> statement-breakpoint
CREATE TABLE "applicants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cnic" text NOT NULL,
	"legal_name" text NOT NULL,
	"father_spouse_name" text NOT NULL,
	"date_of_birth" date NOT NULL,
	"gender" "gender" NOT NULL,
	"nationality_id" uuid NOT NULL,
	"blood_group_id" uuid NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"address" text NOT NULL,
	"province_id" uuid NOT NULL,
	"home_branch_id" uuid NOT NULL,
	"created_by_id" uuid,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applicants_cnic_unique" UNIQUE("cnic"),
	CONSTRAINT "applicants_cnic_format" CHECK ("applicants"."cnic" ~ '^[0-9]{13}$'),
	CONSTRAINT "applicants_phone_format" CHECK ("applicants"."phone" ~ '^\+923[0-9]{9}$')
);
--> statement-breakpoint
ALTER TABLE "applicant_photos" ADD CONSTRAINT "applicant_photos_applicant_id_applicants_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."applicants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_photos" ADD CONSTRAINT "applicant_photos_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_nationality_id_nationalities_id_fk" FOREIGN KEY ("nationality_id") REFERENCES "public"."nationalities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_blood_group_id_blood_groups_id_fk" FOREIGN KEY ("blood_group_id") REFERENCES "public"."blood_groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_home_branch_id_branches_id_fk" FOREIGN KEY ("home_branch_id") REFERENCES "public"."branches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicants" ADD CONSTRAINT "applicants_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "applicant_photo_version_unique" ON "applicant_photos" USING btree ("applicant_id","version");