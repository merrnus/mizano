CREATE POLICY "gundem_kisi_kategori update"
ON public.gundem_kisi_kategori
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "gundem_sorumlu update"
ON public.gundem_sorumlu
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "kardes_evrad_kayit update"
ON public.kardes_evrad_kayit
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);