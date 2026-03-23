-- ============================================================
-- Migration 0010: Financial Dashboard Enhancements
-- ============================================================

-- This migration is currently empty or reserved for financial-only structural changes
-- since fiscal automation was removed from the scope.

-- (Keep file for sequence consistency if needed, or delete if preferred)
-- Adding a placeholder comment or a generic financial flag if needed.
alter table public.companies
  add column if not exists financial_setup_completed boolean default false;
