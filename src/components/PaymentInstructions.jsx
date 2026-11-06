import "./payment-instructions.css";

export default function PaymentInstructions({
  amountLabel,
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

      <p className="payment-instructions-steps">
        اختر إنستاباي أو فودافون كاش، وحوّل {depositPercent}% من إجمالي الطلب
        شامل الشحن باستخدام الرقم أو الباركود المناسب.
      </p>

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
      <p className="payment-instructions-note">
        في حالة إرجاع الطلب يتحمل العميل قيمة الشحن.
      </p>
    </section>
  );
}
