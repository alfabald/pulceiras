create table if not exists public.participants_store (
  code text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_participants_store_updated_at on public.participants_store;
create trigger trg_participants_store_updated_at
before update on public.participants_store
for each row
execute function public.set_updated_at();
