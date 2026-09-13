const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.https://keelgwvnkvfvaoxjkeja.supabase.co/rest/v1/;
const supabaseKey = process.env.sb_publishable_cJYgrmhByelQ1dUyWsFjiA_338fhdqp;

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;

