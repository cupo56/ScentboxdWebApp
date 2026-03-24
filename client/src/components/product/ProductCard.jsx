import { Link } from 'react-router-dom';
import useCartStore from '../../store/cartStore';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);

  const placeholderImg =
    'https://placehold.co/600x800?text=Parfum';

  // Kleinste Größe als Default
  const defaultSize = product.sizes?.[0];
  const totalStock = product.sizes?.reduce((sum, s) => sum + s.stock, 0) ?? 0;

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="product-card__image-wrap">
        <img
          src={product.images?.[0] || placeholderImg}
          alt={product.name}
          className="product-card__image"
        />
        <Badge variant="default" className="product-card__category">
          {product.category}
        </Badge>
        {product.featured && (
          <Badge variant="warning" className="product-card__featured">★ Featured</Badge>
        )}
      </Link>

      <div className="product-card__body">
        <p className="product-card__brand">{product.brand}</p>
        <Link to={`/product/${product._id}`} className="product-card__name">
          {product.name}
        </Link>
        <div className="product-card__meta">
          {product.sizes?.length > 0 && (
            <span className="product-card__size">
              {product.sizes.map((s) => `${s.ml}ml`).join(' · ')}
            </span>
          )}
        </div>
        <div className="product-card__footer">
          <span className="product-card__price">ab {product.price.toFixed(2)} €</span>
          <Button
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              addItem({ ...product, selectedSize: defaultSize }, 1);
            }}
            disabled={totalStock === 0}
          >
            {totalStock === 0 ? 'Ausverkauft' : '+ Warenkorb'}
          </Button>
        </div>
      </div>
    </div>
  );
}
