import {
  applicationStatuses,
  applicationTypes,
  bloodGroups,
  licenseCategories,
  nationalities,
  paymentTypes,
  provinces,
} from "@/lib/db/schema";

export const masterResources = {
  nationalities: { label: "Nationalities", singular: "nationality", table: nationalities },
  "blood-groups": { label: "Blood groups", singular: "blood group", table: bloodGroups },
  "application-types": { label: "Application types", singular: "application type", table: applicationTypes },
  "application-statuses": { label: "Application statuses", singular: "application status", table: applicationStatuses },
  "payment-types": { label: "Payment types", singular: "payment type", table: paymentTypes },
  provinces: { label: "Provinces and territories", singular: "province or territory", table: provinces },
  "license-categories": { label: "License categories", singular: "license category", table: licenseCategories },
} as const;

export type MasterResource = keyof typeof masterResources | "branches";

export function isMasterResource(value: string): value is MasterResource {
  return value === "branches" || value in masterResources;
}

export const masterNavigation: ReadonlyArray<{ resource: MasterResource; label: string }> = [
  ...Object.entries(masterResources).map(([resource, value]) => ({ resource: resource as keyof typeof masterResources, label: value.label })),
  { resource: "branches", label: "Branches" },
];
