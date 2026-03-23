-- Enable PostGIS
create extension if not exists postgis schema extensions;

-- Add location coordinates and coverage radius to companies
alter table companies 
  add column if not exists address_lat double precision,
  add column if not exists address_lng double precision,
  add column if not exists coverage_radius_km integer default 10,
  add column if not exists location geography(Point, 4326);

-- Function to automatically update the geography point when lat/lng are set
create or replace function update_company_location()
returns trigger as $$
begin
  if new.address_lat is not null and new.address_lng is not null then
    new.location = st_setsrid(st_makepoint(new.address_lng, new.address_lat), 4326)::geography;
  else
    new.location = null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_update_company_location on companies;
create trigger tr_update_company_location
  before insert or update of address_lat, address_lng on companies
  for each row execute function update_company_location();

-- RPC function to search for companies near a client
create or replace function get_proximal_companies(
  client_lat double precision,
  client_lng double precision,
  search_term text default null,
  limit_val integer default 20
)
returns setof companies as $$
begin
  return query
  select c.*
  from companies c
  where 
    -- Check if client is within company's coverage radius
    (
      client_lat is null or client_lng is null or c.location is null 
      or
      st_dwithin(
        c.location, 
        st_setsrid(st_makepoint(client_lng, client_lat), 4326)::geography, 
        c.coverage_radius_km * 1000
      )
    )
    and 
    -- Optional text search text
    (
      search_term is null 
      or 
      c.business_name ilike '%' || search_term || '%'
      or
      c.description ilike '%' || search_term || '%'
    )
  order by 
    -- If valid coords, order by distance. Otherwise, order by name.
    case when client_lat is not null and client_lng is not null and c.location is not null then
      st_distance(c.location, st_setsrid(st_makepoint(client_lng, client_lat), 4326)::geography)
    else 0 end asc,
    c.business_name asc
  limit limit_val;
end;
$$ language plpgsql security definer;
