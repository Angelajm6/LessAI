-- ============================================================
-- LessAI Demo Account Seed
-- Run AFTER creating the demo user in Supabase Auth dashboard:
--   Authentication → Users → Add user
--   Email: demo@lessai.io  |  Password: (store in DEMO_PASSWORD env var)
--
-- Then paste the new user's UUID below and run this script.
-- ============================================================

DO $$
DECLARE
  demo_id uuid := 'REPLACE_WITH_DEMO_USER_UUID';  -- ← paste UUID here
  path_id uuid := gen_random_uuid();
  playbook_id uuid := gen_random_uuid();
BEGIN

-- ── Profile ────────────────────────────────────────────────────
INSERT INTO profiles (
  id, email, full_name, role, company_name,
  company_website, company_summary,
  tools, tool_levels, onboarded,
  xp, streak, is_admin
) VALUES (
  demo_id,
  'demo@lessai.io',
  'Alex Rivera',
  'Customer Success Manager',
  'Meridian Analytics',
  'meridiananalytics.io',
  'Meridian Analytics is a B2B SaaS platform that helps mid-market companies turn customer data into retention insights. Their CSM team uses AI tools to write renewal QBR decks, generate health score summaries, and draft proactive outreach emails for at-risk accounts.',
  ARRAY['ChatGPT', 'Claude', 'Notion AI', 'HubSpot AI'],
  '{"ChatGPT": "comfortable", "Claude": "learning", "Notion AI": "never", "HubSpot AI": "learning"}',
  true,
  310, 8, false
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_name = EXCLUDED.company_name,
  tools = EXCLUDED.tools,
  tool_levels = EXCLUDED.tool_levels,
  onboarded = EXCLUDED.onboarded,
  xp = EXCLUDED.xp,
  streak = EXCLUDED.streak;

-- ── AI Path (stack map) ─────────────────────────────────────────
INSERT INTO ai_paths (id, user_id, use_cases, created_at) VALUES (
  path_id,
  demo_id,
  '{
    "summary": "Your stack is built around retaining customers and proving CSM value at scale. ChatGPT is your workhorse for drafts and summaries, Claude for nuanced QBR narratives, Notion AI for templating playbooks, and HubSpot AI for CRM hygiene. The gap today is moving from reactive fire-fighting to proactive outreach — that''s what this plan targets.",
    "workflow_tip": "Start each week by running your at-risk account list through ChatGPT to batch-generate outreach drafts. Use Claude for the high-stakes renewals where tone matters.",
    "tool_tracks": [
      {
        "tool": "ChatGPT",
        "why_this_role": "Fastest way to turn a messy NPS comment or support ticket log into a polished summary your AE can use in 30 seconds.",
        "daily_tasks": [
          {"day": 1, "title": "Batch health score summaries", "task": "Paste your 5 lowest health-score accounts into ChatGPT and prompt it to generate a 3-sentence risk summary for each, using the format: current status, root cause, recommended action.", "time_minutes": 15},
          {"day": 2, "title": "Draft a QBR executive summary", "task": "Give ChatGPT your customer''s key metrics from last quarter (ARR, usage, NPS, open tickets) and ask it to write a 150-word executive summary framing the story around value delivered.", "time_minutes": 20},
          {"day": 3, "title": "Rewrite a renewal email", "task": "Take your standard renewal outreach template and ask ChatGPT to rewrite it 3 ways: urgent tone, collaborative tone, and value-first tone. Pick the best for each account type.", "time_minutes": 10},
          {"day": 4, "title": "Summarise a long support thread", "task": "Copy a long Zendesk thread into ChatGPT and ask: ''Summarise this in 5 bullet points with the root cause and current status.'' Use this before every customer call.", "time_minutes": 8},
          {"day": 5, "title": "Generate proactive outreach", "task": "Prompt ChatGPT to write 3 proactive check-in messages for accounts that haven''t logged in this week. Include the customer''s name, product area, and a specific tip about a feature they haven''t used.", "time_minutes": 12}
        ]
      },
      {
        "tool": "Claude",
        "why_this_role": "Claude excels at long-form, nuanced writing — perfect for renewal narratives and stakeholder-level business cases where ChatGPT sounds too generic.",
        "daily_tasks": [
          {"day": 1, "title": "Write a renewal business case", "task": "Give Claude context about the customer (industry, team size, use case, key wins) and ask it to write a 300-word business case for renewing at the current tier or expanding.", "time_minutes": 20},
          {"day": 2, "title": "Draft a difficult conversation email", "task": "Describe a tricky customer situation (missed SLA, churning signals, unhappy exec) and ask Claude to draft a candid but constructive email that acknowledges the issue and proposes a path forward.", "time_minutes": 15},
          {"day": 3, "title": "Build a success plan outline", "task": "Ask Claude to create a 90-day success plan outline for a new customer in your industry, with milestones, stakeholder touchpoints, and success metrics. Personalise with their company name.", "time_minutes": 18}
        ]
      },
      {
        "tool": "Notion AI",
        "why_this_role": "Notion AI turns your messy meeting notes into structured playbooks you can share with the whole CS team — no more knowledge siloed in your head.",
        "daily_tasks": [
          {"day": 1, "title": "Turn meeting notes into action items", "task": "After your next customer call, paste raw notes into a Notion page and use Notion AI''s ''Improve writing'' + ''Create action items'' to generate a clean call summary with owners and deadlines.", "time_minutes": 10},
          {"day": 2, "title": "Create a churn playbook template", "task": "Ask Notion AI to generate a churn-risk playbook template with sections for: trigger criteria, escalation path, talking points, and win-back offer. Save it as a team template.", "time_minutes": 15}
        ]
      },
      {
        "tool": "HubSpot AI",
        "why_this_role": "HubSpot AI handles the CRM grunt work so you can focus on relationships — auto-logging, summarising contact history, and drafting sequences.",
        "daily_tasks": [
          {"day": 1, "title": "Use AI to summarise a contact record", "task": "Open a contact you haven''t touched in 60+ days. Use HubSpot AI''s contact summary to get a snapshot of last activity, open deals, and email history before you reach out.", "time_minutes": 5},
          {"day": 2, "title": "Draft a re-engagement sequence", "task": "Use HubSpot AI''s sequence assistant to write a 3-email re-engagement flow for churned customers at 30/60/90 day intervals. Ask it to reference the product category and last purchase date.", "time_minutes": 20}
        ]
      }
    ],
    "tool_cards": [
      {
        "tool": "ChatGPT",
        "tagline": "Your fastest drafting tool — great for volume, less good for nuance",
        "vs_others": "Faster and cheaper than Claude for bulk tasks; better at structured outputs than Notion AI; more flexible than HubSpot AI for non-CRM tasks.",
        "best_for": ["Batch summarisation", "Quick email drafts", "Reformatting data into bullets"],
        "not_great_for": ["Long-form narratives", "Sensitive customer conversations", "Tasks requiring deep context"],
        "killer_use_case": "Paste 10 support tickets and ask ChatGPT to identify the top 3 themes and suggest one product improvement for each. Share with your PM — instant credibility."
      },
      {
        "tool": "Claude",
        "tagline": "The nuanced writer — use it when stakes are high",
        "vs_others": "Better than ChatGPT at tone-sensitive writing and long documents. Slower but more reliable for business cases.",
        "best_for": ["Renewal narratives", "Exec-level business cases", "Difficult customer emails"],
        "not_great_for": ["Quick bulk tasks", "Structured data extraction", "CRM automation"],
        "killer_use_case": "Feed Claude your customer''s original onboarding goals, current usage data, and NPS score, then ask it to write a one-page ROI story. Use it verbatim in your renewal deck."
      }
    ]
  }',
  now() - interval '45 days'
) ON CONFLICT DO NOTHING;

-- ── Playbook ───────────────────────────────────────────────────
INSERT INTO playbooks (id, user_id, data, created_at) VALUES (
  playbook_id,
  demo_id,
  '{
    "tool_playbooks": [
      {
        "tool": "ChatGPT",
        "frameworks": [
          {
            "title": "The CSM Triage Prompt",
            "framework": "Act as an experienced Customer Success Manager. I have a customer named [COMPANY] in [INDUSTRY] with [HEALTH_SCORE] health score. Their recent activity shows [USAGE_PATTERN]. Write a 3-sentence risk summary and one recommended immediate action.",
            "why_better": "Forcing the role + structured input stops ChatGPT from giving generic advice."
          },
          {
            "title": "The QBR Narrative Builder",
            "framework": "You are helping a CSM prepare for a Quarterly Business Review. Customer: [NAME]. Key metrics: ARR [X], NPS [Y], feature adoption [Z%], open tickets [N]. Write a 150-word executive summary that starts with value delivered, then highlights one challenge and one growth opportunity.",
            "why_better": "The metric scaffolding forces specific, non-generic output."
          }
        ]
      }
    ]
  }',
  now() - interval '44 days'
) ON CONFLICT DO NOTHING;

-- ── Task completions (spread over last 30 days for a good heatmap) ──
INSERT INTO task_completions (user_id, tool, day, created_at) VALUES
  (demo_id, 'ChatGPT', 1, now() - interval '30 days'),
  (demo_id, 'ChatGPT', 2, now() - interval '28 days'),
  (demo_id, 'Claude',  1, now() - interval '28 days'),
  (demo_id, 'ChatGPT', 3, now() - interval '26 days'),
  (demo_id, 'Notion AI', 1, now() - interval '25 days'),
  (demo_id, 'ChatGPT', 4, now() - interval '24 days'),
  (demo_id, 'Claude',  2, now() - interval '23 days'),
  (demo_id, 'HubSpot AI', 1, now() - interval '22 days'),
  (demo_id, 'ChatGPT', 5, now() - interval '21 days'),
  (demo_id, 'Notion AI', 2, now() - interval '20 days'),
  (demo_id, 'Claude',  3, now() - interval '18 days'),
  (demo_id, 'ChatGPT', 1, now() - interval '17 days'),
  (demo_id, 'HubSpot AI', 2, now() - interval '16 days'),
  (demo_id, 'ChatGPT', 2, now() - interval '15 days'),
  (demo_id, 'Claude',  1, now() - interval '14 days'),
  (demo_id, 'ChatGPT', 3, now() - interval '13 days'),
  (demo_id, 'Notion AI', 1, now() - interval '12 days'),
  (demo_id, 'ChatGPT', 4, now() - interval '11 days'),
  (demo_id, 'Claude',  2, now() - interval '10 days'),
  (demo_id, 'HubSpot AI', 1, now() - interval '9 days'),
  (demo_id, 'ChatGPT', 5, now() - interval '8 days'),
  (demo_id, 'Claude',  3, now() - interval '7 days'),
  (demo_id, 'Notion AI', 2, now() - interval '7 days'),
  (demo_id, 'ChatGPT', 1, now() - interval '6 days'),
  (demo_id, 'HubSpot AI', 2, now() - interval '5 days'),
  (demo_id, 'ChatGPT', 2, now() - interval '4 days'),
  (demo_id, 'Claude',  1, now() - interval '3 days'),
  (demo_id, 'Notion AI', 1, now() - interval '2 days'),
  (demo_id, 'ChatGPT', 3, now() - interval '1 day'),
  (demo_id, 'Claude',  2, now() - interval '1 day'),
  (demo_id, 'ChatGPT', 4, now()),
  (demo_id, 'HubSpot AI', 1, now())
ON CONFLICT DO NOTHING;

-- ── Saved prompts ──────────────────────────────────────────────
INSERT INTO saved_prompts (id, user_id, content, label, tool, folder_id, created_at) VALUES
  (
    gen_random_uuid(), demo_id,
    'Act as a Customer Success Manager at a B2B SaaS company. I have an account named [COMPANY] with [HEALTH_SCORE] health score, [DAYS] days since last login, and [NPS] NPS. Write a 3-sentence at-risk summary and recommend one immediate action I should take today.',
    'At-risk account triage',
    'ChatGPT', null, now() - interval '20 days'
  ),
  (
    gen_random_uuid(), demo_id,
    'You are helping a CSM write a renewal business case for an executive sponsor. Customer: [NAME] at [COMPANY]. Key wins this year: [WIN_1], [WIN_2]. Current ARR: [ARR]. Write a 200-word business case that leads with ROI, acknowledges one challenge, and ends with a clear call to action for renewal.',
    '✨ Renewal business case (improved)',
    'Claude', null, now() - interval '12 days'
  ),
  (
    gen_random_uuid(), demo_id,
    'I have a customer who has been unresponsive for 30+ days and their renewal is in 45 days. Company: [NAME]. Last interaction: [DATE]. Write a re-engagement email that is direct but warm, references a specific value moment from our relationship, and asks for a 20-minute call. Do not sound desperate.',
    'Re-engagement for ghosting accounts',
    'ChatGPT', null, now() - interval '5 days'
  )
ON CONFLICT DO NOTHING;

-- ── Prompt Lab history ─────────────────────────────────────────
INSERT INTO prompt_lab_history (id, user_id, original, improved, tool, scores_before, scores_after, summary, created_at) VALUES
  (
    gen_random_uuid(), demo_id,
    'Write me a renewal email for a customer',
    'Act as a senior Customer Success Manager. Write a renewal email for [CUSTOMER_NAME] at [COMPANY], a [INDUSTRY] company using our platform for [USE_CASE]. Their contract renews on [DATE]. Key wins this year: [WIN_1] and [WIN_2]. The tone should be confident and partnership-focused, not salesy. End with a specific ask to schedule a 20-minute renewal review call.',
    'ChatGPT',
    '{"specificity": 2, "context": 1, "output_clarity": 3}',
    '{"specificity": 8, "context": 9, "output_clarity": 8}',
    'Added role framing, specific customer context fields, and a clear call-to-action instead of an open-ended request.',
    now() - interval '18 days'
  ),
  (
    gen_random_uuid(), demo_id,
    'Summarise this customer call',
    'You are a Customer Success Manager. I will paste raw notes from a customer call. Summarise them into: (1) 3 key discussion points, (2) customer sentiment (positive/neutral/at-risk), (3) action items with owners and deadlines, (4) any product feedback or feature requests mentioned. Keep each section under 50 words.',
    'ChatGPT',
    '{"specificity": 3, "context": 2, "output_clarity": 2}',
    '{"specificity": 9, "context": 7, "output_clarity": 9}',
    'Structured the output format explicitly, which forces consistent summaries you can paste directly into your CRM.',
    now() - interval '14 days'
  ),
  (
    gen_random_uuid(), demo_id,
    'Help me write a QBR for my customer',
    'Act as a strategic Customer Success Manager preparing a Quarterly Business Review deck. Customer: [NAME] at [COMPANY]. Quarter highlights: usage up [X]%, [N] support tickets resolved (avg resolution [Y] days), NPS score [Z]. Write the executive summary slide (150 words max) that frames the story as: value delivered → challenge addressed → what''s next. Use business language, not product jargon.',
    'Claude',
    '{"specificity": 2, "context": 2, "output_clarity": 3}',
    '{"specificity": 9, "context": 8, "output_clarity": 9}',
    'Transformed a vague request into a structured QBR narrative by specifying the story arc and constraining the length.',
    now() - interval '7 days'
  ),
  (
    gen_random_uuid(), demo_id,
    'Write an email to a customer who is about to churn',
    'You are an experienced Customer Success Manager. A key customer ([NAME] at [COMPANY], [ARR] ARR) has shown churn signals: [SIGNAL_1] and [SIGNAL_2]. Write a 200-word email to their executive sponsor that: acknowledges the issue directly, takes responsibility without over-apologising, proposes one concrete remediation step with a timeline, and asks for a 30-minute call this week. Tone: candid, professional, solution-focused.',
    'Claude',
    '{"specificity": 3, "context": 2, "output_clarity": 4}',
    '{"specificity": 9, "context": 9, "output_clarity": 8}',
    'Added stakeholder targeting, specific churn signals, a concrete remediation ask, and tone guidance that prevents the typical over-apologetic response.',
    now() - interval '3 days'
  ),
  (
    gen_random_uuid(), demo_id,
    'Give me ideas for customer health scoring',
    'Act as a Customer Success Operations expert. I manage [N] accounts at a B2B SaaS company in [INDUSTRY]. Our current data points are: [DATA_1], [DATA_2], [DATA_3]. Suggest a weighted health score model with 5-7 signals, their recommended weights (must sum to 100%), and a simple red/yellow/green threshold for each. Format as a table.',
    'ChatGPT',
    '{"specificity": 2, "context": 1, "output_clarity": 3}',
    '{"specificity": 8, "context": 8, "output_clarity": 9}',
    'Adding the table format request and weight constraint forces a directly usable output rather than generic bullet points.',
    now() - interval '1 day'
  )
ON CONFLICT DO NOTHING;

END $$;
