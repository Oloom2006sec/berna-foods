import { supabase } from "../lib/supabase";

/*
 * ==========================================
 * Get active shipping locations
 * ==========================================
 */

export async function getShippingLocations() {
  const { data, error } = await supabase
    .from("shipping_locations")
    .select(`
      id,
      governorate,
      city,
      zone_id,
      active,
      shipping_zones (
        id,
        zone_name,
        shipping_price,
        active
      )
    `)
    .eq("active", true)
    .order("governorate", {
      ascending: true,
    })
    .order("city", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Get shipping locations error:",
      error
    );

    throw new Error(
      "تعذر تحميل مناطق الشحن."
    );
  }

  return Array.isArray(data)
    ? data
    : [];
}


/*
 * ==========================================
 * Get shipping location by governorate
 *
 * IMPORTANT:
 * The current database structure links
 * shipping zone to GOVERNORATE.
 *
 * city can be NULL in shipping_locations.
 * ==========================================
 */

export async function getShippingLocationByAddress(
  governorate,
  city = ""
) {
  if (!governorate) {
    return null;
  }

  /*
   * First try exact city if a city record exists.
   */

  if (city) {
    const { data: cityData, error: cityError } =
      await supabase
        .from("shipping_locations")
        .select(`
          id,
          governorate,
          city,
          zone_id,
          active,
          shipping_zones (
            id,
            zone_name,
            shipping_price,
            active
          )
        `)
        .eq("governorate", governorate)
        .eq("city", city)
        .eq("active", true)
        .maybeSingle();

    if (cityError) {
      console.error(
        "Get shipping city error:",
        cityError
      );

      throw new Error(
        "تعذر تحديد نطاق الشحن."
      );
    }

    if (cityData) {
      return normalizeShippingLocation(
        cityData
      );
    }
  }

  /*
   * Current database structure:
   *
   * governorate -> zone_id
   *
   * city is NULL.
   */

  const { data, error } =
    await supabase
      .from("shipping_locations")
      .select(`
        id,
        governorate,
        city,
        zone_id,
        active,
        shipping_zones (
          id,
          zone_name,
          shipping_price,
          active
        )
      `)
      .eq("governorate", governorate)
      .eq("active", true)
      .is("city", null)
      .maybeSingle();

  if (error) {
    console.error(
      "Get shipping governorate error:",
      error
    );

    throw new Error(
      "تعذر تحديد نطاق الشحن."
    );
  }

  if (!data) {
    return null;
  }

  return normalizeShippingLocation(
    data
  );
}


/*
 * ==========================================
 * Normalize shipping location
 * ==========================================
 */

function normalizeShippingLocation(
  data
) {
  const zone =
    data?.shipping_zones;

  if (
    !zone ||
    zone.active !== true
  ) {
    return null;
  }

  return {
    locationId: data.id,

    governorate:
      data.governorate,

    city:
      data.city || "",

    zoneId:
      zone.id,

    zoneName:
      zone.zone_name,

    baseShippingPrice:
      Number(
        zone.shipping_price || 0
      ),
  };
}


/*
 * ==========================================
 * Get shipping price for location ID
 *
 * Kept for compatibility.
 * ==========================================
 */

export async function getShippingPrice(
  locationId
) {
  if (!locationId) {
    return null;
  }

  const { data, error } =
    await supabase
      .from("shipping_locations")
      .select(`
        id,
        governorate,
        city,
        zone_id,
        active,
        shipping_zones (
          id,
          zone_name,
          shipping_price,
          active
        )
      `)
      .eq("id", locationId)
      .eq("active", true)
      .maybeSingle();

  if (error) {
    console.error(
      "Get shipping price error:",
      error
    );

    throw new Error(
      "تعذر تحديد سعر الشحن."
    );
  }

  if (!data) {
    return null;
  }

  return normalizeShippingLocation(
    data
  );
}


/*
 * ==========================================
 * Get shipping weight rules
 * ==========================================
 */

export async function getShippingWeightRules(
  zoneId
) {
  if (!zoneId) {
    return [];
  }

  const { data, error } =
    await supabase
      .from("shipping_weight_rules")
      .select(`
        id,
        zone_id,
        min_weight_kg,
        max_weight_kg,
        shipping_price,
        active
      `)
      .eq("zone_id", zoneId)
      .eq("active", true)
      .order("min_weight_kg", {
        ascending: true,
      });

  if (error) {
    console.error(
      "Get shipping weight rules error:",
      error
    );

    throw new Error(
      "تعذر تحميل قواعد الشحن حسب الوزن."
    );
  }

  return Array.isArray(data)
    ? data
    : [];
}


/*
 * ==========================================
 * Calculate shipping by location + weight
 * ==========================================
 */

export async function calculateShippingPrice(
  locationId,
  totalWeightKg
) {
  if (!locationId) {
    return null;
  }

  const weight =
    Math.max(
      0,
      Number(totalWeightKg) || 0
    );

  const location =
    await getShippingPrice(
      locationId
    );

  if (!location) {
    return null;
  }

  const rules =
    await getShippingWeightRules(
      location.zoneId
    );

  if (!rules.length) {
    return null;
  }

  /*
   * Weight boundaries:
   *
   * 0 - 1      => 0 <= weight < 1
   * 1 - 2      => 1 <= weight < 2
   * 2 - 5      => 2 <= weight < 5
   * 5 - 10     => 5 <= weight < 10
   * 10+        => weight >= 10
   */

  const matchedRule =
    rules.find((rule) => {
      const min =
        Number(
          rule.min_weight_kg
        ) || 0;

      const max =
        rule.max_weight_kg === null ||
        rule.max_weight_kg === undefined
          ? null
          : Number(
              rule.max_weight_kg
            );

      if (max === null) {
        return weight >= min;
      }

      return (
        weight >= min &&
        weight < max
      );
    });

  if (!matchedRule) {
    return null;
  }

  return {
    locationId:
      location.locationId,

    governorate:
      location.governorate,

    city:
      location.city,

    zoneId:
      location.zoneId,

    zoneName:
      location.zoneName,

    totalWeightKg:
      weight,

    shippingPrice:
      Number(
        matchedRule.shipping_price || 0
      ),

    weightRuleId:
      matchedRule.id,

    minWeightKg:
      Number(
        matchedRule.min_weight_kg || 0
      ),

    maxWeightKg:
      matchedRule.max_weight_kg === null ||
      matchedRule.max_weight_kg === undefined
        ? null
        : Number(
            matchedRule.max_weight_kg
          ),
  };
}


/*
 * ==========================================
 * Get shipping by governorate + city + weight
 *
 * THIS is the main function used by Checkout.
 * ==========================================
 */

export async function getShippingPriceByAddress(
  governorate,
  city,
  totalWeightKg
) {
  if (!governorate) {
    return null;
  }

  const location =
    await getShippingLocationByAddress(
      governorate,
      city
    );

  if (!location) {
    return null;
  }

  /*
   * Calculate based on weight.
   */

  return calculateShippingPrice(
    location.locationId,
    totalWeightKg
  );
}


/*
 * ==========================================
 * Convert product weight to KG
 * ==========================================
 */

export function getItemWeightKg(
  item
) {
  /*
   * Preferred:
   * weightGrams
   */

  if (
    item?.weightGrams !== undefined &&
    item?.weightGrams !== null
  ) {
    const grams =
      Number(
        item.weightGrams
      );

    if (
      Number.isFinite(grams) &&
      grams >= 0
    ) {
      return grams / 1000;
    }
  }

  /*
   * Fallback:
   * Parse weight text.
   *
   * Examples:
   * 250 جم
   * 500 جم
   * 1 كجم
   * 1 kg
   */

  const text =
    String(
      item?.weight || ""
    )
      .trim()
      .toLowerCase();

  if (!text) {
    return 0;
  }

  const value =
    Number(
      text.replace(
        ",",
        "."
      ).match(
        /[\d.]+/
      )?.[0]
    );

  if (
    !Number.isFinite(value)
  ) {
    return 0;
  }

  if (
    text.includes("kg") ||
    text.includes("كيلو") ||
    text.includes("كجم") ||
    text.includes("كغ")
  ) {
    return value;
  }

  /*
   * Default Arabic product weights
   * are treated as grams.
   */

  return value / 1000;
}


/*
 * ==========================================
 * Calculate total cart weight
 * ==========================================
 */

export function calculateCartWeightKg(
  cart
) {
  if (!Array.isArray(cart)) {
    return 0;
  }

  return cart.reduce(
    (total, item) => {
      const itemWeight =
        getItemWeightKg(
          item
        );

      const quantity =
        Math.max(
          0,
          Number(
            item?.quantity || 0
          )
        );

      return (
        total +
        itemWeight *
          quantity
      );
    },
    0
  );
}