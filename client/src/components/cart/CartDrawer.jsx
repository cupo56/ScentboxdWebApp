import useCartStore from '../../store/cartStore';
import CartItem from './CartItem';
import './CartDrawer.css';

export default function CartDrawer({ isOpen, onClose }) {
  const items = useCartStore((s) => s.items);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);

  if (!isOpen) return null;

  return (
    <>
      <div className="cart-drawer__overlay" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-drawer__header">
          <h3>Warenkorb ({items.length})</h3>
          <button className="cart-drawer__close" onClick={onClose}>✕</button>
        </div>

        <div className="cart-drawer__items">
          {items.length === 0 ? (
            <p className="cart-drawer__empty">Dein Warenkorb ist leer</p>
          ) : (
            items.map((item) => <CartItem key={item._id} item={item} />)
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-drawer__footer">
            <div className="cart-drawer__total">
              <span>Gesamt</span>
              <span>{getTotalPrice().toFixed(2)} €</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
