import useCartStore from '../../store/cartStore';
import Button from '../ui/Button';
import './CartSummary.css';

export default function CartSummary() {
  const items = useCartStore((s) => s.items);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const getTotalItems = useCartStore((s) => s.getTotalItems);

  const shipping = getTotalPrice() > 50 ? 0 : 4.95;
  const total = getTotalPrice() + shipping;

  return (
    <div className="cart-summary">
      <h3 className="cart-summary__title">Bestellübersicht</h3>

      <div className="cart-summary__rows">
        <div className="cart-summary__row">
          <span>Artikel ({getTotalItems()})</span>
          <span>{getTotalPrice().toFixed(2)} €</span>
        </div>
        <div className="cart-summary__row">
          <span>Versand</span>
          <span>{shipping === 0 ? 'Kostenlos' : `${shipping.toFixed(2)} €`}</span>
        </div>
        {shipping > 0 && (
          <p className="cart-summary__hint">
            Noch {(50 - getTotalPrice()).toFixed(2)} € bis zum kostenlosen Versand
          </p>
        )}
      </div>

      <div className="cart-summary__divider" />

      <div className="cart-summary__row cart-summary__total">
        <span>Gesamt</span>
        <span>{total.toFixed(2)} €</span>
      </div>

      <Button fullWidth size="lg" disabled={items.length === 0}>
        Zur Kasse
      </Button>
    </div>
  );
}
