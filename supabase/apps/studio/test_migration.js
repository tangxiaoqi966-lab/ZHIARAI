
const { createClient } = require('@supabase/supabase-js');

// Configuration from your provided details
const SUPABASE_URL = 'http://localhost:8000';
// WARNING: This is the SERVICE_ROLE_KEY (superuser) from your .env. 
// Do NOT expose this key in client-side code (browsers/apps).
// Use it ONLY in secure backend environments.
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q';

// Initialize Supabase client with Service Role Key
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('Starting Migration Test...');

  // 1. Define SQL to create a table AND notify PostgREST to reload schema
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.migrated_table (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    -- Notify PostgREST to reload the schema cache so it knows about the new table
    NOTIFY pgrst, 'reload schema';
  `;

  console.log('\n--- Executing Migration (Create Table) ---');
  // Call the 'exec_sql' RPC function we created in the database
  const { data: createData, error: createError } = await supabase.rpc('exec_sql', {
    sql_query: createTableSQL
  });

  if (createError) {
    console.error('Migration Failed:', createError.message);
    return;
  }
  console.log('Migration Result:', createData); // Should be 'Success'

  // Give PostgREST a moment to reload the schema
  console.log('Waiting for schema reload...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 2. Insert data into the new table using standard client methods
  console.log('\n--- Inserting Data into Migrated Table ---');
  const { data: insertData, error: insertError } = await supabase
    .from('migrated_table')
    .insert([{ name: 'Test Migration Entry' }])
    .select();

  if (insertError) {
    console.error('Insert Failed:', insertError.message);
  } else {
    console.log('Insert Success:', insertData);
  }

  // 3. Verify data via SQL query (just to double check)
  console.log('\n--- Verifying Data via SQL ---');
  const verifySQL = "SELECT * FROM public.migrated_table ORDER BY id DESC LIMIT 1;";
  const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
     sql_query: verifySQL 
     // Note: Our simple exec_sql returns 'Success' or error message, not result rows.
     // To get result rows from dynamic SQL, the function needs to return SETOF record or JSON.
     // For this demo, we rely on the .from() query above.
  });
  
  if (verifyError) {
      console.log('Verification SQL Error:', verifyError);
  } else {
      console.log('Verification SQL executed (Note: current exec_sql returns status, not rows).');
  }

  console.log('\n--- Test Complete ---');
}

runMigration();
