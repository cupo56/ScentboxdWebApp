import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { useProduct } from '../hooks/useProducts';
import useCartStore from '../store/cartStore';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';
import './ProductDetailPage.css';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const addItem = useCartStore((s) => s.addItem);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0);

  const placeholderImg =
    'https://placehold.co/600x800?text=Parfum';

  if (loading) return <Spinner size="lg" />;
  if (error) return <p className="detail__error">{error}</p>;
  if (!product) return null;

  const images = product.images?.length > 0 ? product.images : [placeholderImg];
  const selectedSize = product.sizes?.[selectedSizeIndex];
  const currentPrice = selectedSize?.price ?? product.price;
  const currentStock = selectedSize?.stock ?? 0;

  return (
    <div className="detail">
      <div className="detail__gallery">
        <img
          src={images[activeImage]}
          alt={product.name}
          className="detail__main-image"
        />
        {images.length > 1 && (
          <div className="detail__thumbs">
            {images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt=""
                className={`detail__thumb ${i === activeImage ? 'active' : ''}`}
                onClick={() => setActiveImage(i)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="detail__info">
        <Badge variant="default">{product.category}</Badge>
        <p className="detail__brand">{product.brand}</p>
        <h1 className="detail__name">{product.name}</h1>
        <p className="detail__price">{currentPrice.toFixed(2)} €</p>

        {/* Größen-Auswahl */}
        {product.sizes?.length > 0 && (
          <div className="detail__sizes">
            <label className="detail__label">Größe</label>
            <div className="detail__size-options">
              {product.sizes.map((size, i) => (
                <button
                  key={size.ml}
                  className={`detail__size-btn ${i === selectedSizeIndex ? 'active' : ''}`}
                  onClick={() => setSelectedSizeIndex(i)}
                >
                  {size.ml}ml — {size.price.toFixed(2)} €
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="detail__description">{product.description}</p>

        {/* Duftnoten */}
        {product.notes && (product.notes.top?.length > 0 || product.notes.heart?.length > 0 || product.notes.base?.length > 0) && (
          <div className="detail__notes">
            <label className="detail__label">Duftnoten</label>
            {product.notes.top?.length > 0 && (
              <div className="detail__note-row">
                <span className="detail__note-label">Kopfnote</span>
                <span className="detail__note-values">{product.notes.top.join(', ')}</span>
              </div>
            )}
            {product.notes.heart?.length > 0 && (
              <div className="detail__note-row">
                <span className="detail__note-label">Herznote</span>
                <span className="detail__note-values">{product.notes.heart.join(', ')}</span>
              </div>
            )}
            {product.notes.base?.length > 0 && (
              <div className="detail__note-row">
                <span className="detail__note-label">Basisnote</span>
                <span className="detail__note-values">{product.notes.base.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        <div className="detail__stock">
          {currentStock > 0 ? (
            <Badge variant="success">✓ Auf Lager ({currentStock})</Badge>
          ) : (
            <Badge variant="danger">Ausverkauft</Badge>
          )}
        </div>

        <div className="detail__add">
          <div className="detail__quantity">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity((q) => q + 1)}>+</button>
          </div>
          <Button
            size="lg"
            fullWidth
            disabled={currentStock === 0}
            onClick={() => addItem({ ...product, selectedSize }, quantity)}
          >
            In den Warenkorb — {(currentPrice * quantity).toFixed(2)} €
          </Button>
        </div>
      </div>
    </div>
  );
}
