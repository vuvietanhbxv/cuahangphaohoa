// Danh sách tỉnh thành VN (8 tỉnh demo cho MVP). Thêm sau qua admin.

export const VN_PROVINCES = [
  // Bắc
  { region: "BAC", province: "Hà Nội",      slug: "ha-noi",      districts: ["Cầu Giấy", "Đống Đa", "Hoàn Kiếm", "Hai Bà Trưng", "Thanh Xuân", "Long Biên", "Hà Đông"] },
  { region: "BAC", province: "Bắc Ninh",    slug: "bac-ninh",    districts: ["Bắc Ninh", "Từ Sơn", "Yên Phong", "Quế Võ"] },
  { region: "BAC", province: "Hải Phòng",   slug: "hai-phong",   districts: ["Lê Chân", "Ngô Quyền", "Hồng Bàng", "Hải An"] },
  { region: "BAC", province: "Quảng Ninh",  slug: "quang-ninh",  districts: ["Hạ Long", "Cẩm Phả", "Móng Cái"] },
  // Trung
  { region: "TRUNG", province: "Đà Nẵng",   slug: "da-nang",     districts: ["Hải Châu", "Thanh Khê", "Sơn Trà", "Ngũ Hành Sơn"] },
  { region: "TRUNG", province: "Huế",       slug: "hue",         districts: ["Phú Hội", "Phú Thuận", "Vĩnh Ninh"] },
  // Nam
  { region: "NAM", province: "TP. Hồ Chí Minh", slug: "tp-ho-chi-minh", districts: ["Quận 1", "Quận 3", "Quận 5", "Quận 7", "Bình Thạnh", "Phú Nhuận", "Gò Vấp", "Tân Bình"] },
  { region: "NAM", province: "Cần Thơ",    slug: "can-tho",     districts: ["Ninh Kiều", "Bình Thuỷ", "Cái Răng"] },
];

export const REGION_LABEL = { BAC: "Miền Bắc", TRUNG: "Miền Trung", NAM: "Miền Nam" };

export function provinceSlug(name) {
  return String(name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
