CREATE TABLE public.aktivite_tip (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ad text NOT NULL,
  grup text NOT NULL CHECK (grup IN ('aksiyon','manevi')),
  siralama integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.aktivite_tip ENABLE ROW LEVEL SECURITY;

CREATE POLICY "aktivite_tip select" ON public.aktivite_tip
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "aktivite_tip insert" ON public.aktivite_tip
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "aktivite_tip update" ON public.aktivite_tip
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "aktivite_tip delete" ON public.aktivite_tip
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER aktivite_tip_updated_at
  BEFORE UPDATE ON public.aktivite_tip
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();