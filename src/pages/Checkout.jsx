import {

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";



import { Link } from "react-router-dom";



import { useCart } from "../context/CartContext";

import { STORE_CONFIG } from "../config/store";

import { egyptLocations } from "../data/egyptLocations";

import PaymentInstructions from "../components/PaymentInstructions";

import { createOrder } from "../services/orderService";
import { trackMetaEvent } from "../utils/metaPixel";



import {

  getShippingPriceByAddress,

  calculateCartWeightKg,

} from "../services/shippingService";



const DEPOSIT_PERCENTAGE = 0.50;
const CUSTOMER_DETAILS_STORAGE_KEY = "berna-customer-details";
const EMPTY_CUSTOMER_DETAILS = {
  name: "",
  phone: "",
  phoneSecondary: "",
  whatsappPhone: "",
  email: "",
  governorate: "",
  area: "",
  address: "",
  notes: "",
};

function readSavedCustomerDetails() {
  try {
    const savedDetails = JSON.parse(
      localStorage.getItem(CUSTOMER_DETAILS_STORAGE_KEY) || "{}"
    );
    if (
      !savedDetails ||
      typeof savedDetails !== "object" ||
      Array.isArray(savedDetails)
    ) {
      return { ...EMPTY_CUSTOMER_DETAILS };
    }

    return Object.fromEntries(
      Object.keys(EMPTY_CUSTOMER_DETAILS).map((field) => [
        field,
        typeof savedDetails[field] === "string"
          ? savedDetails[field]
          : "",
      ])
    );
  } catch (error) {
    console.error("Read saved customer details error:", error);
    return { ...EMPTY_CUSTOMER_DETAILS };
  }
}



export default function Checkout() {

  const {

    cart,

    cartTotal,

    increaseQuantity,

    decreaseQuantity,

    removeFromCart,

    clearCart,

  } = useCart();

  const checkoutStarted = useRef(false);

  useEffect(() => {
    if (cart.length === 0 || checkoutStarted.current) {
      return;
    }

    const contents = cart
      .map((item) => {
        const id = item.bundleOfferId || item.sku || item.id;
        const quantity = Number(item.quantity);
        const itemPrice = Number(item.price);

        if (
          !id ||
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(itemPrice) ||
          itemPrice < 0
        ) {
          return null;
        }

        return {
          id: String(id),
          quantity,
          item_price: itemPrice,
        };
      })
      .filter(Boolean);

    if (contents.length === 0) {
      return;
    }

    checkoutStarted.current = trackMetaEvent("InitiateCheckout", {
      value: cartTotal,
      currency: "EGP",
      content_ids: contents.map((item) => item.id),
      contents,
      content_type: "product",
      num_items: contents.reduce((total, item) => total + item.quantity, 0),
    });
  }, [cart, cartTotal]);



  const [form, setForm] = useState(readSavedCustomerDetails);
  const [customerDetailsSaveError, setCustomerDetailsSaveError] =
    useState("");

  function saveCustomerDetails(details) {
    try {
      localStorage.setItem(
        CUSTOMER_DETAILS_STORAGE_KEY,
        JSON.stringify(details)
      );
      setCustomerDetailsSaveError("");
    } catch (error) {
      console.error("Save customer details error:", error);
      setCustomerDetailsSaveError(
        "تعذر حفظ بياناتك على هذا الجهاز."
      );
    }
  }



  const [

    shippingData,

    setShippingData,

  ] = useState(null);



  const [

    isLoadingShipping,

    setIsLoadingShipping,

  ] = useState(false);



  const [

    shippingError,

    setShippingError,

  ] = useState("");



  const [

    submitted,

    setSubmitted,

  ] = useState(false);



  const [

    orderNumber,

    setOrderNumber,

  ] = useState("");



  const [

    submittedOrder,

    setSubmittedOrder,

  ] = useState(null);



  const [

    isSubmitting,

    setIsSubmitting,

  ] = useState(false);



  const [

    submitError,

    setSubmitError,

  ] = useState("");





  /*

   * ==========================================

   * CART WEIGHT

   * ==========================================

   */



  const totalWeightKg = useMemo(

    () =>

      calculateCartWeightKg(

        cart

      ),

    [cart]
  );

  const promoSavings = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Math.max(
            0,
            Number(item.originalPrice || item.price || 0) -
              Number(item.price || 0)
          ) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );





  /*

   * ==========================================

   * MONEY

   * ==========================================

   */



  const shipping =

    shippingData?.shippingPrice ??

    null;



  const grandTotal =

    shipping === null

      ? null

      : Number(

          (

            Number(

              cartTotal || 0

            ) +

            Number(

              shipping || 0

            )

          ).toFixed(2)

        );



  const depositAmount =

    grandTotal === null

      ? null

      : Number(

          (

            grandTotal *

            DEPOSIT_PERCENTAGE

          ).toFixed(2)

        );



  const remainingAmount =

    grandTotal === null

      ? null

      : Number(

          (

            grandTotal -

            depositAmount

          ).toFixed(2)

        );





  /*

   * ==========================================

   * FORMAT

   * ==========================================

   */



  function formatPrice(

    value

  ) {

    return Number(

      value || 0

    ).toFixed(2);

  }



  /*

   * ==========================================

   * SHIPPING

   * ==========================================

   */



  useEffect(() => {

    let cancelled = false;



    async function loadShipping() {

      if (

        !form.governorate ||

        !form.area

      ) {

        setShippingData(null);

        setShippingError("");

        return;

      }



      if (

        totalWeightKg <= 0

      ) {

        setShippingData(null);



        setShippingError(

          "تعذر تحديد وزن الشحنة من المنتجات."

        );



        return;

      }



      setIsLoadingShipping(true);

      setShippingError("");

      setShippingData(null);



      try {

        const result =

          await getShippingPriceByAddress(

            form.governorate,

            form.area,

            totalWeightKg

          );



        if (cancelled) {

          return;

        }



        if (!result) {

          setShippingData(null);



          setShippingError(

            "لا يوجد نطاق شحن أو قاعدة وزن متاحة لهذه المنطقة حاليًا."

          );



          return;

        }



        setShippingData(

          result

        );

      } catch (error) {

        if (cancelled) {

          return;

        }



        console.error(

          "Checkout shipping error:",

          error

        );



        setShippingData(null);



        setShippingError(

          error?.message ||

            "تعذر تحديد تكلفة الشحن."

        );

      } finally {

        if (!cancelled) {

          setIsLoadingShipping(

            false

          );

        }

      }

    }



    loadShipping();



    return () => {

      cancelled = true;

    };

  }, [

    form.governorate,

    form.area,

    totalWeightKg,

  ]);





  /*

   * ==========================================

   * FORM

   * ==========================================

   */



  function handleChange(

    event

  ) {

    const {

      name,

      value,

    } = event.target;



    const updatedForm =
      name === "governorate"
        ? { ...form, governorate: value, area: "" }
        : { ...form, [name]: value };

    setForm(updatedForm);
    saveCustomerDetails(updatedForm);



    if (

      name ===

        "governorate" ||

      name === "area"

    ) {

      setSubmitError("");

    }

  }





  /*

   * ==========================================

   * SUBMIT

   * ==========================================

   */



  async function handleSubmit(

    event

  ) {

    event.preventDefault();



    if (

      cart.length === 0 ||

      isSubmitting

    ) {

      return;

    }



    if (

      !form.governorate ||

      !form.area

    ) {

      setSubmitError(

        "برجاء اختيار المحافظة والمنطقة أولًا."

      );



      return;

    }



    if (

      totalWeightKg <= 0

    ) {

      setSubmitError(

        "تعذر تحديد وزن الشحنة."

      );



      return;

    }



    if (

      isLoadingShipping

    ) {

      setSubmitError(

        "جاري حساب تكلفة الشحن، برجاء الانتظار."

      );



      return;

    }



    if (
      !shippingData ||
      shipping === null

    ) {

      setSubmitError(

        "تعذر تحديد تكلفة الشحن لهذه المنطقة."

      );



      return;
    }

    let whatsappWindow = null;
    try {
      whatsappWindow = window.open("about:blank", "_blank");
      if (whatsappWindow) {
        whatsappWindow.document.title = "بيرنا فوودز";
        whatsappWindow.document.body.textContent =
          "جارٍ تجهيز تفاصيل طلبك للانتقال إلى واتساب...";
        whatsappWindow.opener = null;
      }
    } catch (error) {
      console.error("Open WhatsApp tab error:", error);
    }

    setIsSubmitting(true);

    setSubmitError("");



    try {

      /*

       * Recalculate immediately before

       * creating the order.

       */



      const freshShipping =

        await getShippingPriceByAddress(

          form.governorate,

          form.area,

          totalWeightKg

        );



      if (!freshShipping) {

        throw new Error(

          "لا يوجد سعر شحن متاح لهذه المنطقة والوزن حاليًا."

        );

      }



      const finalShipping =

        Number(

          freshShipping.shippingPrice ||

            0

        );



      const finalTotal =

        Number(

          (

            Number(

              cartTotal || 0

            ) +

            finalShipping

          ).toFixed(2)

        );



      const finalDeposit =

        Number(

          (

            finalTotal *

            DEPOSIT_PERCENTAGE

          ).toFixed(2)

        );



      const finalRemaining =

        Number(

          (

            finalTotal -

            finalDeposit

          ).toFixed(2)

        );





      /*

       * Create order

       */



      const createdOrder =

        await createOrder({

          customer: {

            ...form,

          },



          items: [

            ...cart,

          ],



          subtotal:

            Number(

              cartTotal.toFixed(2)

            ),



          /*

           * Shipping

           */



          shipping:

            finalShipping,



          total:

            finalTotal,



          /*

           * Weight

           */



          totalWeightKg:

            Number(

              totalWeightKg.toFixed(

                3

              )

            ),



          /*

           * Shipping location

           */



          shippingLocationId:

            freshShipping.locationId,



          shippingZoneId:

            freshShipping.zoneId,



          shippingZoneName:

            freshShipping.zoneName,



          shippingWeightRuleId:

            freshShipping.weightRuleId,



          shippingMinWeightKg:

            freshShipping.minWeightKg,



          shippingMaxWeightKg:

            freshShipping.maxWeightKg,



          /*

           * Payment

           */



          depositAmount:

            finalDeposit,



          remainingAmount:

            finalRemaining,

        });



      setSubmittedOrder(

        createdOrder

      );



      setOrderNumber(

      );

      setSubmitted(true);

      if (whatsappWindow) {
        try {
          sendWhatsApp(createdOrder, whatsappWindow);
        } catch (error) {
          console.error("Prepare order WhatsApp message error:", error);
        }
      }



      /*

       * Clear cart ONLY after

       * successful order creation.

       */



      clearCart();

    } catch (error) {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close();
      }

      console.error(

        "Checkout submit error:",

        error

      );



      setSubmitError(

        error?.message ||

          "حصلت مشكلة أثناء إرسال الطلب. حاول مرة أخرى."

      );

    } finally {

      setIsSubmitting(

        false

      );

    }

  }





  /*

   * ==========================================

   * WHATSAPP

   * ==========================================

   */



  function sendWhatsApp(
    targetOrder = submittedOrder,
    whatsappWindow = null
  ) {

    if (
      !targetOrder
    ) {
      return;
    }

    const submittedOrder = targetOrder;



    const itemsText =

      submittedOrder.items

        .map((item) => {

          const itemTotal =

            Number(

              item.price || 0

            ) *

            Number(

              item.quantity || 0

            );



          const variantParts =
            [];

          if (item.bundleOfferId) {
            const components = (item.bundleItems || [])
              .map(
                (component) =>
                  `  - ${component.name} ${component.weight} × ${component.quantity}`
              )
              .join("\n");
            return `• باقة ${item.bundleName} × ${item.quantity} = ${formatPrice(itemTotal)} ${STORE_CONFIG.currency}${components ? `\n${components}` : ""}`;
          }

          if (item.weight) {
            variantParts.push(
              item.weight

            );

          }
const variantText =

            variantParts.length

              ? ` — ${variantParts.join(

                  " — "

                )}`

              : "";



          const promotionText = item.promotionLabel
            ? ` — ${item.promotionLabel} (${item.discountPercent}%)`
            : "";

          return `• ${
            item.name
          }${variantText} × ${
            item.quantity
          } = ${formatPrice(
            itemTotal
          )} ${
            STORE_CONFIG.currency
          }${promotionText}`;

        })

        .join("\n");



    const message = `أهلاً بيرنا فوودز ❤️



طلب جديد من الموقع



رقم الطلب:

${submittedOrder.orderNumber}



العميل:

${submittedOrder.customer.name}



الموبايل:

${submittedOrder.customer.phone}

رقم موبايل بديل:

${submittedOrder.customer.phoneSecondary}

البريد الإلكتروني:

${submittedOrder.customer.email || "غير مضاف"}



المحافظة:

${submittedOrder.customer.governorate}



المنطقة:

${submittedOrder.customer.area}



العنوان:

${submittedOrder.customer.address}



منطقة الشحن:

${

  submittedOrder.shippingZoneName ||

  "غير محددة"

}



المنتجات:

${itemsText}



إجمالي المنتجات:

${formatPrice(

  submittedOrder.subtotal

)} ${STORE_CONFIG.currency}



الشحن:

${

  Number(

    submittedOrder.shipping

  ) === 0

    ? "مجاني"

    : `${formatPrice(

        submittedOrder.shipping

      )} ${

        STORE_CONFIG.currency

      }`

}



الإجمالي:

${formatPrice(

  submittedOrder.total

)} ${STORE_CONFIG.currency}



جدية الحجز المطلوبة 50%:

${formatPrice(

  submittedOrder.depositAmount

)} ${STORE_CONFIG.currency}



المتبقي عند الاستلام 50%:

${formatPrice(

  submittedOrder.remainingAmount

)} ${STORE_CONFIG.currency}



طريقة الدفع:

تحويل جدية حجز 50% + 50% عند الاستلام



ملاحظات:

${

  submittedOrder.customer

    .notes || "لا توجد"

}



برجاء تحويل قيمة جدية الحجز ثم رفع صورة الإيصال من خلال رابط تتبع الطلب أدناه.

بعد اعتماد جدية الحجز سيتم تأكيد الطلب وشحنه خلال يومي عمل من تاريخ الاعتماد.

تتبع الطلب ورفع الإيصال:

${window.location.origin}/track-order?order=${encodeURIComponent(
  submittedOrder.orderNumber
)}

في حالة إرجاع الطلب يتحمل العميل قيمة الشحن.



شكراً لاختياركم بيرنا فوودز ❤️`;



    const whatsappUrl =

      `https://wa.me/${STORE_CONFIG.whatsapp}?text=` +

      encodeURIComponent(

        message

      );



    if (whatsappWindow) {
      try {
        if (!whatsappWindow.closed) {
          whatsappWindow.location.href = whatsappUrl;
        }
      } catch (error) {
        console.error("Navigate to WhatsApp error:", error);
      }
      return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

  }





  /*

   * ==========================================

   * SUCCESS

   * ==========================================

   */



  if (submitted) {

    return (

      <main

        className="checkout-page"

        dir="rtl"

      >

        <div className="container">



          <div className="checkout-success">



            <div className="checkout-success-icon">

              ✓

            </div>



            <span className="eyebrow">

              BERNA FOODS

            </span>



            <h1>

              تم استلام طلبك بنجاح 🎉

            </h1>



            <p>
              تم تسجيل طلبك بنجاح.
              <br />
              حوّل جدية الحجز وارفع الإيصال عبر رابط التتبع.
              <br />
              بعد اعتماد الدفع سيتم شحن الطلب خلال يومي عمل.
            </p>



            <div className="success-order-number">



              <small>

                رقم الطلب

              </small>



              <strong>

                {orderNumber}

              </strong>



            </div>



            <div className="success-status">

              <span>●</span>

              في انتظار دفع جدية الحجز

            </div>



            {submittedOrder && (

              <div

                className="payment-summary-card"

                dir="rtl"

              >



                <h2>

                  تفاصيل الدفع

                </h2>



                <div className="payment-summary-row">

                  <span>

                    إجمالي الطلب

                  </span>



                  <strong>

                    {formatPrice(

                      submittedOrder.total

                    )}{" "}

                    {

                      STORE_CONFIG.currency

                    }

                  </strong>

                </div>



                <div className="payment-summary-row">

                  <span>

                    جدية الحجز المطلوبة 50%

                  </span>



                  <strong>

                    {formatPrice(

                      submittedOrder.depositAmount

                    )}{" "}

                    {

                      STORE_CONFIG.currency

                    }

                  </strong>

                </div>



                <div className="payment-summary-row">

                  <span>

                    المتبقي عند الاستلام 50%

                  </span>



                  <strong>

                    {formatPrice(

                      submittedOrder.remainingAmount

                    )}{" "}

                    {

                      STORE_CONFIG.currency

                    }

                  </strong>

                </div>



                <div className="payment-method-note">

                  <strong>

                    طريقة الدفع:

                  </strong>{" "}

                  تحويل جدية حجز 50%، ثم دفع
                  الـ50% المتبقية عند استلام الطلب.
                </div>

                <PaymentInstructions
                  amountLabel={`${formatPrice(
                    submittedOrder.depositAmount
                  )} ${STORE_CONFIG.currency}`}
                  orderNumber={submittedOrder.orderNumber}
                />



              </div>

            )}



            <div className="success-actions">



              <button

                type="button"

                className="success-whatsapp"

                onClick={

                  sendWhatsApp

                }

              >

                💬 إرسال تفاصيل الطلب على WhatsApp

              </button>



              <Link

                to={`/track-order?order=${orderNumber}`}

                className="success-track"

              >

                🔎 تتبع الطلب

              </Link>



              <Link

                to="/products"

                className="success-shopping"

              >

                مواصلة التسوق

              </Link>



            </div>



            <p className="success-note">

              احتفظ برقم الطلب
              <br />
              لاستخدامه في متابعة حالة الطلب
              وإرسال إيصال التحويل.
              <br />
              إذا لم يفتح واتساب تلقائيًا، اضغط زر إرسال تفاصيل الطلب.
            </p>



          </div>



        </div>

      </main>

    );

  }





  /*

   * ==========================================

   * EMPTY CART

   * ==========================================

   */



  if (

    cart.length === 0

  ) {

    return (

      <main

        className="checkout-page"

        dir="rtl"

      >

        <div className="container">



          <div className="empty-checkout">



            <div className="empty-checkout-icon">

              🛒

            </div>



            <span className="eyebrow">

              BERNA FOODS

            </span>



            <h1>

              السلة فاضية

            </h1>



            <p>

              أضف بعض المنتجات للسلة الأول

              علشان تقدر تكمل الطلب.

            </p>



            <Link

              to="/products"

              className="primary-btn"

            >

              تصفح المنتجات

            </Link>



          </div>



        </div>

      </main>

    );

  }





  /*

   * ==========================================

   * CHECKOUT

   * ==========================================

   */



  return (

    <main

      className="checkout-page"

      dir="rtl"

    >

      <div className="container">



        <div className="checkout-header">



          <span className="eyebrow">

            BERNA FOODS

          </span>



          <h1>

            إتمام الطلب

          </h1>



          <p>

            أدخل بياناتك علشان نقدر نوصل

            طلبك لحد باب البيت.

          </p>



        </div>





        <div className="checkout-layout">



          {/* ================= FORM ================= */}



          <form

            className="checkout-form"

            onSubmit={

              handleSubmit

            }

          >



            {/* CUSTOMER */}



            <section className="checkout-card">



              <div className="checkout-card-heading">



                <span>

                  01

                </span>



                <div>

                  <h2>

                    بيانات العميل

                  </h2>



                  <p>

                    بياناتك تُحفظ على هذا الجهاز لتسهيل طلبك القادم.

                  </p>

                  {customerDetailsSaveError && (
                    <p role="alert">
                      {customerDetailsSaveError}
                    </p>
                  )}

                </div>



              </div>





              <div className="form-grid">



                <div className="form-field">



                  <label>

                    الاسم بالكامل *

                  </label>



                  <input

                    type="text"

                    name="name"

                    value={

                      form.name

                    }

                    onChange={

                      handleChange

                    }

                    placeholder="اكتب اسمك"

                    required

                  />



                </div>





                <div className="form-field">



                  <label>

                    رقم الموبايل الأول *

                  </label>



                  <input

                    type="tel"

                    name="phone"

                    value={

                      form.phone

                    }

                    onChange={

                      handleChange

                    }

                    placeholder="01xxxxxxxxx"

                    required

                  />

                </div>

                <div className="form-field">

                  <label>
                    رقم الموبايل الثاني
                  </label>

                  <input
                    type="tel"
                    name="phoneSecondary"
                    value={form.phoneSecondary}
                    onChange={handleChange}
                    placeholder="01xxxxxxxxx"
                  />

                </div>

                <div className="form-field">
                  <label>
                    رقم واتساب لإرسال تأكيد الطلب (اختياري)
                  </label>
                  <input
                    type="tel"
                    name="whatsappPhone"
                    value={form.whatsappPhone}
                    onChange={handleChange}
                    placeholder="اكتب رقم واتساب مع كود الدولة"
                    autoComplete="tel"
                  />
                  <small>
                    لن نستخدم رقم الموبايل الأساسي لرسائل واتساب؛ اكتب رقم واتساب هنا
                    إذا أردت استلام تأكيد الدفع عليه.
                  </small>
                </div>

                <div className="form-field">
                  <label>
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </div>

              </div>



            </section>





            {/* ADDRESS */}



            <section className="checkout-card">



              <div className="checkout-card-heading">



                <span>

                  02

                </span>



                <div>

                  <h2>

                    عنوان التوصيل

                  </h2>



                  <p>

                    اكتب العنوان بالتفصيل علشان

                    نوصل طلبك بسهولة.

                  </p>

                </div>



              </div>





              <div className="form-grid">



                <div className="form-field">



                  <label>

                    المحافظة *

                  </label>



                  <select

                    name="governorate"

                    value={

                      form.governorate

                    }

                    onChange={

                      handleChange

                    }

                    required

                  >



                    <option value="">

                      اختر المحافظة

                    </option>



                    {Object.keys(

                      egyptLocations

                    ).map(

                      (

                        governorate

                      ) => (

                        <option

                          key={

                            governorate

                          }

                          value={

                            governorate

                          }

                        >

                          {

                            governorate

                          }

                        </option>

                      )

                    )}



                  </select>



                </div>





                <div className="form-field">



                  <label>

                    المركز / المدينة *

                  </label>



                  <select

                    name="area"

                    value={

                      form.area

                    }

                    onChange={

                      handleChange

                    }

                    disabled={

                      !form.governorate

                    }

                    required

                  >



                    <option value="">

                      {form.governorate

                        ? "اختر المركز / المدينة"

                        : "اختر المحافظة أولاً"}

                    </option>



                    {form.governorate &&

                      egyptLocations[

                        form.governorate

                      ]?.map(

                        (

                          location

                        ) => (

                          <option

                            key={

                              location

                            }

                            value={

                              location

                            }

                          >

                            {

                              location

                            }

                          </option>

                        )

                      )}



                  </select>



                </div>





                <div className="form-field full">



                  <label>

                    العنوان بالتفصيل *

                  </label>



                  <textarea

                    name="address"

                    value={

                      form.address

                    }

                    onChange={

                      handleChange

                    }

                    placeholder="اسم الشارع، رقم المنزل، الدور، علامة مميزة..."

                    rows="4"

                    required

                  />



                </div>





                <div className="form-field full">



                  <label>

                    ملاحظات إضافية

                  </label>



                  <textarea

                    name="notes"

                    value={

                      form.notes

                    }

                    onChange={

                      handleChange

                    }

                    placeholder="أي ملاحظات خاصة بالطلب..."

                    rows="3"

                  />



                </div>



              </div>



            </section>





            {/* PAYMENT */}



            <section className="checkout-card">



              <div className="checkout-card-heading">



                <span>

                  03

                </span>



                <div>

                  <h2>

                    طريقة الدفع

                  </h2>



                  <p>

                    جدية حجز 50% ثم 50% عند الاستلام.

                  </p>

                </div>



              </div>





              <div className="payment-option">



                <div className="payment-icon">

                  💳

                </div>



                <div>

                  <strong>

                    جدية حجز 50% + 50% عند الاستلام

                  </strong>



                  <small>

                    يتم تحويل جدية الحجز وإرسال
                    إيصال التحويل لمراجعة الإدارة.

                  </small>

                </div>



                <div className="payment-selected">

                  ✓

                </div>



              </div>

              <PaymentInstructions
                amountLabel={
                  depositAmount === null
                    ? ""
                    : `${formatPrice(depositAmount)} ${STORE_CONFIG.currency}`
                }
              />

            </section>





            {submitError && (

              <div className="checkout-error">

                {

                  submitError

                }

              </div>

            )}





            <button

              type="submit"

              className="confirm-order-btn"

              disabled={

                isSubmitting ||

                isLoadingShipping ||

                !shippingData

              }

            >



              {isSubmitting

                ? "جاري إرسال الطلب..."

                : "تأكيد الطلب"}



              <span>

                ←

              </span>



            </button>



          </form>





          {/* ================= SUMMARY ================= */}



          <aside className="checkout-summary">



            <div className="checkout-card">



              <div className="summary-heading">



                <div>



                  <span className="eyebrow">

                    ORDER SUMMARY

                  </span>



                  <h2>

                    ملخص الطلب

                  </h2>



                </div>



                <span className="summary-count">

                  {cart.length}

                </span>



              </div>





              <div className="checkout-items">



                {cart.map(

                  (item) => {



                    const variantParts =

                      [];



                    if (

                      item.weight

                    ) {

                      variantParts.push(

                        item.weight

                      );

                    }
return (

                      <div

                        className="checkout-item"

                        key={item.cartLineId || item.sku || item.id}

                      >



                        <div className="checkout-item-icon">
                          {item.bundleItems?.length ? (
                            <div className="cart-bundle-thumbnails">
                              {item.bundleItems.slice(0, 4).map((component) => (
                                <span key={component.sku}>
                                  {component.image ? (
                                    <img src={component.image} alt="" loading="lazy" />
                                  ) : (
                                    "🍯"
                                  )}
                                </span>
                              ))}
                            </div>
                          ) : item.image ? (

                            <img
                              src={item.image}
                              alt={item.name}
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                display: "block",
                              }}
                            />

                          ) : (

                            item.icon || "🍯"

                          )}

                        </div>





                        <div className="checkout-item-info">



                          <strong>

                            {

                              item.name

                            }

                          </strong>



                          <small>



                            {variantParts.join(

                              " — "

                            )}



                            {item.sku && (

                              <>

                                {" — "}

                                SKU:{" "}

                                {

                                  item.sku

                                }

                              </>

                            )}



                          </small>

                          {item.promotionLabel && (
                            <small className="checkout-promotion-label">
                              {item.promotionLabel} · {item.discountPercent}%
                            </small>
                          )}

                          {item.bundleItems?.length > 0 && (
                            <ul className="checkout-bundle-components">
                              {item.bundleItems.map((component) => (
                                <li key={component.sku}>
                                  {component.name} · {component.weight} ×{" "}
                                  {component.quantity}
                                </li>
                              ))}
                            </ul>
                          )}



                          <div className="checkout-item-controls">



                            <div className="quantity-controls">



                              <button

                                type="button"

                                onClick={() =>

                                  decreaseQuantity(
                                    item.cartLineId ||
                                      item.sku ||
                                      item.id

                                  )

                                }

                              >

                                −

                              </button>



                              <strong>

                                {

                                  item.quantity

                                }

                              </strong>



                              <button

                                type="button"

                                onClick={() =>

                                  increaseQuantity(
                                    item.cartLineId ||
                                      item.sku ||
                                      item.id

                                  )

                                }

                              >

                                +

                              </button>



                            </div>





                            <button

                              type="button"

                              className="checkout-remove"

                              onClick={() =>

                                removeFromCart(
                                  item.cartLineId ||
                                    item.sku ||
                                    item.id

                                )

                              }

                            >

                              حذف

                            </button>



                          </div>



                        </div>





                        <strong className="checkout-item-price">

                          {item.originalPrice > item.price && (
                            <del>
                              {formatPrice(
                                Number(item.originalPrice) *
                                  Number(item.quantity)
                              )}{" "}
                              {STORE_CONFIG.currency}
                            </del>
                          )}
                          <span>
                            {formatPrice(
                              Number(item.price) *
                                Number(item.quantity)
                            )}{" "}
                            {STORE_CONFIG.currency}
                          </span>



                        </strong>



                      </div>

                    );

                  }

                )}



              </div>





              <div className="summary-lines">

                {promoSavings > 0 && (
                  <div>
                    <span>الإجمالي قبل العرض</span>
                    <strong>
                      {formatPrice(cartTotal + promoSavings)}{" "}
                      {STORE_CONFIG.currency}
                    </strong>
                  </div>
                )}

                <div>

                  <span>

                    {promoSavings > 0 ? "المنتجات بعد الخصم" : "المنتجات"}

                  </span>



                  <strong>

                    {formatPrice(

                      cartTotal

                    )}{" "}

                    {

                      STORE_CONFIG.currency

                    }

                  </strong>

                </div>

                {promoSavings > 0 && (
                  <div className="checkout-promo-savings">
                    <span>إجمالي الخصم</span>
                    <strong>
                      −{formatPrice(promoSavings)}{" "}
                      {STORE_CONFIG.currency}
                    </strong>
                  </div>
                )}




                <div>

                  <span>

                    الشحن

                  </span>



                  <strong>

                    {shipping === null

                      ? "—"

                      : `${formatPrice(

                          shipping

                        )} ${

                          STORE_CONFIG.currency

                        }`}

                  </strong>

                </div>



              </div>





              {!form.governorate && (

                <div className="free-shipping-hint">

                  🚚 اختر المحافظة والمنطقة

                  لمعرفة تكلفة الشحن.

                </div>

              )}





              {shippingError &&

                form.area &&

                !isLoadingShipping && (

                  <div className="free-shipping-hint">

                    ⚠️{" "}

                    {

                      shippingError

                    }

                  </div>

                )}





              <div className="grand-total">



                <span>

                  الإجمالي

                </span>



                <strong>

                  {grandTotal === null

                    ? "—"

                    : `${formatPrice(

                        grandTotal

                      )} ${

                        STORE_CONFIG.currency

                      }`}

                </strong>



              </div>





              <div className="checkout-deposit-preview">



                <div>



                  <span>

                    جدية الحجز المطلوبة 50%

                  </span>



                  <strong>

                    {depositAmount ===

                    null

                      ? "—"

                      : `${formatPrice(

                          depositAmount

                        )} ${

                          STORE_CONFIG.currency

                        }`}

                  </strong>



                </div>





                <div>



                  <span>

                    المتبقي عند الاستلام 50%

                  </span>



                  <strong>

                    {remainingAmount ===

                    null

                      ? "—"

                      : `${formatPrice(

                          remainingAmount

                        )} ${

                          STORE_CONFIG.currency

                        }`}

                  </strong>



                </div>



              </div>





              <div className="payment-method-note">



                <strong>

                  طريقة الدفع:

                </strong>{" "}

                تحويل جدية حجز 50%،
                والباقي 50% عند الاستلام.



              </div>





              <button

                type="button"

                className="clear-checkout-cart"

                onClick={

                  clearCart

                }

              >

                إفراغ السلة

              </button>



            </div>



          </aside>



        </div>



      </div>

    </main>

  );

}