import useCartStore from '../../store/cartStore';
import './CartItem.css';

export default function CartItem({ item }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const placeholderImg =
    'https://images.unsplash.com/photo-1541643600914-78b084683601?w=100&q=80';

  return (
    <div className="cart-item">
      <img
        src={item.images?.[0] || placeholderImg}
        alt={item.name}
        className="cart-item__image"
      />

      <div className="cart-item__info">
        <p className="cart-item__brand">{item.brand}</p>
        <h4 className="cart-item__name">{item.name}</h4>
        <p className="cart-item__size">{item.size}</p>
      </div>

      <div className="cart-item__actions">
        <div className="cart-item__quantity">
          <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>−</button>
          <span>{item.quantity}</span>
          <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>+</button>
        </div>
        <span className="cart-item__price">{(item.price * item.quantity).toFixed(2)} €</span>
        <button className="cart-item__remove" onClick={() => removeItem(item._id)}>✕</button>
      </div>
    </div>
  );
}
