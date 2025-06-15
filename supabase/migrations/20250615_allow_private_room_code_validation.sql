CREATE OR REPLACE FUNCTION get_room_details_for_join(room_code text)
RETURNS TABLE(
  id uuid,
  name text,
  is_private boolean,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS policies
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.is_private,
    r.is_active
  FROM rooms r
  WHERE r.code = UPPER(room_code) AND r.is_active = TRUE;
END;
$$;

-- Grant execution rights to authenticated users
GRANT EXECUTE ON FUNCTION get_room_details_for_join(text) TO authenticated;

-- Revoke select on the rooms table for authenticated to apply the new policy
REVOKE SELECT ON rooms FROM authenticated;

-- Recreate rooms_select_policy to only allow selection on public rooms
-- or rooms where the user is admin or already a member.
CREATE POLICY "rooms_select_policy_v2"
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

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY; 