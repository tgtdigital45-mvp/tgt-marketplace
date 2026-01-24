-- Add slug column to companies
alter table public.companies add column slug text unique;

-- Function to generate slug from company name
create or replace function public.slugify(value text)
returns text as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        translate(value, 'áàâãäåāăąèééêëēĕėęěìíîïìĩīĭįòóôõöōŏőøùúûüũūŭůűųñç', 'aaaaaaaaaaaaaaaaeeeeeeeeeeeeiiiililililoooooooouuuuuuuuuuunc'),
        '[^a-z0-9\\-_]+', '-', 'g' -- Replace non-alphanumeric with hyphen
      ),
      '^-+|-+$', '', 'g' -- Trim hyphens
    )
  );
end;
$$ language plpgsql;

-- Update existing companies with a slug (if any)
update public.companies set slug = slugify(company_name) where slug is null;

-- Make slug not null after update
alter table public.companies alter column slug set not null;
