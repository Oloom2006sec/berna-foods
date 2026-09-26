import { products } from "../data/products";

export function groupProducts(source = products) {
  const groups = new Map();

  source.forEach((product) => {
    const key = product.name;
    if (!groups.has(key)) {
      groups.set(key, {
        id: encodeURIComponent(key),
        name: product.name,
        category: product.category,
        icon: product.icon,
        description: product.description.replace(/\s+-\s+[^-]+\s+-\s+[^-]+$/, ""),
        variants: [],
      });
    }
    groups.get(key).variants.push(product);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    variants: group.variants.sort((a, b) => a.weightGrams - b.weightGrams || a.packageType.localeCompare(b.packageType, "ar")),
    minPrice: Math.min(...group.variants.map((v) => v.price)),
    maxPrice: Math.max(...group.variants.map((v) => v.price)),
    weights: [...new Map(group.variants.map((v) => [v.weightGrams, v.weight])).values()],
    packages: [...new Set(group.variants.map((v) => v.packageType))],
  }));
}

export function getProductGroupByParam(param) {
  const decoded = decodeURIComponent(param || "");
  return groupProducts().find((group) => group.name === decoded) || null;
}

export function findVariant(variants, weightGrams, packageType) {
  return variants.find(
    (variant) =>
      Number(variant.weightGrams) === Number(weightGrams) &&
      variant.packageType === packageType
  ) || null;
}
