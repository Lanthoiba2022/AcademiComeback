GRANT SELECT ON public.rooms TO authenticated;

DROP POLICY IF EXISTS "rooms_select_policy" ON public.rooms;
DROP POLICY IF EXISTS "rooms_select_policy_v2" ON public.rooms;

CREATE POLICY "rooms_select_policy"
  ON public.rooms
  FOR SELECT
  TO authenticated
  USING (
    NOT is_private 
    OR admin_id = auth.uid()
    OR id IN (
      SELECT room_id 
      FROM public.room_members 
      WHERE user_id = auth.uid()
    )
  ); 