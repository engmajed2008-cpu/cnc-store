-- ═══════════════════════════════════════════════════════════════
-- Marketplace Phase 0 — auto-create public.profiles row on signup
-- profiles.id = auth.users.id
-- Run in Supabase SQL Editor (touches auth schema — not managed by Prisma).
-- Idempotent: safe to re-run.
--
-- NOTE: "updatedAt" is NOT NULL with no DB default (Prisma @updatedAt is
-- client-side), so the trigger must set it explicitly with now().
-- ═══════════════════════════════════════════════════════════════

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, "fullName", email, "updatedAt")
  values (
    new.id,
    'CUSTOMER'::"UserRole",
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
