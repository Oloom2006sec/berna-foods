import { Link } from "react-router-dom";

export default function CartAddedActions({
  onContinue,
  className = "",
}) {
  return (
    <div className={`cart-added-actions ${className}`.trim()}>
      <Link
        to="/checkout"
        className="cart-added-checkout"
      >
        تأكيد الطلب
      </Link>
      <button
        type="button"
        className="cart-added-continue"
        onClick={onContinue}
      >
        متابعة التسوق
      </button>
    </div>
  );
}
