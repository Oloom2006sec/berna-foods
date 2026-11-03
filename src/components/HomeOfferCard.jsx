import { Link } from "react-router-dom";
import { getProductDetails } from "../data/productDetails";
import { campaign } from "../data/homePromotions";
import { getPromotionPricing } from "../utils/promotionPricing";

export default function HomeOfferCard({ product, discountPercent }) {
  const variant = product.customerVariants?.[0] || product.variants?.[0];
  const promotion = variant
    ? getPromotionPricing(product.name, variant.price, variant.minOfferPrice)
    : null;
  const actualDiscountPercent = promotion?.discountPercent ?? discountPercent;
  const reviews = getProductDetails(product.name)?.reviews || [];
  const rating = reviews.length
    ? (
        reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
        reviews.length
      ).toFixed(1)
    : null;

  if (!variant || !promotion) {
    return null;
  }

  return (
    <article className="home-offer-card">
      <Link
        className="home-offer-image-link"
        to={`/products/${product.id}`}
        aria-label={`تفاصيل عرض ${product.name}`}
      >
        <span className="home-offer-discount">خصم {actualDiscountPercent}%</span>
        <img src={product.image} alt={product.name} loading="lazy" />
        <span className="home-offer-badge">{campaign.offerLabel}</span>
      </Link>
      <div className="home-offer-info">
        <Link className="home-offer-title" to={`/products/${product.id}`}>
          {product.name}
        </Link>
        {rating && (
          <div className="home-offer-rating" aria-label={`تقييم ${rating} من 5`}>
            <span aria-hidden="true">★★★★★</span>
            <strong>{rating}</strong>
            <small>({reviews.length})</small>
          </div>
        )}
        <small className="home-offer-weight">يبدأ من {variant.weight}</small>
        <div className="home-offer-price">
          <del>{promotion.originalPrice.toFixed(2)} ج.م</del>
          <strong>{promotion.price.toFixed(2)} ج.م</strong>
        </div>
        <Link className="home-offer-action" to={`/products/${product.id}`}>
          شاهد العرض واختر الوزن
        </Link>
      </div>
    </article>
  );
}
