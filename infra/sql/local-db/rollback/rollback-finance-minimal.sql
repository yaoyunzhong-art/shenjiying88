-- Rollback finance minimal local apply
--
-- Empty-table rollback only.
-- Do not use after finance business data has been written without confirming owner approval.

ALTER TABLE IF EXISTS "finance_report_export"
DROP CONSTRAINT IF EXISTS "finance_report_export_reportId_fkey";

DROP TABLE IF EXISTS "finance_report_export";
DROP TABLE IF EXISTS "finance_report";
DROP TABLE IF EXISTS "finance_settlement";
DROP TABLE IF EXISTS "finance_account";
DROP TABLE IF EXISTS "finance_ledger";
DROP TABLE IF EXISTS "invoice_v2";
