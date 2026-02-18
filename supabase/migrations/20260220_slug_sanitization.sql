-- Migration: Sanitizar slugs duplicados e adicionar constraint UNIQUE

DO $$
DECLARE
    r RECORD;
    i INTEGER;
    new_slug TEXT;
BEGIN
    -- Loop através de todos os slugs que aparecem mais de uma vez
    FOR r IN
        SELECT slug, count(*)
        FROM companies
        GROUP BY slug
        HAVING count(*) > 1
    LOOP
        -- Para cada slug duplicado, ignorar o primeiro (preservar) e atualizar os subsequentes
        FOR i IN 1..(r.count - 1) LOOP
             -- Seleciona um ID para atualizar (o mais recente ou arbitrário, desde que não seja o que queremos manter)
             update companies
             set slug = slug || '-' || (i + 1)
             where id = (
                select id from companies
                where slug = r.slug
                order by created_at desc, id desc -- Atualiza os mais novos primeiro
                limit 1
             );
        END LOOP;
    END LOOP;
END $$;

-- Agora que não deve haver duplicatas, adicionar a constraint
ALTER TABLE companies ADD CONSTRAINT companies_slug_key UNIQUE (slug);
