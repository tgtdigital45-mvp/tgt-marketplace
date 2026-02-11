# Audit and Fix Plan

## Goal Description
Audit the project for errors, fix lint issues, ensure Supabase connectivity, and implement SEO best practices.

## User Review Required
None so far.

## Proposed Changes

### Configuration
#### [MODIFY] [package.json](file:///f:/MVP/test 4/tgt-contratto-mvp/package.json)
- Update `lint` script to remove deprecated `--ext` flag.

### Code Quality
#### [MODIFY] [create_test_users.ts](file:///f:/MVP/test 4/tgt-contratto-mvp/scripts/create_test_users.ts)
- Fix `any` type error.

#### [MODIFY] [seed-test-data.ts](file:///f:/MVP/test 4/tgt-contratto-mvp/scripts/seed-test-data.ts)
- Remove unused variable.

#### [MODIFY] [CompanyContext.tsx](file:///f:/MVP/test 4/tgt-contratto-mvp/src/contexts/CompanyContext.tsx)
- Use `useEffect` dependency array correctly (fix exhaustive-deps).

### SEO Implementation
#### [NEW] [robots.txt](file:///f:/MVP/test 4/tgt-contratto-mvp/public/robots.txt)
- Create strict `robots.txt`.

#### [MODIFY] [index.html](file:///f:/MVP/test 4/tgt-contratto-mvp/index.html)
- Add base meta tags.

#### [NEW] [SEO.tsx](file:///f:/MVP/test 4/tgt-contratto-mvp/src/components/SEO.tsx)
- Create a reusable SEO component using `react-helmet-async`.
