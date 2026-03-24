import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminGetProducts, adminDeleteProduct } from '../../services/api';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    adminGetProducts()
      .then((r) => setProducts(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" wirklich löschen?`)) return;
    await adminDeleteProduct(id);
    load();
  };

  if (loading) return <p className="text-gray-400">Laden...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Produkte</h1>
        <Link
          to="/admin/products/new"
          className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
        >
          + Neues Produkt
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase border-b border-gray-100">
              <th className="px-6 py-3 text-left">Name</th>
              <th className="px-6 py-3 text-left">Marke</th>
              <th className="px-6 py-3 text-left">Preis</th>
              <th className="px-6 py-3 text-left">Kategorie</th>
              <th className="px-6 py-3 text-left">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-6 py-3 font-medium text-gray-800">{product.name}</td>
                <td className="px-6 py-3 text-gray-600">{product.brand}</td>
                <td className="px-6 py-3 text-gray-600">€ {product.price}</td>
                <td className="px-6 py-3 text-gray-600">{product.category}</td>
                <td className="px-6 py-3 flex gap-3">
                  <Link
                    to={`/admin/products/${product._id}/edit`}
                    className="text-blue-500 hover:text-blue-700 text-xs"
                  >
                    Bearbeiten
                  </Link>
                  <button
                    onClick={() => handleDelete(product._id, product.name)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
