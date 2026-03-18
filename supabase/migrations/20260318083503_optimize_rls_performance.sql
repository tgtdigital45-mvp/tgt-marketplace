-- Migration to fix RLS performance warnings and consolidate permissive policies

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" 
ON orders FOR SELECT 
TO authenticated 
USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id);
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE TO authenticated
-- USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id)
-- WITH CHECK ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id);
DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  (select auth.uid()) = buyer_id AND 
  status = 'pending'
);
DROP POLICY IF EXISTS "Users can update own orders" ON public.orders;
CREATE POLICY "Users can update own orders"
ON orders FOR UPDATE
TO authenticated
USING ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id)
WITH CHECK ((select auth.uid()) = buyer_id OR (select auth.uid()) = seller_id);
DROP POLICY IF EXISTS "Owners can manage team members" ON public.team_members;
CREATE POLICY "Owners can manage team members"
ON team_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members
        WHERE user_id = (select auth.uid()) AND company_id = team_members.company_id AND role = 'owner'
    )
);
DROP POLICY IF EXISTS "Owners can manage team members" ON public.team_members;
CREATE POLICY "Owners can manage team members"
ON team_members FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = (select auth.uid()) 
        AND tm.company_id = team_members.company_id 
        AND tm.role = 'owner'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.user_id = (select auth.uid()) 
        AND tm.company_id = team_members.company_id 
        AND tm.role = 'owner'
    )
);
DROP POLICY IF EXISTS "Owners can update their company" ON public.companies;
CREATE POLICY "Owners can update their company"
ON companies FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE company_id = companies.id 
    AND user_id = (select auth.uid()) 
    AND role = 'owner'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE company_id = companies.id 
    AND user_id = (select auth.uid()) 
    AND role = 'owner'
  )
);
DROP POLICY IF EXISTS "Buyers can view their disputes" ON public.public;
CREATE POLICY "Buyers can view their disputes" 
ON public.disputes FOR SELECT 
USING ((select auth.uid()) = buyer_id);
DROP POLICY IF EXISTS "Sellers can view their disputes" ON public.public;
CREATE POLICY "Sellers can view their disputes" 
ON public.disputes FOR SELECT 
USING ((select auth.uid()) = seller_id);
DROP POLICY IF EXISTS "Buyers can open disputes" ON public.public;
CREATE POLICY "Buyers can open disputes"
ON public.disputes FOR INSERT
WITH CHECK ((select auth.uid()) = buyer_id);
DROP POLICY IF EXISTS "clients_select_own_quotes" ON public.quotes;
CREATE POLICY "clients_select_own_quotes" ON quotes
  FOR SELECT USING ((select auth.uid()) = client_id);
DROP POLICY IF EXISTS "companies_select_own_quotes" ON public.quotes;
CREATE POLICY "companies_select_own_quotes" ON quotes
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM companies WHERE profile_id = (select auth.uid())
    )
  );
DROP POLICY IF EXISTS "clients_insert_quotes" ON public.quotes;
CREATE POLICY "clients_insert_quotes" ON quotes
  FOR INSERT WITH CHECK ((select auth.uid()) = client_id);
DROP POLICY IF EXISTS "companies_update_quotes" ON public.quotes;
CREATE POLICY "companies_update_quotes" ON quotes
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM companies WHERE profile_id = (select auth.uid())
    )
  );
DROP POLICY IF EXISTS "clients_update_own_quotes" ON public.quotes;
CREATE POLICY "clients_update_own_quotes" ON quotes
  FOR UPDATE USING ((select auth.uid()) = client_id);
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.public;
CREATE POLICY "Users can view their own quotes"
    ON public.quotes FOR SELECT
    USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.public;
CREATE POLICY "Users can insert their own quotes"
    ON public.quotes FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Providers can view quotes for their services" ON public.public;
CREATE POLICY "Providers can view quotes for their services"
    ON public.quotes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.services s
            JOIN public.companies c ON s.company_id = c.id
            WHERE s.id = quotes.service_id AND c.profile_id = (select auth.uid())
        )
    );
DROP POLICY IF EXISTS "Users can view replies to their quotes" ON public.public;
CREATE POLICY "Users can view replies to their quotes"
    ON public.quote_replies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.quotes q
            WHERE q.id = quote_replies.quote_id AND q.user_id = (select auth.uid())
        )
    );
DROP POLICY IF EXISTS "Providers can view their own replies" ON public.public;
CREATE POLICY "Providers can view their own replies"
    ON public.quote_replies FOR SELECT
    USING ((select auth.uid()) = provider_id);
DROP POLICY IF EXISTS "Providers can insert replies" ON public.public;
CREATE POLICY "Providers can insert replies"
    ON public.quote_replies FOR INSERT
    WITH CHECK ((select auth.uid()) = provider_id);
DROP POLICY IF EXISTS "Users can insert team memberships" ON public.public;
CREATE POLICY "Users can insert team memberships" ON public.team_members
AS PERMISSIVE FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c 
    WHERE c.id = team_members.company_id AND c.profile_id = (select auth.uid())
  )
);
DROP POLICY IF EXISTS "Sellers can insert deliveries" ON public.public;
CREATE POLICY "Sellers can insert deliveries" ON public.order_deliveries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND seller_id = (select auth.uid())
        )
    );
DROP POLICY IF EXISTS "Sellers can view their deliveries" ON public.public;
CREATE POLICY "Sellers can view their deliveries" ON public.order_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND seller_id = (select auth.uid())
        )
    );
DROP POLICY IF EXISTS "Buyers can view deliveries for their orders" ON public.public;
CREATE POLICY "Buyers can view deliveries for their orders" ON public.order_deliveries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE id = order_id AND buyer_id = (select auth.uid())
        )
    );
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.public;
CREATE POLICY "Admins can view waitlist" ON public.waitlist
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (select auth.uid()) AND role = 'admin'
        )
    );
DROP POLICY IF EXISTS "Clients can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Companies can view their bookings" ON public.bookings;
CREATE POLICY "Users can view their bookings" ON public.bookings FOR SELECT TO authenticated, anon USING (((client_id = (select auth.uid())) OR (company_id IN (SELECT company_id FROM public.team_members WHERE user_id = (select auth.uid())))));
DROP POLICY IF EXISTS "Company full access to documents" ON public.crm_documents;
DROP POLICY IF EXISTS "Customer read access to documents" ON public.crm_documents;
CREATE POLICY "Users can view related documents" ON public.crm_documents FOR SELECT TO authenticated, anon USING (((company_id IN (SELECT company_id FROM public.team_members WHERE user_id = (select auth.uid()))) OR (lead_id IN (SELECT id FROM public.crm_leads WHERE customer_id = (select auth.uid())))));
DROP POLICY IF EXISTS "Clients can view deliveries of their orders" ON public.order_deliveries;
DROP POLICY IF EXISTS "Providers can view their own deliveries" ON public.order_deliveries;
CREATE POLICY "Users can view related deliveries" ON public.order_deliveries FOR SELECT TO authenticated, anon USING (((order_id IN (SELECT id FROM public.orders WHERE client_id = (select auth.uid()))) OR (provider_id = (select auth.uid()))));
DROP POLICY IF EXISTS "Participants can view order proposals" ON public.order_proposals;
DROP POLICY IF EXISTS "Sellers can manage their proposals" ON public.order_proposals;
CREATE POLICY "Users can view related proposals" ON public.order_proposals FOR SELECT TO authenticated, anon USING (((order_id IN (SELECT id FROM public.orders WHERE client_id = (select auth.uid()))) OR (seller_id = (select auth.uid()))));
DROP POLICY IF EXISTS "Users can view proposals they're involved in" ON public.proposals;
DROP POLICY IF EXISTS "Job owners can create proposals" ON public.proposals;
CREATE POLICY "Users can view related proposals" ON public.proposals FOR SELECT TO authenticated, anon USING (((freelancer_id = (select auth.uid())) OR (job_id IN (SELECT id FROM public.jobs WHERE client_id = (select auth.uid())))));
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Providers can view quotes for their services" ON public.quotes;
CREATE POLICY "Users can view related quotes" ON public.quotes FOR SELECT TO authenticated, anon USING (((client_id = (select auth.uid())) OR (service_id IN (SELECT id FROM public.services WHERE provider_id = (select auth.uid())))));
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view their own team" ON public.team_members;
CREATE POLICY "Users can view related team members" ON public.team_members FOR SELECT TO authenticated, anon USING (((user_id = (select auth.uid())) OR (company_id IN (SELECT company_id FROM public.team_members WHERE user_id = (select auth.uid())))));

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

-- Fix incorrectly defined action for proposals
-- Wait, the policy "Job owners can create proposals" was already dropped in the proposal consolidation above.
