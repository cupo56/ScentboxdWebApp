import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBrandById, getPerfumesByBrand } from '../services/brandService';
import { toast } from '../store/toastStore';
import PerfumeGrid from '../components/perfume/PerfumeGrid';
import './BrandPage.css';

export default function BrandPage() {
  const { id } = useParams();
  const [brand, setBrand] = useState(null);
  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([getBrandById(id), getPerfumesByBrand(id)])
      .then(([b, p]) => {
        setBrand(b);
        setPerfumes(p);
      })
      .catch((err) => toast.error('Failed to load brand data: ' + err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>Brand not found</h3>
          <Link to="/brands" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Back to Brands
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-page page">
      <div className="container">
        <header className="brand-page__header">
          <Link to="/brands" className="brand-page__back">← All Brands</Link>
          <h1 className="brand-page__name">{brand.name}</h1>
          <div className="brand-page__meta">
            {brand.country && (
              <span className="badge badge-accent">{brand.country}</span>
            )}
            <span className="brand-page__count">{perfumes.length} fragrance{perfumes.length !== 1 ? 's' : ''}</span>
          </div>
        </header>

        <PerfumeGrid perfumes={perfumes} loading={false} />
      </div>
    </div>
  );
}
