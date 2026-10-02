import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { isCurrentUserAdmin, signInAsAdmin } from '../../services/adminService';
import MaintenancePage from '../../pages/MaintenancePage';

// Auf gesperrten Hosts: Maintenance-Screen für alle, die volle App für Admins.
// Das Gate versteckt nur die Oberfläche. Was an Daten lesbar ist, regelt
// weiterhin RLS in Supabase.
export default function MaintenanceGate({ children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const admin = session ? await isCurrentUserAdmin() : false;
      if (active && admin) setOpen(true);
    });

    // Logout in der App schließt das Gate wieder.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && active) setOpen(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleAdminLogin = async (email, password) => {
    const result = await signInAsAdmin(email, password);
    if (result.ok) setOpen(true);
    return result.error;
  };

  if (open) return children;
  // Auch während der Session-Prüfung den Screen zeigen, damit die App nie aufblitzt.
  return <MaintenancePage onAdminLogin={handleAdminLogin} />;
}
