import { createHash, randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { ExperimentAssignmentRecord, ExperimentRecord, MerchantRecord } from "@/lib/store/types";
import type { AssignExperimentVariantInput, CreateExperimentInput } from "@/lib/validations/experiment";

function hashToBucket(subjectKey: string) {
  const hex = createHash("sha256").update(subjectKey).digest("hex").slice(0, 8);
  return Number.parseInt(hex, 16) % 100;
}

export async function createExperiment(merchant: MerchantRecord, input: CreateExperimentInput) {
  const experiment: ExperimentRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    name: input.name,
    variants: input.variants,
    trafficPercent: input.trafficPercent,
    isActive: input.isActive,
    createdAt: new Date().toISOString()
  };
  db.experiments.set(experiment.id, experiment);
  return experiment;
}

export async function listExperiments(merchant: MerchantRecord) {
  return Array.from(db.experiments.values())
    .filter((item) => item.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function assignExperimentVariant(
  merchant: MerchantRecord,
  experimentId: string,
  input: AssignExperimentVariantInput
) {
  const experiment = db.experiments.get(experimentId);
  if (!experiment || experiment.merchantId !== merchant.id) {
    throw new AppError(404, "experiment_not_found");
  }
  if (!experiment.isActive) {
    throw new AppError(409, "experiment_inactive");
  }

  const bucket = hashToBucket(`${experiment.id}:${input.subjectKey}`);
  if (bucket >= experiment.trafficPercent) {
    return { variant: "control", inExperiment: false };
  }

  const variantIndex = hashToBucket(`${input.subjectKey}:${experiment.name}`) % experiment.variants.length;
  const variant = experiment.variants[variantIndex] ?? experiment.variants[0] ?? "control";
  const assignment: ExperimentAssignmentRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    experimentId: experiment.id,
    subjectKey: input.subjectKey,
    variant,
    createdAt: new Date().toISOString()
  };
  db.experimentAssignments.set(assignment.id, assignment);

  return { variant, inExperiment: true, assignmentId: assignment.id };
}
