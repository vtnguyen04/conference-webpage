-- Enable RLS for all tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for audit_logs
CREATE POLICY "Allow admin access to audit_logs" ON public.audit_logs FOR SELECT USING (auth.role() = 'admin');

-- Policies for check_ins
CREATE POLICY "Allow admin access to check_ins" ON public.check_ins FOR SELECT USING (auth.role() = 'admin');
CREATE POLICY "Allow users to create their own check_ins" ON public.check_ins FOR INSERT WITH CHECK (auth.email() = (SELECT email FROM public.registrations WHERE id = registration_id));

-- Policies for contact_messages
CREATE POLICY "Allow admin access to contact_messages" ON public.contact_messages FOR SELECT USING (auth.role() = 'admin');
CREATE POLICY "Allow anyone to create contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- Policies for registrations
CREATE POLICY "Allow users to create their own registrations" ON public.registrations FOR INSERT WITH CHECK (auth.email() = email);
CREATE POLICY "Allow users to view their own registrations" ON public.registrations FOR SELECT USING (auth.email() = email);
CREATE POLICY "Allow admin access to registrations" ON public.registrations FOR SELECT USING (auth.role() = 'admin');

-- Policies for sessions
CREATE POLICY "Allow anyone to view sessions" ON public.sessions FOR SELECT USING (true);

-- Policies for users
CREATE POLICY "Allow users to view their own data" ON public.users FOR SELECT USING (auth.uid()::varchar = id);
CREATE POLICY "Allow admin access to users" ON public.users FOR SELECT USING (auth.role() = 'admin');
