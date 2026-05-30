-- ============================================================
-- INFRALE 3D — Schema completo de Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";       -- para cron jobs nativos (opcional)

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger para crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLA: projects
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('electrico', 'civil', 'mecanico')),
  description text,
  start_date  date,
  end_date    date,
  owner_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status      text        NOT NULL DEFAULT 'activo'
                          CHECK (status IN ('activo', 'pausado', 'completado', 'archivado')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_projects_owner ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);

-- ============================================================
-- TABLA: project_members (sistema de invitaciones + roles)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.project_members (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  email       text        NOT NULL,
  role        text        NOT NULL DEFAULT 'viewer'
                          CHECK (role IN ('admin', 'editor', 'viewer')),
  status      text        NOT NULL DEFAULT 'pendiente'
                          CHECK (status IN ('pendiente', 'activo', 'rechazado')),
  invited_by  uuid        NOT NULL REFERENCES auth.users(id),
  invited_at  timestamptz NOT NULL DEFAULT now(),
  joined_at   timestamptz,
  UNIQUE (project_id, email)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user    ON public.project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_email   ON public.project_members(email);

-- ============================================================
-- TABLA: ifc_models (metadata de modelos; archivos en Cloudflare R2)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ifc_models (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filename    text        NOT NULL,
  r2_key      text        NOT NULL UNIQUE,
  r2_url      text        NOT NULL,
  size_bytes  bigint,
  uploaded_by uuid        NOT NULL REFERENCES auth.users(id),
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ifc_models_project ON public.ifc_models(project_id);

-- ============================================================
-- TABLA: model_elements (elementos extraídos del IFC)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.model_elements (
  id          uuid    PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_id    uuid    NOT NULL REFERENCES public.ifc_models(id) ON DELETE CASCADE,
  express_id  integer NOT NULL,
  global_id   text,
  name        text,
  type        text,
  properties  jsonb   NOT NULL DEFAULT '{}',
  UNIQUE (model_id, express_id)
);

CREATE INDEX IF NOT EXISTS idx_elements_model    ON public.model_elements(model_id);
CREATE INDEX IF NOT EXISTS idx_elements_global_id ON public.model_elements(global_id);
CREATE INDEX IF NOT EXISTS idx_elements_name     ON public.model_elements USING gin (to_tsvector('spanish', COALESCE(name, '')));

-- ============================================================
-- TABLA: element_technical_info
-- ============================================================
CREATE TABLE IF NOT EXISTS public.element_technical_info (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  element_id  uuid        NOT NULL REFERENCES public.model_elements(id) ON DELETE CASCADE,
  field_name  text        NOT NULL,
  field_value text,
  updated_by  uuid        NOT NULL REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (element_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_tech_info_element ON public.element_technical_info(element_id);

-- ============================================================
-- TABLA: element_progress (Control de Avance de Obra)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.element_progress (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  element_id   uuid        NOT NULL REFERENCES public.model_elements(id) ON DELETE CASCADE,
  progress_pct integer     NOT NULL DEFAULT 0
                           CHECK (progress_pct BETWEEN 0 AND 100),
  status       text        NOT NULL DEFAULT 'planificado'
                           CHECK (status IN ('planificado', 'en_ejecucion', 'completado', 'con_observacion')),
  notes        text,
  updated_by   uuid        NOT NULL REFERENCES auth.users(id),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (element_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_element ON public.element_progress(element_id);
CREATE INDEX IF NOT EXISTS idx_progress_status  ON public.element_progress(status);

-- ============================================================
-- TABLA: element_documents (archivos en Supabase Storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.element_documents (
  id           uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  element_id   uuid        REFERENCES public.model_elements(id) ON DELETE SET NULL,
  project_id   uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  filename     text        NOT NULL,
  storage_path text        NOT NULL UNIQUE,
  mime_type    text,
  size_bytes   bigint,
  uploaded_by  uuid        NOT NULL REFERENCES auth.users(id),
  uploaded_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_docs_project ON public.element_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_docs_element ON public.element_documents(element_id);

-- ============================================================
-- TABLA: maintenance_records
-- ============================================================
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id                    uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  element_id            uuid        NOT NULL REFERENCES public.model_elements(id) ON DELETE CASCADE,
  maintenance_date      date        NOT NULL,
  type                  text        NOT NULL
                                    CHECK (type IN ('preventivo', 'correctivo', 'predictivo')),
  technician_name       text,
  description           text,
  result                text,
  next_maintenance_date date,
  alert_days_before     integer     NOT NULL DEFAULT 15,
  alert_sent            boolean     NOT NULL DEFAULT false,
  created_by            uuid        NOT NULL REFERENCES auth.users(id),
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_element ON public.maintenance_records(element_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_next    ON public.maintenance_records(next_maintenance_date)
  WHERE alert_sent = false AND next_maintenance_date IS NOT NULL;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ifc_models            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_elements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.element_technical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.element_progress      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.element_documents     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records   ENABLE ROW LEVEL SECURITY;

-- Función helper: verificar si el usuario tiene acceso a un proyecto
CREATE OR REPLACE FUNCTION public.user_has_project_access(p_project_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.projects      WHERE id = p_project_id AND owner_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.project_members WHERE project_id = p_project_id AND user_id = auth.uid() AND status = 'activo'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Función helper: obtener rol del usuario en un proyecto
CREATE OR REPLACE FUNCTION public.user_project_role(p_project_id uuid)
RETURNS text AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.projects WHERE id = p_project_id AND owner_id = auth.uid())
      THEN 'admin'
    ELSE (SELECT role FROM public.project_members WHERE project_id = p_project_id AND user_id = auth.uid() AND status = 'activo')
  END;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- POLICIES: profiles ----
CREATE POLICY "profiles_select_own"   ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own"   ON public.profiles FOR UPDATE USING (id = auth.uid());

-- ---- POLICIES: projects ----
CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (public.user_has_project_access(id));
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING (owner_id = auth.uid() OR public.user_project_role(id) = 'admin');
CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  USING (owner_id = auth.uid());

-- ---- POLICIES: project_members ----
CREATE POLICY "members_select" ON public.project_members FOR SELECT
  USING (public.user_has_project_access(project_id) OR user_id = auth.uid());
CREATE POLICY "members_insert" ON public.project_members FOR INSERT
  WITH CHECK (public.user_project_role(project_id) IN ('admin'));
CREATE POLICY "members_update" ON public.project_members FOR UPDATE
  USING (public.user_project_role(project_id) = 'admin' OR user_id = auth.uid());
CREATE POLICY "members_delete" ON public.project_members FOR DELETE
  USING (public.user_project_role(project_id) = 'admin');

-- ---- POLICIES: ifc_models ----
CREATE POLICY "ifc_models_select" ON public.ifc_models FOR SELECT
  USING (public.user_has_project_access(project_id));
CREATE POLICY "ifc_models_insert" ON public.ifc_models FOR INSERT
  WITH CHECK (public.user_project_role(project_id) IN ('admin', 'editor'));
CREATE POLICY "ifc_models_delete" ON public.ifc_models FOR DELETE
  USING (public.user_project_role(project_id) = 'admin');

-- ---- POLICIES: model_elements ----
CREATE POLICY "elements_select" ON public.model_elements FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.ifc_models m WHERE m.id = model_id AND public.user_has_project_access(m.project_id)));
CREATE POLICY "elements_insert" ON public.model_elements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.ifc_models m WHERE m.id = model_id AND public.user_project_role(m.project_id) IN ('admin', 'editor')));

-- ---- POLICIES: element_technical_info ----
CREATE POLICY "tech_info_select" ON public.element_technical_info FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_has_project_access(m.project_id)));
CREATE POLICY "tech_info_insert" ON public.element_technical_info FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_project_role(m.project_id) IN ('admin', 'editor')));
CREATE POLICY "tech_info_update" ON public.element_technical_info FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_project_role(m.project_id) IN ('admin', 'editor')));

-- ---- POLICIES: element_progress ----
CREATE POLICY "progress_select" ON public.element_progress FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_has_project_access(m.project_id)));
CREATE POLICY "progress_upsert" ON public.element_progress FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_project_role(m.project_id) IN ('admin', 'editor')));
CREATE POLICY "progress_update" ON public.element_progress FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_project_role(m.project_id) IN ('admin', 'editor')));

-- ---- POLICIES: element_documents ----
CREATE POLICY "docs_select" ON public.element_documents FOR SELECT
  USING (public.user_has_project_access(project_id));
CREATE POLICY "docs_insert" ON public.element_documents FOR INSERT
  WITH CHECK (public.user_project_role(project_id) IN ('admin', 'editor'));
CREATE POLICY "docs_delete" ON public.element_documents FOR DELETE
  USING (public.user_project_role(project_id) IN ('admin', 'editor'));

-- ---- POLICIES: maintenance_records ----
CREATE POLICY "maint_select" ON public.maintenance_records FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_has_project_access(m.project_id)));
CREATE POLICY "maint_insert" ON public.maintenance_records FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_project_role(m.project_id) IN ('admin', 'editor')));
CREATE POLICY "maint_update" ON public.maintenance_records FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.model_elements e JOIN public.ifc_models m ON m.id = e.model_id WHERE e.id = element_id AND public.user_project_role(m.project_id) IN ('admin', 'editor')));

-- ============================================================
-- TABLA: schedule_members (miembros de equipo del cronograma por proyecto)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedule_members (
  id          uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id  uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  role        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schedule_members_project ON public.schedule_members(project_id);
ALTER TABLE public.schedule_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_members_select" ON public.schedule_members FOR SELECT
  USING (public.user_has_project_access(project_id));
CREATE POLICY "schedule_members_insert" ON public.schedule_members FOR INSERT
  WITH CHECK (public.user_project_role(project_id) IN ('admin', 'editor'));
CREATE POLICY "schedule_members_update" ON public.schedule_members FOR UPDATE
  USING (public.user_project_role(project_id) IN ('admin', 'editor'));
CREATE POLICY "schedule_members_delete" ON public.schedule_members FOR DELETE
  USING (public.user_project_role(project_id) IN ('admin', 'editor'));

-- ============================================================
-- TABLA: schedule_activities (actividades del diagrama de Gantt)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.schedule_activities (
  id            uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id    uuid        NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  start_date    date        NOT NULL,
  end_date      date        NOT NULL,
  member_id     uuid        REFERENCES public.schedule_members(id) ON DELETE SET NULL,
  element_name  text,
  predecessors  uuid[]      NOT NULL DEFAULT '{}',
  parent_id     uuid        REFERENCES public.schedule_activities(id) ON DELETE SET NULL,
  is_critical   boolean     NOT NULL DEFAULT false,
  created_by    uuid        NOT NULL REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER schedule_activities_updated_at
  BEFORE UPDATE ON public.schedule_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_schedule_activities_project ON public.schedule_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_schedule_activities_parent  ON public.schedule_activities(parent_id);
ALTER TABLE public.schedule_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_activities_select" ON public.schedule_activities FOR SELECT
  USING (public.user_has_project_access(project_id));
CREATE POLICY "schedule_activities_insert" ON public.schedule_activities FOR INSERT
  WITH CHECK (public.user_project_role(project_id) IN ('admin', 'editor'));
CREATE POLICY "schedule_activities_update" ON public.schedule_activities FOR UPDATE
  USING (public.user_project_role(project_id) IN ('admin', 'editor'));
CREATE POLICY "schedule_activities_delete" ON public.schedule_activities FOR DELETE
  USING (public.user_project_role(project_id) IN ('admin', 'editor'));

-- ============================================================
-- STORAGE BUCKETS (ejecutar en Supabase Dashboard > Storage)
-- O descomenta si usas supabase CLI:
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
-- CREATE POLICY "documents_select" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
-- CREATE POLICY "documents_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
-- CREATE POLICY "documents_delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
