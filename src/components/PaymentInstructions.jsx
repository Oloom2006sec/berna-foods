import "./payment-instructions.css";

export default function PaymentInstructions({ amountLabel }) {
  return (
    <section className="payment-instructions" aria-label="تعليمات الدفع">
      {amountLabel && (
        <p className="payment-instructions-amount">
          جدية الحجز المطلوبة: <strong>{amountLabel}</strong>
        </p>
      )}

      <p className="payment-instructions-copy">
        ادفع عبر إنستاباي أو فودافون كاش على الرقم:
      </p>

      <a className="payment-instructions-phone" href="tel:+201061004311" dir="ltr">
        +201061004311
      </a>

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
        امسح باركود وسيلة الدفع المناسبة، ثم أرسل إيصال التحويل. يُدفع باقي
        المبلغ عند استلام الطلب.
      </p>
    </section>
  );
}
