import { Link } from "react-router-dom";
import { getProductDetails } from "../data/productDetails";
import { campaign } from "../data/homePromotions";
import { getBestPromotionVariant } from "../utils/promotionPricing";
import { getGiftOfferForSku, openCartDrawer } from "../utils/giftOffers";
import { useCart } from "../context/CartContext";
import ProductPopularityBadge from "./ProductPopularityBadge";

export default function HomeOfferCard({ product, discountPercent }) {
  const { addToCart } = useCart();
  const { variant, promotion } = getBestPromotionVariant(product);
  const allVariants = product.customerVariants?.length
    ? product.customerVariants
    : product.variants || [];
  const giftVariant = allVariants.find((item) => getGiftOfferForSku(item.sku));
  const giftOffer = giftVariant ? getGiftOfferForSku(giftVariant.sku) : null;

  function handleGiftClick() {
    addToCart({
      ...giftVariant,
      name: product.name,
      image: product.image || "",
      quantity: Math.max(1, Number(giftOffer.buyQty) || 1),
      sku: giftVariant.sku,
      price: Number(giftVariant.price),
      originalPrice: Number(giftVariant.price),
      promotionId: "",
      promotionLabel: "",
      discountPercent: 0,
      weight: giftVariant.weight,
      weightGrams: Number(giftVariant.weightGrams),
    });
    openCartDrawer();
  }
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
        <ProductPopularityBadge
          productId={product.id}
          category={product.category}
          productName={product.name}
          compact
          className="product-popularity-overlay"
        />
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
        <small className="home-offer-weight">الخصم على عبوة {variant.weight}</small>
        <div className="home-offer-price">
          <del>{promotion.originalPrice.toFixed(2)} ج.م</del>
          <strong>{promotion.price.toFixed(2)} ج.م</strong>
        </div>
        {giftOffer && (
          <button
            type="button"
            className="product-details-gift-badge home-offer-gift-badge"
            onClick={handleGiftClick}
          >
            🎁 اشترِ {giftOffer.buyQty} واحصل على {giftOffer.freeQty} مجانًا
            {giftVariant.weight ? ` (عبوة ${giftVariant.weight})` : ""}
          </button>
        )}
        <Link className="home-offer-action" to={`/products/${product.id}`}>
          شاهد العرض واختر الوزن
        </Link>
      </div>
    </article>
  );
}
