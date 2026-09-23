import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://csxlhgtlknashxpzzqff.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_zO2Odu6zykbxPORh6ZJJaQ_GZtJOkti";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);