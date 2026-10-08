import {

  useEffect,

  useMemo,

  useState,

} from "react";



import { Link } from "react-router-dom";



import { useCart } from "../context/CartContext";

import { STORE_CONFIG } from "../config/store";

import { egyptLocations } from "../data/egyptLocations";

import { createOrder } from "../services/orderService";



import {

  getShippingPriceByAddress,

  calculateCartWeightKg,

} from "../services/shippingService";



const DEPOSIT_PERCENTAGE = 0.20;



export default function Checkout() {

  const {

    cart,

    cartTotal,

    increaseQuantity,

    decreaseQuantity,

    removeFromCart,

    clearCart,

  } = useCart();



  const [form, setForm] = useState({

    name: "",

    phone: "",

    governorate: "",

    area: "",

    address: "",

    notes: "",

  });



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



  function formatWeight(

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



    setForm(

      (current) => {

        if (

          name ===

          "governorate"

        ) {

          return {

            ...current,

            governorate:

              value,

            area: "",

          };

        }



        return {

          ...current,

          [name]: value,

        };

      }

    );



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

        createdOrder.orderNumber

      );



      setSubmitted(true);



      /*

       * Clear cart ONLY after

       * successful order creation.

       */



      clearCart();

    } catch (error) {

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



  function sendWhatsApp() {

    if (

      !submittedOrder

    ) {

      return;

    }



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



          if (

            item.weight

          ) {

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



          return `• ${

            item.name

          }${variantText} × ${

            item.quantity

          } = ${formatPrice(

            itemTotal

          )} ${

            STORE_CONFIG.currency

          }`;

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



المحافظة:

${submittedOrder.customer.governorate}



المنطقة:

${submittedOrder.customer.area}



العنوان:

${submittedOrder.customer.address}



الوزن الإجمالي:

${formatWeight(

  submittedOrder.totalWeightKg

)} كجم



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



المقدم المطلوب 20%:

${formatPrice(

  submittedOrder.depositAmount

)} ${STORE_CONFIG.currency}



المتبقي عند الاستلام 80%:

${formatPrice(

  submittedOrder.remainingAmount

)} ${STORE_CONFIG.currency}



طريقة الدفع:

تحويل 20% مقدم + 80% عند الاستلام



ملاحظات:

${

  submittedOrder.customer

    .notes || "لا توجد"

}



برجاء إرسال إيصال تحويل المقدم بعد إتمام التحويل.



شكراً لاختياركم بيرنا فوودز ❤️`;



    const whatsappUrl =

      `https://wa.me/${STORE_CONFIG.whatsapp}?text=` +

      encodeURIComponent(

        message

      );



    window.open(

      whatsappUrl,

      "_blank",

      "noopener,noreferrer"

    );

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

              الخطوة التالية هي تحويل قيمة

              المقدم وإرسال إيصال التحويل.

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

              في انتظار دفع المقدم

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

                    وزن الشحنة

                  </span>



                  <strong>

                    {formatWeight(

                      submittedOrder.totalWeightKg

                    )} كجم

                  </strong>

                </div>



                <div className="payment-summary-row">

                  <span>

                    المقدم المطلوب 20%

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

                    المتبقي عند الاستلام 80%

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

                  تحويل 20% مقدم، ثم دفع

                  الـ80% المتبقية عند استلام الطلب.

                </div>



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

                    البيانات المطلوبة لتأكيد الطلب.

                  </p>

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

                    رقم الموبايل *

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





            {/* SHIPPING */}



            <section className="checkout-card">



              <div className="checkout-card-heading">



                <span>

                  03

                </span>



                <div>

                  <h2>

                    تكلفة الشحن

                  </h2>



                  <p>

                    يتم حساب تكلفة الشحن تلقائيًا

                    حسب المنطقة ووزن الشحنة.

                  </p>

                </div>



              </div>





              <div className="shipping-checkout-box">



                {!form.governorate && (

                  <>

                    <div className="shipping-icon">

                      🚚

                    </div>



                    <div>

                      <strong>

                        اختر المحافظة أولًا

                      </strong>



                      <small>

                        سيتم حساب الشحن حسب وزن

                        المنتجات والمنطقة.

                      </small>

                    </div>

                  </>

                )}





                {form.governorate &&

                  !form.area && (

                    <>

                      <div className="shipping-icon">

                        📍

                      </div>



                      <div>

                        <strong>

                          اختر المنطقة

                        </strong>



                        <small>

                          اختر المركز / المدينة

                          لحساب تكلفة الشحن.

                        </small>

                      </div>

                    </>

                  )}





                {isLoadingShipping && (

                  <>

                    <div className="shipping-icon">

                      🚚

                    </div>



                    <div>

                      <strong>

                        جاري حساب تكلفة الشحن...

                      </strong>



                      <small>

                        يتم حساب السعر حسب وزن

                        الشحنة.

                      </small>

                    </div>

                  </>

                )}





                {!isLoadingShipping &&

                  shippingData && (

                    <>

                      <div className="shipping-icon">

                        🚚

                      </div>



                      <div>

                        <strong>

                          {formatPrice(

                            shippingData.shippingPrice

                          )}{" "}

                          {

                            STORE_CONFIG.currency

                          }

                        </strong>



                        <small>

                          وزن الشحنة:{" "}

                          {formatWeight(

                            totalWeightKg

                          )}{" "}

                          كجم

                          {" — "}

                          {shippingData.zoneName

                            ? `منطقة الشحن: ${shippingData.zoneName}`

                            : "تم تحديد تكلفة الشحن"}

                        </small>

                      </div>



                      <div className="shipping-selected">

                        ✓

                      </div>

                    </>

                  )}





                {!isLoadingShipping &&

                  !shippingData &&

                  form.area &&

                  shippingError && (

                    <>

                      <div className="shipping-icon">

                        ⚠️

                      </div>



                      <div>

                        <strong>

                          تعذر تحديد الشحن

                        </strong>



                        <small>

                          {

                            shippingError

                          }

                        </small>

                      </div>

                    </>

                  )}



              </div>



            </section>





            {/* PAYMENT */}



            <section className="checkout-card">



              <div className="checkout-card-heading">



                <span>

                  04

                </span>



                <div>

                  <h2>

                    طريقة الدفع

                  </h2>



                  <p>

                    دفع مقدم 20% ثم 80% عند الاستلام.

                  </p>

                </div>



              </div>





              <div className="payment-option">



                <div className="payment-icon">

                  💳

                </div>



                <div>

                  <strong>

                    20% مقدم + 80% عند الاستلام

                  </strong>



                  <small>

                    يتم تحويل المقدم وإرسال

                    إيصال التحويل لمراجعة الإدارة.

                  </small>

                </div>



                <div className="payment-selected">

                  ✓

                </div>



              </div>



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

                        key={

                          item.sku ||

                          item.id

                        }

                      >



                        <div className="checkout-item-icon">

                          {item.image ? (

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





                          <div className="checkout-item-controls">



                            <div className="quantity-controls">



                              <button

                                type="button"

                                onClick={() =>

                                  decreaseQuantity(

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



                          {formatPrice(

                            Number(

                              item.price

                            ) *

                              Number(

                                item.quantity

                              )

                          )}{" "}

                          {

                            STORE_CONFIG.currency

                          }



                        </strong>



                      </div>

                    );

                  }

                )}



              </div>





              <div className="summary-lines">



                <div>

                  <span>

                    المنتجات

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





                <div>

                  <span>

                    وزن الشحنة

                  </span>



                  <strong>

                    {formatWeight(

                      totalWeightKg

                    )}{" "}

                    كجم

                  </strong>

                </div>





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

                    المقدم المطلوب 20%

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

                    المتبقي عند الاستلام 80%

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

                تحويل 20% مقدم،

                والباقي 80% عند الاستلام.



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