import os, re
import datetime

schema_file = 'supabase/migrations/00000_init_schema.sql'

with open(schema_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all CREATE POLICY blocks
policies = re.findall(r'(CREATE POLICY.*?ON\s+(\w+)(.*?);)', content, re.IGNORECASE | re.DOTALL)

out_sql = []
out_sql.append("-- Migration to fix RLS performance warnings and consolidate permissive policies\n")

# Multiple permissive policies mappings to consolidate
# We will drop the existing ones and create a single one
consolidations = {
    'bookings': {
        'action': 'SELECT',
        'roles': 'authenticated, anon',
        'policies_to_drop': ['"Clients can view their own bookings"', '"Companies can view their bookings"'],
        'new_policy_name': '"Users can view their bookings"',
        'using': '((client_id = (select auth.uid())) OR (company_id IN (SELECT company_id FROM public.team_members WHERE user_id = (select auth.uid()))))'
    },
    'crm_documents': {
        'action': 'SELECT',
        'roles': 'authenticated, anon',
        'policies_to_drop': ['"Company full access to documents"', '"Customer read access to documents"'],
        'new_policy_name': '"Users can view related documents"',
        'using': '((company_id IN (SELECT company_id FROM public.team_members WHERE user_id = (select auth.uid()))) OR (lead_id IN (SELECT id FROM public.crm_leads WHERE customer_id = (select auth.uid()))))'
    },
    'messages': {
        'action': 'ALL', # Let's skip automatic merging of messages for now, manual is better
    },
    'order_deliveries': {
        'action': 'SELECT',
        'roles': 'authenticated, anon',
        'policies_to_drop': ['"Clients can view deliveries of their orders"', '"Providers can view their own deliveries"'],
        'new_policy_name': '"Users can view related deliveries"',
        'using': '((order_id IN (SELECT id FROM public.orders WHERE client_id = (select auth.uid()))) OR (provider_id = (select auth.uid())))'
    },
    'order_proposals': {
        'action': 'SELECT',
        'roles': 'authenticated, anon',
        'policies_to_drop': ['"Participants can view order proposals"', '"Sellers can manage their proposals"'],
        'new_policy_name': '"Users can view related proposals"',
        'using': '((order_id IN (SELECT id FROM public.orders WHERE client_id = (select auth.uid()))) OR (seller_id = (select auth.uid())))'
    },
    'proposals': {
        'action': 'SELECT',
        'roles': 'authenticated, anon',
        'policies_to_drop': ['"Users can view proposals they\'re involved in"', '"Job owners can create proposals"'],
        'new_policy_name': '"Users can view related proposals"',
        'using': '((freelancer_id = (select auth.uid())) OR (job_id IN (SELECT id FROM public.jobs WHERE client_id = (select auth.uid()))))'
    },
    'quotes': {
        'action': 'SELECT',
        'roles': 'authenticated, anon',
        'policies_to_drop': ['"Users can view their own quotes"', '"Providers can view quotes for their services"'],
        'new_policy_name': '"Users can view related quotes"',
        'using': '((client_id = (select auth.uid())) OR (service_id IN (SELECT id FROM public.services WHERE provider_id = (select auth.uid()))))'
    },
    'team_members': {
        'action': 'SELECT',
        'roles': 'authenticated, anon',
        'policies_to_drop': ['"Users can view their own memberships"', '"Team members can view their own team"'],
        'new_policy_name': '"Users can view related team members"',
        'using': '((user_id = (select auth.uid())) OR (company_id IN (SELECT company_id FROM public.team_members WHERE user_id = (select auth.uid()))))'
    }
}

count_auth = 0
for match in policies:
    full_stmt = match[0]
    table = match[1]
    rest = match[2]
    
    # We will exclude tables that are being consolidated entirely
    skip = False
    for t, data in consolidations.items():
        if t == table:
            # check if this policy is one of the dropped ones
            for drop_me in data.get('policies_to_drop', []):
                if drop_me in full_stmt:
                    skip = True
                    break
    if skip:
        continue
        
    if 'auth.uid()' in full_stmt or 'auth.jwt()' in full_stmt:
        # Extract policy name
        p_name_match = re.search(r'CREATE POLICY\s+("?[^"]+"?|\w+)\s+ON', full_stmt, re.IGNORECASE)
        if not p_name_match:
            continue
        p_name = p_name_match.group(1)
        
        # Replace auth.uid() with (select auth.uid()) and auth.jwt() with (select auth.jwt())
        # Be careful not to replace it if it's already wrapped in (select auth.uid())
        new_stmt = full_stmt.replace('(select auth.uid())', 'auth.uid()') # normalize first
        new_stmt = new_stmt.replace('auth.uid()', '(select auth.uid())')
        
        new_stmt = new_stmt.replace('(select auth.jwt())', 'auth.jwt()')
        new_stmt = new_stmt.replace('auth.jwt()', '(select auth.jwt())')

        out_sql.append(f"DROP POLICY IF EXISTS {p_name} ON public.{table};")
        out_sql.append(new_stmt)
        count_auth += 1

print(f"Fixed {count_auth} independent policies with auth.uid()")

# Now generate the consolidations
for table, data in consolidations.items():
    if not data.get('new_policy_name'):
        continue
    for p_name in data['policies_to_drop']:
        out_sql.append(f"DROP POLICY IF EXISTS {p_name} ON public.{table};")
        
    roles = data.get('roles', 'authenticated')
    out_sql.append(f"CREATE POLICY {data['new_policy_name']} ON public.{table} FOR {data['action']} TO {roles} USING ({data['using']});")

output_str = "\n".join(out_sql) + "\n"

# Special case for messages, we can do manual drops
manual_drops = """
-- Manual merges for messages
DROP POLICY IF EXISTS "Users can send messages in jobs they're part of" ON public.messages;
DROP POLICY IF EXISTS "Users manage own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in jobs they're part of" ON public.messages;
DROP POLICY IF EXISTS "Users can mark their received messages as read" ON public.messages;

-- Consolidated policies for messages
CREATE POLICY "Users can insert messages" ON public.messages FOR INSERT TO authenticated, anon 
WITH CHECK (
    (sender_id = (select auth.uid()))
    OR 
    (job_id IN (SELECT id FROM public.jobs WHERE client_id = (select auth.uid()) OR professional_id = (select auth.uid())))
);

CREATE POLICY "Users can select messages" ON public.messages FOR SELECT TO authenticated, anon 
USING (
    (sender_id = (select auth.uid()) OR receiver_id = (select auth.uid()))
    OR 
    (job_id IN (SELECT id FROM public.jobs WHERE client_id = (select auth.uid()) OR professional_id = (select auth.uid())))
);

CREATE POLICY "Users can update messages" ON public.messages FOR UPDATE TO authenticated, anon 
USING (
    (receiver_id = (select auth.uid()))
    OR
    (sender_id = (select auth.uid()))
);
"""

output_str += manual_drops

# Additionally, the "Job owners can create proposals" which is misnamed or has wrong action:
output_str += """
-- Fix incorrectly defined action for proposals
-- Wait, the policy "Job owners can create proposals" was already dropped in the proposal consolidation above.
"""

timestamp = datetime.datetime.now().strftime('%Y%m%d%H%M%S')
filename = f'supabase/migrations/{timestamp}_optimize_rls_performance.sql'

with open(filename, 'w', encoding='utf-8') as f:
    f.write(output_str)

print(f"Created migration file: {filename}")
