import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductGrid from '../components/product/ProductGrid';
import FilterBar from '../components/product/FilterBar';
import Spinner from '../components/ui/Spinner';
import Button from '../components/ui/Button';
import './ShopPage.css';

export default function ShopPage() {
  const [category, setCategory] = useState('Alle');
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);

  const params = { page, limit: 12 };
  if (category !== 'Alle') params.category = category;
  if (sort) params.sort = sort;

  const { products, loading, error, pagination } = useProducts(params);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <div className="shop">
      <div className="shop__header">
        <h1>Shop</h1>
        <p className="shop__count">{pagination.total} Produkte</p>
      </div>

      <FilterBar
        activeCategory={category}
        onCategoryChange={handleCategoryChange}
        onSortChange={setSort}
      />

      {error && <p className="shop__error">{error}</p>}
      {loading ? <Spinner /> : <ProductGrid products={products} />}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="shop__pagination">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Zurück
          </Button>
          <span className="shop__page-info">
            Seite {pagination.page} von {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Weiter →
          </Button>
        </div>
      )}
    </div>
  );
}
