-- ═══════════════════════════════════════════════════════════════════════════
-- VRO Tool – Supabase Setup Script
-- Run this ONCE in your Supabase project → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. User Profiles table (extends Supabase auth.users) ───────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT,
  display_name    TEXT,
  role            TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('admin', 'editor', 'viewer')),
  is_active       BOOLEAN DEFAULT TRUE,
  must_change_pwd BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if the table was already created without them
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email           TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active       BOOLEAN DEFAULT TRUE;

-- ─── 2. Auto-create profile row when a user is created in Auth ───────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, is_active, must_change_pwd)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'displayName', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer'),
    TRUE,
    COALESCE((NEW.raw_user_meta_data->>'mustChangePwd')::boolean, TRUE)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── 3. App Data table (one JSON blob per module) ───────────────────────────
CREATE TABLE IF NOT EXISTS app_data (
  module      TEXT PRIMARY KEY,
  data        JSONB NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_by  TEXT
);

-- ─── 4. Audit Log table ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id        BIGSERIAL PRIMARY KEY,
  user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  action    TEXT,
  module    TEXT,
  ts        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. Enable Row Level Security ───────────────────────────────────────────
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_data  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ─── 6. RLS Policies: profiles ──────────────────────────────────────────────
-- Any logged-in user can read all profiles
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated USING (true);

-- Users can update ONLY their own profile (for display_name etc.)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Admins can update any profile (for role changes)
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 7. RLS Policies: app_data ──────────────────────────────────────────────
-- All authenticated users can read
CREATE POLICY "app_data_select" ON app_data
  FOR SELECT TO authenticated USING (true);

-- Only editors and admins can insert / update
CREATE POLICY "app_data_insert" ON app_data
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));

CREATE POLICY "app_data_update" ON app_data
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','editor')));

-- ─── 8. RLS Policies: audit_log ─────────────────────────────────────────────
-- Everyone authenticated can insert
CREATE POLICY "audit_insert" ON audit_log
  FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins can read
CREATE POLICY "audit_select" ON audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ─── 9. Seed initial S/4HANA demo data ──────────────────────────────────────
INSERT INTO app_data (module, data) VALUES
('project', '{
  "name": "S/4HANA Global Transformation",
  "sponsor": "Chief Financial Officer",
  "projectManager": "Programme Director",
  "startDate": "2024-01-15",
  "goLiveDate": "2025-06-30",
  "budget": 26500000,
  "phase": "Realize",
  "description": "Global SAP S/4HANA implementation replacing legacy ERP across Finance, Procurement, SCM, and HR."
}'::jsonb),
('valueCase', '{
  "discountRate": 8,
  "benefits": [
    {"id":1,"category":"Financial","name":"Procurement Cost Savings","description":"Supplier consolidation & e-procurement","year1":0,"year2":1200000,"year3":2000000,"year4":2500000,"year5":2500000,"status":"Validated","owner":"CPO"},
    {"id":2,"category":"Financial","name":"Inventory Optimisation","description":"Real-time stock visibility","year1":0,"year2":800000,"year3":1500000,"year4":1800000,"year5":1800000,"status":"Validated","owner":"SCM Director"},
    {"id":3,"category":"Financial","name":"DSO Improvement","description":"Automated AR dunning","year1":0,"year2":600000,"year3":1000000,"year4":1200000,"year5":1200000,"status":"Validated","owner":"CFO"},
    {"id":4,"category":"Operational","name":"Finance Automation","description":"Month-end close automation","year1":200000,"year2":800000,"year3":1200000,"year4":1500000,"year5":1500000,"status":"Validated","owner":"Financial Controller"},
    {"id":5,"category":"Operational","name":"Report & Analytics","description":"Real-time embedded analytics","year1":100000,"year2":400000,"year3":600000,"year4":700000,"year5":700000,"status":"Indicative","owner":"CIO"},
    {"id":6,"category":"Strategic","name":"Compliance & Risk","description":"Automated controls","year1":0,"year2":300000,"year3":500000,"year4":500000,"year5":500000,"status":"Indicative","owner":"Chief Risk Officer"},
    {"id":7,"category":"Strategic","name":"Revenue Enhancement","description":"Faster OTC","year1":0,"year2":500000,"year3":1000000,"year4":1200000,"year5":1200000,"status":"Aspirational","owner":"CCO"},
    {"id":8,"category":"Operational","name":"HR Process Efficiency","description":"Integrated HR","year1":100000,"year2":300000,"year3":500000,"year4":500000,"year5":500000,"status":"Validated","owner":"CHRO"}
  ],
  "investments": [
    {"id":1,"category":"Software","name":"SAP S/4HANA Licences","year1":8000000,"year2":0,"year3":500000,"year4":500000,"year5":500000},
    {"id":2,"category":"Services","name":"Implementation Services","year1":7000000,"year2":5000000,"year3":0,"year4":0,"year5":0},
    {"id":3,"category":"Infrastructure","name":"Cloud Infrastructure","year1":1500000,"year2":1000000,"year3":600000,"year4":600000,"year5":600000},
    {"id":4,"category":"People","name":"Training & Enablement","year1":800000,"year2":500000,"year3":200000,"year4":100000,"year5":100000},
    {"id":5,"category":"People","name":"Change Management & OCM","year1":700000,"year2":500000,"year3":200000,"year4":0,"year5":0},
    {"id":6,"category":"Internal","name":"Internal Resource Cost","year1":1200000,"year2":800000,"year3":300000,"year4":200000,"year5":200000}
  ]
}'::jsonb),
('valueAssessment', '{
  "processAreas": [
    {"id":1,"area":"Finance & Controlling","currentScore":2.5,"targetScore":4.5,"priority":"Critical","status":"In Progress","opportunities":["Automated period-end close","Real-time P&L","Integrated planning"],"owner":"CFO Office"},
    {"id":2,"area":"Procurement & SRM","currentScore":2.0,"targetScore":4.0,"priority":"Critical","status":"In Progress","opportunities":["Guided buying","Supplier self-service","Contract compliance"],"owner":"CPO Office"},
    {"id":3,"area":"Supply Chain Management","currentScore":2.5,"targetScore":4.0,"priority":"High","status":"In Progress","opportunities":["Demand-driven MRP","Supply chain control tower","Inventory optimisation"],"owner":"SCM Director"},
    {"id":4,"area":"Order-to-Cash","currentScore":3.0,"targetScore":4.5,"priority":"High","status":"Planned","opportunities":["Order automation","Integrated credit management","Revenue recognition"],"owner":"Sales Ops"},
    {"id":5,"area":"Manufacturing","currentScore":2.0,"targetScore":3.5,"priority":"Medium","status":"Planned","opportunities":["Production planning","Quality management","Plant maintenance"],"owner":"COO"},
    {"id":6,"area":"HR & Payroll","currentScore":3.0,"targetScore":4.0,"priority":"Medium","status":"In Progress","opportunities":["Self-service HR","Payroll automation","Workforce analytics"],"owner":"CHRO"},
    {"id":7,"area":"Reporting & Analytics","currentScore":1.5,"targetScore":4.5,"priority":"Critical","status":"In Progress","opportunities":["Embedded S/4 analytics","SAP Analytics Cloud","Live operational reporting"],"owner":"CIO"},
    {"id":8,"area":"Asset Management","currentScore":2.0,"targetScore":3.5,"priority":"Low","status":"Planned","opportunities":["Unified asset register","Preventive maintenance","CAPEX tracking"],"owner":"Engineering Director"}
  ]
}'::jsonb),
('valueMeasurement', '{
  "kpis": [
    {"id":1,"name":"Days Sales Outstanding (DSO)","category":"Finance","baseline":45,"current":41,"target":30,"unit":"Days","status":"On Track","trend":"improving","lastUpdated":"2025-03"},
    {"id":2,"name":"Inventory Turnover","category":"Supply Chain","baseline":4.1,"current":4.8,"target":7.0,"unit":"x","status":"On Track","trend":"improving","lastUpdated":"2025-03"},
    {"id":3,"name":"Purchase Order Cycle Time","category":"Procurement","baseline":7.0,"current":6.0,"target":2.0,"unit":"Days","status":"At Risk","trend":"stable","lastUpdated":"2025-03"},
    {"id":4,"name":"Financial Close Cycle","category":"Finance","baseline":10,"current":8,"target":5,"unit":"Days","status":"On Track","trend":"improving","lastUpdated":"2025-03"},
    {"id":5,"name":"Purchase Price Variance","category":"Procurement","baseline":3.2,"current":2.8,"target":1.5,"unit":"%","status":"On Track","trend":"improving","lastUpdated":"2025-03"},
    {"id":6,"name":"Report Automation Rate","category":"Analytics","baseline":32,"current":55,"target":85,"unit":"%","status":"On Track","trend":"improving","lastUpdated":"2025-03"},
    {"id":7,"name":"HR Self-Service Adoption","category":"HR","baseline":20,"current":45,"target":80,"unit":"%","status":"At Risk","trend":"stable","lastUpdated":"2025-03"},
    {"id":8,"name":"Supplier On-Time Delivery","category":"Procurement","baseline":78,"current":81,"target":92,"unit":"%","status":"Behind","trend":"declining","lastUpdated":"2025-03"},
    {"id":9,"name":"System Availability","category":"IT","baseline":97.2,"current":99.1,"target":99.9,"unit":"%","status":"On Track","trend":"improving","lastUpdated":"2025-03"}
  ],
  "realizationData": [
    {"quarter":"Q1 2024","planned":0,"actual":0,"cumPlanned":0,"cumActual":0},
    {"quarter":"Q2 2024","planned":150000,"actual":100000,"cumPlanned":150000,"cumActual":100000},
    {"quarter":"Q3 2024","planned":250000,"actual":200000,"cumPlanned":400000,"cumActual":300000},
    {"quarter":"Q4 2024","planned":400000,"actual":350000,"cumPlanned":800000,"cumActual":650000},
    {"quarter":"Q1 2025","planned":700000,"actual":620000,"cumPlanned":1500000,"cumActual":1270000},
    {"quarter":"Q2 2025","planned":1100000,"actual":null,"cumPlanned":2600000,"cumActual":null},
    {"quarter":"Q3 2025","planned":1400000,"actual":null,"cumPlanned":4000000,"cumActual":null},
    {"quarter":"Q4 2025","planned":1600000,"actual":null,"cumPlanned":5600000,"cumActual":null}
  ]
}'::jsonb),
('programGovernance', '{
  "milestones": [
    {"id":1,"name":"Project Initiation & Mobilisation","plannedDate":"2024-01-31","actualDate":"2024-01-29","status":"Complete","owner":"Program Director","phase":"Prepare"},
    {"id":2,"name":"Discovery & Current-State Assessment","plannedDate":"2024-03-15","actualDate":"2024-03-18","status":"Complete","owner":"Solution Architect","phase":"Explore"},
    {"id":3,"name":"Solution Design Sign-off","plannedDate":"2024-05-30","actualDate":"2024-06-05","status":"Complete","owner":"CFO / CPO","phase":"Explore"},
    {"id":4,"name":"Development & Configuration Complete","plannedDate":"2024-09-30","actualDate":"2024-10-10","status":"Complete","owner":"Tech Lead","phase":"Realize"},
    {"id":5,"name":"SIT Sign-off","plannedDate":"2024-12-15","actualDate":"2024-12-20","status":"Complete","owner":"QA Lead","phase":"Realize"},
    {"id":6,"name":"UAT Sign-off","plannedDate":"2025-02-28","actualDate":null,"status":"In Progress","owner":"Business Sponsors","phase":"Realize"},
    {"id":7,"name":"Cutover Readiness Review","plannedDate":"2025-05-31","actualDate":null,"status":"Planned","owner":"Program Director","phase":"Deploy"},
    {"id":8,"name":"Go-Live","plannedDate":"2025-06-30","actualDate":null,"status":"Planned","owner":"Steering Committee","phase":"Deploy"},
    {"id":9,"name":"Hypercare End & Stabilisation","plannedDate":"2025-09-30","actualDate":null,"status":"Planned","owner":"Support Lead","phase":"Run"}
  ],
  "risks": [
    {"id":1,"description":"Data migration complexity – poor data quality in legacy systems","probability":4,"impact":5,"mitigation":"Data quality sprint; dedicated cleanse team","owner":"Data Lead","status":"Open","category":"Technical"},
    {"id":2,"description":"Organisational change resistance – low adoption","probability":4,"impact":4,"mitigation":"Comprehensive OCM; change champions network","owner":"OCM Lead","status":"Mitigated","category":"People"},
    {"id":3,"description":"Third-party integration delays (logistics & banking)","probability":3,"impact":4,"mitigation":"Integration factory; parallel testing tracks","owner":"Integration Lead","status":"Open","category":"Technical"},
    {"id":4,"description":"Key resource attrition during critical phases","probability":3,"impact":3,"mitigation":"Knowledge transfer protocols; retention bonuses","owner":"HR Director","status":"Open","category":"People"},
    {"id":5,"description":"Scope creep from business enhancement requests","probability":4,"impact":3,"mitigation":"Change control board; MoSCoW prioritisation","owner":"Program Director","status":"Open","category":"Governance"}
  ],
  "issues": [
    {"id":1,"description":"Legacy GL data quality below threshold in 3 entities","priority":"High","owner":"Data Lead","dueDate":"2025-02-28","status":"Open","raisedDate":"2025-01-10"},
    {"id":2,"description":"Payment gateway integration – vendor API not certified","priority":"High","owner":"Integration Lead","dueDate":"2025-03-15","status":"In Progress","raisedDate":"2025-01-20"},
    {"id":3,"description":"Training environments not available for UAT wave 2","priority":"Medium","owner":"IT Infrastructure","dueDate":"2025-02-15","status":"Resolved","raisedDate":"2025-01-05"}
  ],
  "decisions": [
    {"id":1,"description":"Deploy on SAP BTP (Cloud) rather than on-premise","date":"2024-02-10","decidedBy":"CIO / CFO","rationale":"Lower TCO, faster upgrades, cloud-first alignment","status":"Approved"},
    {"id":2,"description":"Adopt SAP Best Practices / Clean Core – no custom mods","date":"2024-03-20","decidedBy":"Steering Committee","rationale":"Reduces upgrade risk and maintenance cost","status":"Approved"},
    {"id":3,"description":"Phased rollout: Finance & Procurement first, SCM wave 2","date":"2024-04-15","decidedBy":"Steering Committee","rationale":"Reduces risk; learnings inform subsequent waves","status":"Approved"},
    {"id":4,"description":"SAP Analytics Cloud (SAC) as strategic BI/planning platform","date":"2024-05-01","decidedBy":"CIO / CFO","rationale":"Replaces 4 legacy BI tools; native S/4HANA integration","status":"Approved"},
    {"id":5,"description":"Extend UAT by 3 weeks due to data quality issues","date":"2025-01-15","decidedBy":"Program Director","rationale":"Ensure data meets go-live threshold before cutover","status":"Approved"}
  ],
  "stakeholders": [
    {"id":1,"name":"CFO","role":"Executive Sponsor","influence":5,"interest":5,"engagement":"Champion","department":"Finance"},
    {"id":2,"name":"CIO","role":"Technology Sponsor","influence":5,"interest":5,"engagement":"Champion","department":"IT"},
    {"id":3,"name":"CPO","role":"Business Sponsor","influence":4,"interest":4,"engagement":"Supportive","department":"Procurement"},
    {"id":4,"name":"COO","role":"Business Sponsor","influence":4,"interest":3,"engagement":"Supportive","department":"Operations"},
    {"id":5,"name":"CHRO","role":"Business Sponsor","influence":3,"interest":3,"engagement":"Neutral","department":"HR"},
    {"id":6,"name":"Financial Controllers","role":"Key User Group","influence":3,"interest":5,"engagement":"Champion","department":"Finance"},
    {"id":7,"name":"Procurement Team","role":"Key User Group","influence":2,"interest":4,"engagement":"Supportive","department":"Procurement"},
    {"id":8,"name":"IT Operations","role":"Technical Owner","influence":3,"interest":4,"engagement":"Supportive","department":"IT"},
    {"id":9,"name":"External Auditors","role":"Regulator / Compliance","influence":4,"interest":2,"engagement":"Neutral","department":"External"},
    {"id":10,"name":"End Users (General)","role":"Impacted Group","influence":2,"interest":3,"engagement":"Resistant","department":"Various"}
  ]
}'::jsonb)
ON CONFLICT (module) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════
-- DONE. Now go to Authentication → Users → Create user to add your first admin.
-- After creating, run this to promote them to admin (replace the email):
--
--   UPDATE profiles SET role = 'admin', must_change_pwd = false
--   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@yourcompany.com');
--
-- ═══════════════════════════════════════════════════════════════════════════
