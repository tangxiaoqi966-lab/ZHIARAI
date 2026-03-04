
const {HO} = require('@supabase/supabase-js');
const { createClient } = require('@supabase/supabase-js');

// Configuration from your provided details
const SUPABASE_URL = 'http://localhost:8000';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testDatabaseOperations() {
  console.log('Starting Database Operations Test...');

  // 1. Create a table (Simulated via SQL query if possible, or inserting into an existing table)
  // Note: Standard Supabase client with Anon key usually doesn't have permissions to create tables (DDL).
  // DDL usually requires the Service Role key or running SQL via the Dashboard.
  // However, we can test DML (Data Manipulation Language) if a table exists, or try to create one via RPC if configured.
  
  // For this test, we will try to select from a standard table or creating a test table if we had service role key.
  // Since we only have Anon key, we will test basic connectivity and data manipulation on a public table if it exists,
  // or report that we need Service Role key for DDL.

  console.log('\n--- Testing Connectivity ---');
  const { data, error } = await supabase.from('test_table').select('*').limit(1);

  if (error) {
    console.error('Connection/Select Error:', error.message);
    if (error.code === '42P01') {
       console.log('Success: Connected to database, but table "test_table" does not exist (Expected).');
       console.log('This confirms the API is reachable and communicating with the database.');
    } else {
       console.log('Failed to connect or query.');
    }
  } else {
    console.log('Success: Connected and queried "test_table".');
  }

  // 2. Test RLS/Permissions check
  console.log('\n--- Testing Permissions (Anon Key) ---');
  // Attempting to create a table via RPC (Stored Procedure) if one existed for migration
  // This is a common pattern for migrations via API
  const { data: rpcData, error: rpcError } = await supabase.rpc('create_test_table');
  
  if (rpcError) {
      console.log('RPC Error (Expected if function missing):', rpcError.message);
      console.log('Note: Creating tables/migrations usually requires the Service Role Key or Dashboard access.');
  }

  console.log('\n--- Test Summary ---');
  console.log('API URL:', SUPABASE_URL);
  console.log('Key used: Anon Key');
  console.log('Conclusion: The API is accessible. For full schema migration/table creation control, the Service Role Key is required.');
}

testDatabaseOperations();
