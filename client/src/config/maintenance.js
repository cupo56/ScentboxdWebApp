// Hosts, auf denen statt der App der Maintenance-Screen ausgeliefert wird.
//
// Bewusst hostname-basiert statt über eine VITE_-Env-Var: alle vier Aliase des
// Production-Deployments (scent-boxd.com, scentboxd-webapp.vercel.app und die
// beiden längeren Team-URLs) zeigen auf dieselben Dateien. Ein Build-Flag würde
// deshalb auch die .vercel.app-URL sperren, die als Entwicklerzugang dient.
const LOCKED_HOSTS = ['scent-boxd.com', 'www.scent-boxd.com'];

export function isMaintenanceMode(location = window.location) {
  // Escape-Hatch, um den Screen lokal und auf Previews anzusehen.
  if (new URLSearchParams(location.search).has('maintenance')) return true;

  return LOCKED_HOSTS.includes(location.hostname);
}
