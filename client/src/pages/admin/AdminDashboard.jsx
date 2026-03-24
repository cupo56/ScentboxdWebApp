import { useEffect, useState } from 'react';
import { adminGetProducts, adminGetOrders } from '../../services/api';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders]     = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([adminGetProducts(), adminGetOrders()])
      .then(([p, o]) => {
        setProducts(p.data);
        setOrders(o.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-400">Laden...</p>;

  const totalRevenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Dashboard</h1>

      {/* Kennzahlen */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Produkte',     value: products.length },
          { label: 'Bestellungen', value: orders.length },
          { label: 'Umsatz',       value: `€ ${totalRevenue.toFixed(2)}` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">{label}</p>
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Letzte Bestellungen */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Letzte Bestellungen</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="px-6 py-3 text-left">Kunde</th>
              <th className="px-6 py-3 text-left">Betrag</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Datum</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 5).map((order) => (
              <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-700">{order.user?.email ?? '—'}</td>
                <td className="px-6 py-3 text-gray-700">€ {order.total.toFixed(2)}</td>
                <td className="px-6 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-3 text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('de-AT')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
