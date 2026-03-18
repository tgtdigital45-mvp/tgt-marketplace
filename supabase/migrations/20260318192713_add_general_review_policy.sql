-- Remove old policy that checks client_id
DROP POLICY IF EXISTS "Clients can create reviews" ON public.reviews;

-- Create new policy that allows clients to create reviews (reviewer_id must be the current user)
CREATE POLICY "Users can create general reviews" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = reviewer_id);
