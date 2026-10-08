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
  PRODUCT IMAGES
  ============================================================

  صورة واحدة لكل Product Group.

  الصور موجودة داخل:
  /public/images/products/

  لذلك المسار يبدأ من:
  /images/products/
  ============================================================
*/

const PRODUCT_IMAGES = {
  "عسل أعشاب جبلية":
    "/images/products/berna_honey_mountain_herbs_FINAL.webp",

  "عسل الموالح":
    "/images/products/berna_honey_almawleh_jar.webp",

  "عسل حبة البركة":
    "/images/products/berna_honey_habbat_elbaraka_dark_jar.webp",

  "عسل البرسيم":
    "/images/products/berna_honey_albarsim_jar.webp",

  "عسل بالمكسرات":
    "/images/products/berna_honey_nuts_jar.webp",

  "زيت الزيتون":
    "/images/products/berna_olive_oil_bottle.webp",

  "دبس الرمان":
    "/images/products/berna_pomegranate_molasses_bottle.webp",

  "خل التفاح":
    "/images/products/berna_apple_cider_vinegar.webp",

  "صويا صوص":
    "/images/products/berna_soy_sauce_bottle.webp",

  "طحينة":
    "/images/products/berna_tahini_realistic_jar.webp",

  "عسل أسود":
    "/images/products/berna_black_honey_jar.webp",

  "عسل سدر مصري":
    "/images/products/berna_honey_molasses_egyptian_jar.webp",

  "عسل بردقوش":
    "/images/products/berna_honey_bardaqous_jar.webp",

  "عسل أعشاب برية":
    "/images/products/berna_honey_wild_herbs_jar.webp",
};


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

        /*
          صورة المنتج الرئيسية
        */

        image:
          PRODUCT_IMAGES[product.name] || "",

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