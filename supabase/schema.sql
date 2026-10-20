-- ============================================================
-- UNIVERSITY ROOM CHECKER — PostgreSQL / Supabase Schema
-- Production-minded relational database schema with RLS & Constraints
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. University Settings ──────────────────────────────────
CREATE TABLE IF NOT EXISTS university_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    logo_url TEXT,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Dhaka',
    working_days TEXT[] NOT NULL DEFAULT ARRAY['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
    default_open_time TIME NOT NULL DEFAULT '08:00',
    default_close_time TIME NOT NULL DEFAULT '20:00',
    upcoming_buffer_minutes INTEGER NOT NULL DEFAULT 15,
    is_demo BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ─── 2. Campus Buildings ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50),
    floors INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ─── 3. Academic Departments ─────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(50) NOT NULL,
    building_id UUID REFERENCES buildings(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ─── 4. Campus Rooms ─────────────────────────────────────────
CREATE TYPE room_category_enum AS ENUM (
    'classroom',
    'faculty_office',
    'chairman_office',
    'dean_office',
    'department_office',
    'admin_office',
    'library',
    'computer_lab',
    'science_lab',
    'seminar_room',
    'conference_room',
    'examination_room',
    'prayer_room',
    'common_room',
    'meeting_room',
    'storage',
    'other'
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category room_category_enum NOT NULL DEFAULT 'classroom',
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE RESTRICT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER,
    description TEXT,
    location_instructions TEXT,
    facilities TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    open_time TIME,
    close_time TIME,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_temporary_closed BOOLEAN NOT NULL DEFAULT false,
    temporary_closure_reason TEXT,
    temporary_closure_until DATE,
    schedule_verified BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT uq_building_room_number UNIQUE (building_id, number)
);

CREATE INDEX idx_rooms_category ON rooms(category);
CREATE INDEX idx_rooms_building ON rooms(building_id);
CREATE INDEX idx_rooms_department ON rooms(department_id);

-- ─── 5. Faculty Members ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    title VARCHAR(50) NOT NULL DEFAULT 'Dr.',
    designation VARCHAR(150) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    office_room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone VARCHAR(100),
    contact_published BOOLEAN NOT NULL DEFAULT false,
    bio TEXT,
    photo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_faculty_department ON faculty_members(department_id);
CREATE INDEX idx_faculty_office ON faculty_members(office_room_id);

-- ─── 6. Room Schedules (Recurring & Date-specific) ───────────
CREATE TYPE day_of_week_enum AS ENUM (
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday'
);

CREATE TABLE IF NOT EXISTS room_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructor_name VARCHAR(255),
    instructor_id UUID REFERENCES faculty_members(id) ON DELETE SET NULL,
    day_of_week day_of_week_enum NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT true,
    specific_date DATE,
    buffer_after_minutes INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT chk_schedule_time_order CHECK (start_time < end_time)
);

CREATE INDEX idx_schedules_room_day ON room_schedules(room_id, day_of_week);
CREATE INDEX idx_schedules_instructor ON room_schedules(instructor_id);

-- ─── 7. Schedule Exceptions & Overrides ───────────────────────
CREATE TYPE schedule_exception_type_enum AS ENUM (
    'cancellation',
    'closure',
    'maintenance',
    'one_time_booking',
    'override'
);

CREATE TABLE IF NOT EXISTS schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    type schedule_exception_type_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    affected_schedule_id UUID REFERENCES room_schedules(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_exceptions_room_date ON schedule_exceptions(room_id, date);

-- ─── 8. Audit Logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL, -- create, update, delete, archive
    entity_type VARCHAR(50) NOT NULL, -- room, schedule, faculty
    entity_id VARCHAR(255) NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ─── 9. Row-Level Security (RLS) ─────────────────────────────
ALTER TABLE university_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public READ access for general campus visitors
CREATE POLICY "Public Read Settings" ON university_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Buildings" ON buildings FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Departments" ON departments FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Rooms" ON rooms FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Faculty" ON faculty_members FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Schedules" ON room_schedules FOR SELECT USING (is_active = true);
CREATE POLICY "Public Read Exceptions" ON schedule_exceptions FOR SELECT USING (true);

-- Admin WRITE access (authenticated users with admin role metadata)
CREATE POLICY "Admin Write Settings" ON university_settings FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);
CREATE POLICY "Admin Write Buildings" ON buildings FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);
CREATE POLICY "Admin Write Departments" ON departments FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);
CREATE POLICY "Admin Write Rooms" ON rooms FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);
CREATE POLICY "Admin Write Faculty" ON faculty_members FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);
CREATE POLICY "Admin Write Schedules" ON room_schedules FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);
CREATE POLICY "Admin Write Exceptions" ON schedule_exceptions FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);
CREATE POLICY "Admin All Audit" ON audit_logs FOR ALL USING (
    auth.jwt() ->> 'role' IN ('admin', 'super_admin')
);
