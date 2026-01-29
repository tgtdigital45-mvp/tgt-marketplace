-- 1. Updates the trigger function to correctly read 'type' from user_metadata
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, user_type, avatar_url)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'name', 
    -- Prioritize metadata type, default to 'client' if missing
    coalesce(new.raw_user_meta_data->>'type', 'client'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    -- Ensure we update the type if it changes in metadata
    user_type = coalesce(excluded.user_type, public.profiles.user_type),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);
  return new;
end;
$$ language plpgsql security definer;

-- 2. Verify the trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
