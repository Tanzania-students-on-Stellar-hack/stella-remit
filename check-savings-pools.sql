-- Check if savings_pools table exists and show its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'savings_pools'
ORDER BY 
    ordinal_position;
