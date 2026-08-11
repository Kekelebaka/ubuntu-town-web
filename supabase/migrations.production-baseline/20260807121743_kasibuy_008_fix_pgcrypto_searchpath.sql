-- pgcrypto is installed in the `extensions` schema, so crypt()/gen_salt() were
-- invisible to functions pinned to search_path=public.
create or replace function kb_admin_login(p_user text, p_pass text)
returns json language plpgsql security definer set search_path=public, extensions as $$
declare a kb_admins; t uuid;
begin
  select * into a from kb_admins where lower(username)=lower(trim(p_user)) and active;
  if a.id is null then return json_build_object('ok',false,'error','bad_credentials'); end if;
  if a.pass_hash <> crypt(p_pass, a.pass_hash) then
    return json_build_object('ok',false,'error','bad_credentials');
  end if;
  delete from kb_sessions where expires_at < now();
  insert into kb_sessions(admin_id) values (a.id) returning token into t;
  return json_build_object('ok',true,'token',t,'admin',
    json_build_object('name',a.name,'role',a.role,'username',a.username,
      'town',(select name from kb_towns where id=a.town_id),'town_id',a.town_id));
end $$;

create or replace function kb_admin_set_password(p_token uuid, p_new text)
returns json language plpgsql security definer set search_path=public, extensions as $$
declare a int;
begin
  select admin_id into a from kb_sessions where token=p_token and expires_at > now();
  if a is null then return json_build_object('ok',false,'error','session'); end if;
  if length(coalesce(p_new,'')) < 10 then return json_build_object('ok',false,'error','too_short'); end if;
  update kb_admins set pass_hash = crypt(p_new, gen_salt('bf',10)) where id=a;
  delete from kb_sessions where admin_id=a and token<>p_token;
  return json_build_object('ok',true);
end $$;

revoke execute on function kb_admin_login(text,text) from public;
revoke execute on function kb_admin_set_password(uuid,text) from public;
grant execute on function kb_admin_login(text,text) to service_role;
grant execute on function kb_admin_set_password(uuid,text) to service_role;
notify pgrst, 'reload schema';