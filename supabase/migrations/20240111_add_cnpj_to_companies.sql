-- Migration: Add CNPJ column to companies table

ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- Update the comments/documentation for the column
COMMENT ON COLUMN public.companies.cnpj IS 'Cadastro Nacional da Pessoa Jurídica (CNPJ) of the company';
