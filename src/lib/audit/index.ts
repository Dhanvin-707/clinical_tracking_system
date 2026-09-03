import { createSupabaseServer } from "@/lib/supabase/server";

export interface AuditEntry {
  id: number;
  ts: string;
  user_id: string | null;
  action: string;
  module: string;
  entity: string;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  prev_hash: string;
  hash: string;
}

export async function writeAudit(
  action: string,
  module: string,
  entity: string,
  before?: Record<string, unknown>,
  after?: Record<string, unknown>
): Promise<void> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("audit_log_insert", {
    p_action: action,
    p_module: module,
    p_entity: entity,
    p_before: before ?? null,
    p_after: after ?? null,
  });
  if (error) console.error("audit write failed:", error.message);
}

export async function verifyAuditChain(): Promise<{
  total: number;
  invalid: number;
  rows: { id: number; valid: boolean }[];
}> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.rpc("audit_chain_verify");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as { id: number; valid: boolean }[];
  return {
    total: rows.length,
    invalid: rows.filter((r) => !r.valid).length,
    rows,
  };
}
