import citiesExport from "./cities.json";

const governorates = {
  "1": "القاهرة",
  "2": "الجيزة",
  "3": "الإسكندرية",
  "4": "الدقهلية",
  "5": "البحر الأحمر",
  "6": "البحيرة",
  "7": "الفيوم",
  "8": "الغربية",
  "9": "الإسماعيلية",
  "10": "المنوفية",
  "11": "المنيا",
  "12": "القليوبية",
  "13": "الوادي الجديد",
  "14": "السويس",
  "15": "أسوان",
  "16": "أسيوط",
  "17": "بني سويف",
  "18": "بورسعيد",
  "19": "دمياط",
  "20": "الشرقية",
  "21": "جنوب سيناء",
  "22": "كفر الشيخ",
  "23": "مطروح",
  "24": "الأقصر",
  "25": "قنا",
  "26": "شمال سيناء",
  "27": "سوهاج",
};

const citiesTable = citiesExport.find(
  (item) =>
    item.type === "table" &&
    item.name === "cities"
);

const cities = citiesTable?.data || [];

export const egyptLocations = {};

Object.entries(governorates).forEach(
  ([governorateId, governorateName]) => {
    egyptLocations[governorateName] = cities
      .filter(
        (city) =>
          city.governorate_id === governorateId
      )
      .map((city) => city.city_name_ar)
      .filter(Boolean);
  }
);