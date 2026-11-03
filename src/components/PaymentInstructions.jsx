import "./payment-instructions.css";

export default function PaymentInstructions({
  amountLabel,
  orderNumber,
  depositPercent = 50,
}) {
  const remainingPercent = 100 - depositPercent;

  return (
    <section className="payment-instructions" aria-label="تعليمات الدفع">
      <h3>خطوات الدفع</h3>

      {amountLabel && (
        <p className="payment-instructions-amount">
          جدية الحجز ({depositPercent}% من إجمالي الطلب شامل الشحن):{" "}
          <strong>{amountLabel}</strong>
        </p>
      )}

      <ol className="payment-steps">
        <li>
          اختر إنستاباي أو فودافون كاش، وحوّل {depositPercent}% من إجمالي
          الطلب شامل الشحن باستخدام الرقم أو الباركود المناسب.
        </li>
        <li>
          بعد تسجيل الطلب والتحويل، افتح تتبع الطلب وارفع صورة إيصال التحويل.
          {orderNumber && (
            <>
              {" "}
              <a href={`/track-order?order=${encodeURIComponent(orderNumber)}`}>
                تتبع الطلب ورفع الإيصال
              </a>
            </>
          )}
        </li>
        <li>
          سنراجع الإيصال ونطابقه مع المبلغ الوارد. إذا تم التأكد منه سنؤكد
          الطلب فورًا، وإذا ظهرت مشكلة سنتواصل معك لإعادة التحويل.
        </li>
      </ol>

      <div className="payment-instructions-copy">
        <span>رقم التحويل لفودافون كاش:</span>
        <a className="payment-instructions-phone" href="tel:+201061004311" dir="ltr">
          +201061004311
        </a>
      </div>

      <div className="payment-qr-grid">
        <figure className="payment-qr-card">
          <figcaption>إنستاباي</figcaption>
          <img
            src="/images/payment/instapay-qr.jpeg"
            alt="باركود الدفع عبر إنستاباي"
          />
        </figure>

        <figure className="payment-qr-card">
          <figcaption>فودافون كاش</figcaption>
          <img
            src="/images/payment/vodafone-cash-qr.jpeg"
            alt="باركود الدفع عبر فودافون كاش"
          />
        </figure>
      </div>

      <p className="payment-instructions-note">
        يُدفع المتبقي {remainingPercent}% عند استلام الطلب.
      </p>
    </section>
  );
}
