import { useEffect, useState } from 'react';
import { adminGetOrders, adminUpdateOrderStatus } from '../../services/api';

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  pending:    'bg-yellow-50 text-yellow-700',
  processing: 'bg-blue-50 text-blue-700',
  shipped:    'bg-purple-50 text-purple-700',
  delivered:  'bg-green-50 text-green-700',
  cancelled:  'bg-red-50 text-red-600',
};

export default function AdminOrders() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetOrders()
      .then((r) => setOrders(r.data))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    const updated = await adminUpdateOrderStatus(id, status);
    setOrders((prev) => prev.map((o) => (o._id === id ? updated.data : o)));
  };

  if (loading) return <p className="text-gray-400">Laden...</p>;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Bestellungen</h1>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="px-6 py-3 text-left">Datum</th>
              <th className="px-6 py-3 text-left">Kunde</th>
              <th className="px-6 py-3 text-left">Betrag</th>
              <th className="px-6 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('de-AT')}
                </td>
                <td className="px-6 py-3 text-gray-700">
                  {order.user?.email ?? '—'}
                </td>
                <td className="px-6 py-3 text-gray-700">
                  € {order.total.toFixed(2)}
                </td>
                <td className="px-6 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded border-0 font-medium
                                focus:outline-none cursor-pointer
                                ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {orders.length === 0 && (
          <p className="px-6 py-8 text-center text-gray-400 text-sm">
            Noch keine Bestellungen vorhanden.
          </p>
        )}
      </div>
    </div>
  );
}
