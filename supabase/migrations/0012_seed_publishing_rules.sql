-- 0012: SEED PUBLISHING RULES
-- Ensures wildcard rules exist for ALL work types (work_type IS NULL)
-- These are the default fan-out rules when work is published

insert into uto.publishing_rules(work_type, visibility, channel, enabled) values
  (null,'public','town_page',true),
  (null,'public','search',true),
  (null,'public','ai_index',true),
  (null,'national','town_page',true),
  (null,'national','search',true),
  (null,'national','ai_index',true),
  (null,'internal','coordinator_dashboard',true)
on conflict do nothing;
