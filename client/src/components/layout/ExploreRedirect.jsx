import { Navigate, useLocation } from 'react-router-dom';

// Alte Catalog-URL. Query-String (Suche, Filter) bleibt erhalten.
export default function ExploreRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/catalog${search}`} replace />;
}
