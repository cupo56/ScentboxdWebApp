import { Link } from 'react-router-dom';
import useCartStore from '../store/cartStore';
import CartItem from '../components/cart/CartItem';
import CartSummary from '../components/cart/CartSummary';
import Button from '../components/ui/Button';
import './CartPage.css';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  if (items.length === 0) {
    return (
      <div className="cart-page__empty">
        <span className="cart-page__empty-icon">🛒</span>
        <h2>Dein Warenkorb ist leer</h2>
        <p>Entdecke unsere Düfte und füge sie deinem Warenkorb hinzu.</p>
        <Link to="/shop">
          <Button>Zum Shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-page__header">
        <h1>Warenkorb</h1>
        <button className="cart-page__clear" onClick={clearCart}>
          Warenkorb leeren
        </button>
      </div>

      <div className="cart-page__grid">
        <div className="cart-page__items">
          {items.map((item) => (
            <CartItem key={item._id} item={item} />
          ))}
        </div>
        <CartSummary />
      </div>
    </div>
  );
}
