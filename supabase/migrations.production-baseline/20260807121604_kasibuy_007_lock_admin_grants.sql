-- PUBLIC still held EXECUTE, which let the anon role reach admin RPCs. Close it.
revoke execute on function kb_admin_login(text,text)                 from public;
revoke execute on function kb_admin_whoami(uuid)                     from public;
revoke execute on function kb_admin_logout(uuid)                     from public;
revoke execute on function kb_admin_set_password(uuid,text)          from public;
revoke execute on function kb_admin_stats(uuid)                      from public;
revoke execute on function kb_admin_order_status(uuid,text,text)     from public;
revoke execute on function kb_admin_bulk_status(uuid,text,text,text) from public;
revoke execute on function kb_reseed_baseline(int)                   from public;

grant execute on function kb_admin_login(text,text)                 to service_role;
grant execute on function kb_admin_whoami(uuid)                     to service_role;
grant execute on function kb_admin_logout(uuid)                     to service_role;
grant execute on function kb_admin_set_password(uuid,text)          to service_role;
grant execute on function kb_admin_stats(uuid)                      to service_role;
grant execute on function kb_admin_order_status(uuid,text,text)     to service_role;
grant execute on function kb_admin_bulk_status(uuid,text,text,text) to service_role;
grant execute on function kb_reseed_baseline(int)                   to service_role;

notify pgrst, 'reload schema';