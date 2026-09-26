import { supabase } from "../lib/supabase";

const DEPOSIT_PERCENTAGE = 0.20;

/*
  ==========================================
  إنشاء رقم الطلب
  ==========================================
*/

function generateOrderNumber() {
  return `BR-${Math.floor(
    100000 + Math.random() * 900000
  )}`;
}

/*
  ==========================================
  إنشاء Receipt Token
  ==========================================
*/

function generateReceiptToken() {
  return crypto.randomUUID();
}

/*
  ==========================================
  تقريب المبالغ
  ==========================================
*/

function roundMoney(value) {
  return (
    Math.round(
      Number(value || 0) * 100
    ) / 100
  );
}

/*
  ==========================================
  إنشاء طلب جديد
  ==========================================
*/

export async function createOrder(orderData) {
  const orderNumber =
    orderData.orderNumber ||
    generateOrderNumber();

  const receiptToken =
    orderData.receiptToken ||
    generateReceiptToken();

  /*
    ==============================
    الحسابات المالية
    ==============================
  */

  const subtotal = roundMoney(
    orderData.subtotal
  );

  const shipping = roundMoney(
    orderData.shipping
  );

  const total = roundMoney(
    subtotal + shipping
  );

  const depositAmount = roundMoney(
    total * DEPOSIT_PERCENTAGE
  );

  const remainingAmount = roundMoney(
    total - depositAmount
  );

  /*
    ==============================
    نسخة الطلب المحلية
    ==============================
  */

  const order = {
    ...orderData,

    orderNumber,

    /*
      لا نحفظ receipt token
      في نسخة الطلب المحلية.
    */
    receiptToken: undefined,

    subtotal,

    shipping,

    total,

    depositAmount,

    depositPaid: 0,

    remainingAmount,

    paymentStatus:
      "deposit_required",

    receiptStatus:
      "not_uploaded",

    receiptUploadedAt:
      null,

    status:
      "new",

    createdAt:
      new Date().toISOString(),
  };

  /*
    ==========================================
    حفظ الطلب في Supabase
    ==========================================
  */

  const { error } =
    await supabase
      .from("orders")
      .insert({
        /*
          ==============================
          بيانات الطلب
          ==============================
        */

        order_number:
          orderNumber,

        /*
          الـ receipt token يظل داخل قاعدة البيانات
          ولا يتم إرساله للعميل من tracking RPC.
        */

        receipt_token:
          receiptToken,

        /*
          ==============================
          بيانات العميل
          ==============================
        */

        customer_name:
          orderData.customer?.name || "",

        customer_phone:
          orderData.customer?.phone || "",

        governorate:
          orderData.customer?.governorate || "",

        area:
          orderData.customer?.area || "",

        address:
          orderData.customer?.address || "",

        notes:
          orderData.customer?.notes || "",

        /*
          ==============================
          المنتجات
          ==============================
        */

        items:
          orderData.items || [],

        /*
          ==============================
          المبالغ
          ==============================
        */

        subtotal,

        shipping,

        total,

        /*
          ==============================
          المقدم والمتبقي
          ==============================
        */

        deposit_amount:
          depositAmount,

        deposit_paid:
          0,

        remaining_amount:
          remainingAmount,

        /*
          ==============================
          الدفع
          ==============================
        */

        payment_status:
          "deposit_required",

        payment_method:
          "دفع 20% مقدم + 80% عند الاستلام",

        /*
          ==============================
          الإيصال
          ==============================
        */

        receipt_status:
          "not_uploaded",

        receipt_uploaded_at:
          null,

        /*
          ==============================
          حالة الطلب
          ==============================
        */

        status:
          "new",
      });

  if (error) {
    console.error(
      "SUPABASE CREATE ORDER ERROR:",
      error
    );

    throw new Error(
      error.message ||
        "تعذر حفظ الطلب في قاعدة البيانات."
    );
  }

  /*
    ==========================================
    حفظ نسخة محلية للاحتياط
    ==========================================

    مهم:
    لا نحفظ receipt token في localStorage.
  */

  localStorage.setItem(
    "berna-last-order",
    JSON.stringify(order)
  );

  return order;
}

/*
  ==========================================
  جلب جميع الطلبات
  Admin فقط
  ==========================================
*/

export async function getOrders() {
  const {
    data,
    error,
  } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Get orders error:",
      error
    );

    throw new Error(
      error.message ||
        "تعذر تحميل الطلبات."
    );
  }

  return data || [];
}

/*
  ==========================================
  جلب طلب واحد للعميل
  عن طريق RPC آمن
  ==========================================
*/

export async function getOrder(orderNumber) {
  const normalizedNumber =
    String(orderNumber || "")
      .trim()
      .toUpperCase();

  if (!normalizedNumber) {
    return null;
  }

  /*
    القراءة من Supabase
    بدون كشف receipt_token
  */

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_order_tracking",
    {
      p_order_number:
        normalizedNumber,
    }
  );

  if (!error && data) {
    return data;
  }

  if (error) {
    console.error(
      "Get order tracking error:",
      error
    );
  }

  /*
    ==========================================
    Fallback للطلب المحفوظ
    على نفس الجهاز
    ==========================================
  */

  try {
    const saved =
      localStorage.getItem(
        "berna-last-order"
      );

    if (saved) {
      const localOrder =
        JSON.parse(saved);

      const localNumber =
        String(
          localOrder.orderNumber ||
            localOrder.order_number ||
            ""
        )
          .trim()
          .toUpperCase();

      if (
        localNumber ===
        normalizedNumber
      ) {
        return {
          ...localOrder,

          order_number:
            normalizedNumber,

          customer_name:
            localOrder.customer?.name ||
            localOrder.customer_name ||
            "",

          customer_phone:
            localOrder.customer?.phone ||
            localOrder.customer_phone ||
            "",

          governorate:
            localOrder.customer?.governorate ||
            localOrder.governorate ||
            "",

          area:
            localOrder.customer?.area ||
            localOrder.area ||
            "",

          address:
            localOrder.customer?.address ||
            localOrder.address ||
            "",

          notes:
            localOrder.customer?.notes ||
            localOrder.notes ||
            "",

          created_at:
            localOrder.createdAt ||
            localOrder.created_at ||
            null,

          subtotal:
            Number(
              localOrder.subtotal || 0
            ),

          shipping:
            Number(
              localOrder.shipping || 0
            ),

          total:
            Number(
              localOrder.total || 0
            ),

          deposit_amount:
            Number(
              localOrder.depositAmount ||
                localOrder.deposit_amount ||
                0
            ),

          deposit_paid:
            Number(
              localOrder.depositPaid ||
                localOrder.deposit_paid ||
                0
            ),

          remaining_amount:
            Number(
              localOrder.remainingAmount ||
                localOrder.remaining_amount ||
                0
            ),

          payment_status:
            localOrder.paymentStatus ||
            localOrder.payment_status ||
            "deposit_required",

          receipt_status:
            localOrder.receiptStatus ||
            localOrder.receipt_status ||
            "not_uploaded",

          receipt_uploaded_at:
            localOrder.receiptUploadedAt ||
            localOrder.receipt_uploaded_at ||
            null,

          /*
            لا نعيد receipt_token
            للواجهة.
          */

          receipt_token:
            undefined,

          status:
            localOrder.status ||
            "new",
        };
      }
    }
  } catch (localError) {
    console.error(
      "Local order fallback error:",
      localError
    );
  }

  return null;
}

/*
  ==========================================
  تحديث حالة الطلب
  Admin
  ==========================================
*/

export async function updateOrderStatus(
  orderNumber,
  status
) {
  const normalizedNumber =
    String(orderNumber || "")
      .trim()
      .toUpperCase();

  if (!normalizedNumber) {
    throw new Error(
      "رقم الطلب غير موجود."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("orders")
    .update({
      status,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "order_number",
      normalizedNumber
    )
    .select()
    .single();

  if (error) {
    console.error(
      "Update order status error:",
      error
    );

    throw new Error(
      error.message ||
        "تعذر تحديث حالة الطلب."
    );
  }

  return data;
}

/*
  ==========================================
  تحديث حالة المقدم
  Admin
  ==========================================
*/

export async function updateDepositStatus(
  orderNumber,
  depositPaid
) {
  const normalizedNumber =
    String(orderNumber || "")
      .trim()
      .toUpperCase();

  if (!normalizedNumber) {
    throw new Error(
      "رقم الطلب غير موجود."
    );
  }

  const {
    data: order,
    error: getError,
  } = await supabase
    .from("orders")
    .select(
      "total, deposit_amount"
    )
    .eq(
      "order_number",
      normalizedNumber
    )
    .single();

  if (getError) {
    console.error(
      "Get payment data error:",
      getError
    );

    throw new Error(
      getError.message ||
        "تعذر قراءة بيانات الطلب."
    );
  }

  const paid =
    roundMoney(
      depositPaid
    );

  const total =
    roundMoney(
      order.total
    );

  const depositAmount =
    roundMoney(
      order.deposit_amount
    );

  const remainingAmount =
    roundMoney(
      Math.max(
        0,
        total - paid
      )
    );

  let paymentStatus =
    "deposit_required";

  if (paid >= total) {
    paymentStatus =
      "fully_paid";
  } else if (
    paid >= depositAmount
  ) {
    paymentStatus =
      "deposit_paid";
  }

  const {
    data,
    error,
  } = await supabase
    .from("orders")
    .update({
      deposit_paid:
        paid,

      remaining_amount:
        remainingAmount,

      payment_status:
        paymentStatus,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "order_number",
      normalizedNumber
    )
    .select()
    .single();

  if (error) {
    console.error(
      "Update deposit error:",
      error
    );

    throw new Error(
      error.message ||
        "تعذر تحديث حالة الدفع."
    );
  }

  return data;
}

/*
  ==========================================
  الحصول على Receipt Upload Token
  ==========================================

  مهم جداً:

  الـ token لا يأتي من:
  - getOrder()
  - localStorage
  - URL
  - React state

  وإنما يتم الحصول عليه من RPC آمن
  عند الحاجة فقط.
  ==========================================
*/

export async function getReceiptUploadToken(
  orderNumber
) {
  const normalizedNumber =
    String(orderNumber || "")
      .trim()
      .toUpperCase();

  if (!normalizedNumber) {
    throw new Error(
      "رقم الطلب غير موجود."
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_receipt_upload_token",
    {
      p_order_number:
        normalizedNumber,
    }
  );

  if (error) {
    console.error(
      "Get receipt upload token error:",
      error
    );

    throw new Error(
      error.message ||
        "تعذر الحصول على رمز رفع الإيصال."
    );
  }

  if (!data) {
    throw new Error(
      "لم يتم الحصول على رمز رفع الإيصال."
    );
  }

  /*
    ==========================================
    RPC يرجع JSONB
    ==========================================
  */

  if (typeof data === "string") {
    /*
      ممكن يكون JSON string
      أو UUID مباشرة
    */

    try {
      const parsed =
        JSON.parse(data);

      const token =
        parsed?.receipt_token ||
        parsed?.token ||
        parsed?.upload_token ||
        parsed?.receiptToken ||
        null;

      if (token) {
        return String(token);
      }
    } catch {
      /*
        القيمة نفسها ممكن تكون UUID
      */

      if (data.trim()) {
        return data.trim();
      }
    }
  }

  const token =
    data?.receipt_token ||
    data?.token ||
    data?.upload_token ||
    data?.receiptToken ||
    null;

  if (!token) {
    throw new Error(
      "لم يتم العثور على رمز رفع صالح."
    );
  }

  return String(token);
}

/*
  ==========================================
  رفع إيصال التحويل
  ==========================================

  التدفق:

  1. التحقق من الملف
  2. الحصول على receipt token من RPC
  3. رفع الصورة إلى Storage
  4. استدعاء submit_order_receipt
  5. تنظيف الملف إذا فشلت العملية
  ==========================================
*/

export async function uploadOrderReceipt(
  orderNumber,
  _receiptToken,
  file
) {
  /*
    _receiptToken موجود مؤقتاً للتوافق
    مع الاستدعاء القديم من OrderTracking.jsx.

    نحن لا نستخدمه نهائياً.

    الـ token الحقيقي يتم الحصول عليه
    من getReceiptUploadToken().
  */

  if (!orderNumber) {
    throw new Error(
      "رقم الطلب غير موجود."
    );
  }

  /*
    ==============================
    التوافق مع الاستدعاء القديم
    ==============================

    لو تم استدعاء الدالة هكذا:

    uploadOrderReceipt(
      orderNumber,
      file
    )

    فسوف نعتبر المعامل الثاني هو الملف.

    ولو تم استدعاؤها هكذا:

    uploadOrderReceipt(
      orderNumber,
      receiptToken,
      file
    )

    فسوف نتجاهل receiptToken
    ونستخدم الـRPC.
  */

  if (
    !_receiptToken &&
    file
  ) {
    /*
      لا يحدث عادةً، لكن نتركه
      للتوافق.
    */
  }

  if (
    _receiptToken instanceof File &&
    !file
  ) {
    file =
      _receiptToken;
  }

  if (!file) {
    throw new Error(
      "برجاء اختيار صورة الإيصال."
    );
  }

  /*
    ==============================
    السماح بالصور فقط
    ==============================
  */

  if (
    !file.type ||
    !file.type.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "برجاء اختيار صورة فقط."
    );
  }

  /*
    ==============================
    الحد الأقصى 5 MB
    ==============================
  */

  if (
    file.size >
    5 * 1024 * 1024
  ) {
    throw new Error(
      "حجم صورة الإيصال يجب ألا يتجاوز 5 MB."
    );
  }

  const safeOrderNumber =
    String(orderNumber)
      .trim()
      .toUpperCase();

  /*
    ==========================================
    الحصول على token من RPC الآمن
    ==========================================
  */

  const receiptToken =
    await getReceiptUploadToken(
      safeOrderNumber
    );

  /*
    ==========================================
    اسم الملف
    ==========================================
  */

  const fileExtension =
    (
      file.name
        .split(".")
        .pop() ||
      "jpg"
    ).toLowerCase();

  /*
    السماح بامتدادات الصور المعروفة فقط
  */

  const allowedExtensions = [
    "jpg",
    "jpeg",
    "png",
    "webp",
    "gif",
  ];

  const safeExtension =
    allowedExtensions.includes(
      fileExtension
    )
      ? fileExtension
      : "jpg";

  const fileName =
    `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${safeExtension}`;

  /*
    ==========================================
    مسار الملف

    ORDER_NUMBER/
    RECEIPT_TOKEN/
    FILE_NAME
    ==========================================
  */

  const filePath =
    `${safeOrderNumber}/${receiptToken}/${fileName}`;

  /*
    ==========================================
    رفع الصورة إلى Storage
    ==========================================
  */

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from(
        "order-receipts"
      )
      .upload(
        filePath,
        file,
        {
          cacheControl:
            "3600",

          upsert:
            false,

          contentType:
            file.type,
        }
      );

  if (uploadError) {
    console.error(
      "Receipt upload error:",
      uploadError
    );

    throw new Error(
      uploadError.message ||
        "تعذر رفع صورة الإيصال."
    );
  }

  /*
    ==========================================
    تسجيل الإيصال في الطلب
    ==========================================

    RPC:

    submit_order_receipt(
      p_order_number text,
      p_receipt_token uuid,
      p_receipt_path text
    )
    ==========================================
  */

  const {
    data,
    error,
  } =
    await supabase.rpc(
      "submit_order_receipt",
      {
        p_order_number:
          safeOrderNumber,

        p_receipt_token:
          receiptToken,

        p_receipt_path:
          filePath,
      }
    );

  if (error) {
    console.error(
      "Submit receipt error:",
      error
    );

    /*
      نحاول حذف الصورة إذا فشل
      تسجيلها في قاعدة البيانات.
    */

    try {
      await supabase.storage
        .from(
          "order-receipts"
        )
        .remove([
          filePath,
        ]);
    } catch (cleanupError) {
      console.error(
        "Receipt cleanup error:",
        cleanupError
      );
    }

    throw new Error(
      error.message ||
        "تعذر تسجيل الإيصال."
    );
  }

  /*
    ==========================================
    التأكد أن RPC قبل العملية فعلاً
    ==========================================
  */

  if (
    data === false ||
    data?.success === false
  ) {
    /*
      حذف الملف في حالة رفض العملية
    */

    try {
      await supabase.storage
        .from(
          "order-receipts"
        )
        .remove([
          filePath,
        ]);
    } catch (cleanupError) {
      console.error(
        "Receipt cleanup error:",
        cleanupError
      );
    }

    throw new Error(
      "تعذر تسجيل إيصال التحويل."
    );
  }

  return data;
}