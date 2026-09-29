import { products } from "../data/products";

/*
  ============================================================
  BERNA FOODS - PRODUCT GROUPS
  ============================================================

  قاعدة العمل:

  1. كل الـ SKU الأصلية تظل موجودة في products.
  2. الموقع يعرض المنتج كمنتج واحد فقط.
  3. البيع على الموقع = عبوة بلاستيك فقط.
  4. العميل يختار الوزن فقط.
  5. نوع العبوة لا يظهر كاختيار للعميل.
  6. كل وزن مربوط بالـ SKU والسعر الخاص به.
  ============================================================
*/


/*
  ============================================================
  GROUP PRODUCTS
  ============================================================
*/

export function groupProducts(source = products) {
  const groups = new Map();

  /*
    تجميع الـ SKU حسب اسم المنتج
  */

  source.forEach((product) => {
    const key = product.name;

    if (!groups.has(key)) {
      groups.set(key, {
        id: encodeURIComponent(key),

        name: product.name,

        category: product.category,

        icon: product.icon,

        description:
          product.description?.replace(
            /\s+-\s+[^-]+\s+-\s+[^-]+$/,
            ""
          ) ||
          `اختيارات متعددة من ${product.name}`,

        /*
          كل الـ SKU الأصلية
          لا نحذف منها أي شيء
        */

        variants: [],
      });
    }

    groups.get(key).variants.push(product);
  });


  /*
    ============================================================
    تجهيز كل Product Group
    ============================================================
  */

  return Array.from(groups.values()).map((group) => {

    /*
      ----------------------------------------------------------
      كل الـ SKU التي نوع عبوتها بلاستيك
      ----------------------------------------------------------
    */

    const plasticVariants = group.variants.filter(
      (variant) =>
        variant.packageType === "بلاستيك"
    );


    /*
      ----------------------------------------------------------
      Variants الخاصة بالعميل
      ----------------------------------------------------------

      لو يوجد بلاستيك:
      نعرض البلاستيك فقط.

      لو المنتج القديم ليس له packageType = بلاستيك:
      نستخدم الـ variants الموجودة حتى لا يختفي المنتج.
    */

    const customerVariants = (
      plasticVariants.length > 0
        ? plasticVariants
        : group.variants
    ).sort(
      (a, b) =>
        Number(a.weightGrams) -
        Number(b.weightGrams)
    );


    /*
      ----------------------------------------------------------
      الأسعار
      ----------------------------------------------------------
    */

    const prices = customerVariants.map(
      (variant) =>
        Number(variant.price)
    );


    const minPrice =
      prices.length > 0
        ? Math.min(...prices)
        : 0;


    const maxPrice =
      prices.length > 0
        ? Math.max(...prices)
        : 0;


    /*
      ----------------------------------------------------------
      النتيجة النهائية للمنتج
      ----------------------------------------------------------
    */

    return {
      ...group,

      /*
        مهم جدًا:

        كل الـ SKU الأصلية تظل محفوظة هنا
        لا نحذفها.
      */

      variants: group.variants,


      /*
        هذه فقط هي التي تستخدمها واجهة العميل
      */

      customerVariants,


      /*
        أقل وأعلى سعر للعرض في ProductCard
      */

      minPrice,

      maxPrice,


      /*
        أوزان المنتج المتاحة للعميل
      */

      weights: customerVariants.map(
        (variant) => ({
          weight: variant.weight,

          weightGrams:
            Number(variant.weightGrams),

          price:
            Number(variant.price),

          sku: variant.sku,
        })
      ),
    };
  });
}


/*
  ============================================================
  GET PRODUCT GROUP BY PARAM
  ============================================================
*/

export function getProductGroupByParam(param) {
  const decoded = decodeURIComponent(
    param || ""
  );

  return (
    groupProducts().find(
      (group) =>
        group.name === decoded
    ) || null
  );
}


/*
  ============================================================
  FIND CUSTOMER VARIANT
  ============================================================

  البيع على الموقع بلاستيك فقط.

  لذلك البحث يكون:
  - الوزن
  - packageType = بلاستيك
  ============================================================
*/

export function findVariant(
  variants,
  weightGrams,
  packageType = "بلاستيك"
) {
  if (!Array.isArray(variants)) {
    return null;
  }

  return (
    variants.find(
      (variant) =>
        Number(
          variant.weightGrams
        ) === Number(weightGrams) &&
        variant.packageType ===
          packageType
    ) || null
  );
}