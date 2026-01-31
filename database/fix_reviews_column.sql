
-- 1. Ensure table exists (if not, it creates it with all columns)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid default uuid_generate_v4() primary key,
  company_id uuid references public.companies(id), -- Nullable initially to avoid issues if added later, or enforce not null
  client_id uuid references auth.users(id) not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  reply text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Ensure company_id column exists (Safe add if table existed without it)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='company_id') THEN
        ALTER TABLE public.reviews ADD COLUMN company_id uuid references public.companies(id);
    END IF;
END $$;

-- 3. Ensure client_id column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='client_id') THEN
        ALTER TABLE public.reviews ADD COLUMN client_id uuid references auth.users(id);
    END IF;
END $$;

-- 4. Now safe to create indexes
CREATE INDEX IF NOT EXISTS idx_reviews_company_id ON public.reviews(company_id);
