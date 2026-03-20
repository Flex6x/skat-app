-- 1. Fehlende Spalten zur 'profiles' Tabelle hinzufügen (erzwingen)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins bigint DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_daily_claim text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone;

-- 2. Sicherstellen, dass RLS aktiviert ist
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies neu setzen (alte erst löschen, um Fehler zu vermeiden)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. Server-Cache neu laden (Behebt den 406 Fehler)
NOTIFY pgrst, 'reload schema';
