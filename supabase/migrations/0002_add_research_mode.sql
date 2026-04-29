-- Add 'research' input mode: user gives a topic, Perplexity Sonar Pro researches
-- it live on the web, and the summary feeds the Tamil scripting step.

-- Step 1: Add the enum value. Run this FIRST, alone.
alter type input_mode add value if not exists 'research';

-- Step 2: Run this AFTER step 1 has committed.
-- Uses text cast to avoid the "new enum value must be committed first" error.
alter table public.projects drop constraint if exists input_present;
alter table public.projects add constraint input_present check (
  (input_mode::text = 'urls'     and source_urls is not null and array_length(source_urls, 1) >= 1) or
  (input_mode::text = 'script'   and user_script is not null and length(user_script) > 0) or
  (input_mode::text = 'topic'    and topic is not null and length(topic) > 0) or
  (input_mode::text = 'research' and topic is not null and length(topic) > 0)
);
