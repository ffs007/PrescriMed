drop policy if exists "Auth read testes_clinicos" on public.testes_clinicos;
create policy "Admin read testes_clinicos" on public.testes_clinicos for select to authenticated using (public.has_role(auth.uid(), 'admin'::app_role));
drop policy if exists "Autenticados leem testes_clinicos_configs" on public.testes_clinicos_configs;