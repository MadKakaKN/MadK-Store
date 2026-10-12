using MadK.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace MadK.Infrastructure.Data;

/// <summary>
/// Seeder đơn vị hành chính Việt Nam và sổ địa chỉ mẫu.
/// Nguồn dữ liệu mở: Tổng cục Thống kê Việt Nam (GSO - gso.gov.vn)
/// Theo Quyết định số 124/2004/QĐ-TTg của Thủ tướng Chính phủ về Danh mục đơn vị hành chính Việt Nam.
/// </summary>
public static class AddressSeeder
{
    public static async Task SeedAsync(AppDbContext context, ILogger? logger = null)
    {
        await SeedAdministrativeDivisionsAsync(context, logger);
        await SeedSampleAddressesAsync(context, logger);
    }

    public static async Task SeedAdministrativeDivisionsAsync(AppDbContext context, ILogger? logger = null)
    {
        var existingProvinces = await context.Provinces.ToDictionaryAsync(p => p.Code);

        // 63 Tỉnh/Thành phố trực thuộc Trung ương (Việt Nam)
        var provinceList = new (string Code, string Name, string FullName, string CodeName, int Order)[]
        {
            ("01", "Hà Nội", "Thành phố Hà Nội", "ha_noi", 1),
            ("79", "Hồ Chí Minh", "Thành phố Hồ Chí Minh", "ho_chi_minh", 2),
            ("48", "Đà Nẵng", "Thành phố Đà Nẵng", "da_nang", 3),
            ("31", "Hải Phòng", "Thành phố Hải Phòng", "hai_phong", 4),
            ("92", "Cần Thơ", "Thành phố Cần Thơ", "can_tho", 5),
            ("74", "Bình Dương", "Tỉnh Bình Dương", "binh_duong", 6),
            ("75", "Đồng Nai", "Tỉnh Đồng Nai", "dong_nai", 7),
            ("77", "Bà Rịa - Vũng Tàu", "Tỉnh Bà Rịa - Vũng Tàu", "ba_ria_vung_tau", 8),
            ("27", "Bắc Ninh", "Tỉnh Bắc Ninh", "bac_ninh", 9),
            ("22", "Quảng Ninh", "Tỉnh Quảng Ninh", "quang_ninh", 10),
            ("02", "Hà Giang", "Tỉnh Hà Giang", "ha_giang", 11),
            ("04", "Cao Bằng", "Tỉnh Cao Bằng", "cao_bang", 12),
            ("06", "Bắc Kạn", "Tỉnh Bắc Kạn", "bac_kan", 13),
            ("08", "Tuyên Quang", "Tỉnh Tuyên Quang", "tuyen_quang", 14),
            ("10", "Lào Cai", "Tỉnh Lào Cai", "lao_cai", 15),
            ("11", "Điện Biên", "Tỉnh Điện Biên", "dien_bien", 16),
            ("12", "Lai Châu", "Tỉnh Lai Châu", "lai_chau", 17),
            ("14", "Sơn La", "Tỉnh Sơn La", "son_la", 18),
            ("15", "Yên Bái", "Tỉnh Yên Bái", "yen_bai", 19),
            ("17", "Hoà Bình", "Tỉnh Hoà Bình", "hoa_binh", 20),
            ("19", "Thái Nguyên", "Tỉnh Thái Nguyên", "thai_nguyen", 21),
            ("20", "Lạng Sơn", "Tỉnh Lạng Sơn", "lang_son", 22),
            ("24", "Bắc Giang", "Tỉnh Bắc Giang", "bac_giang", 23),
            ("25", "Phú Thọ", "Tỉnh Phú Thọ", "phu_tho", 24),
            ("26", "Vĩnh Phúc", "Tỉnh Vĩnh Phúc", "vinh_phuc", 25),
            ("30", "Hải Dương", "Tỉnh Hải Dương", "hai_duong", 26),
            ("33", "Hưng Yên", "Tỉnh Hưng Yên", "hung_yen", 27),
            ("34", "Thái Bình", "Tỉnh Thái Bình", "thai_binh", 28),
            ("35", "Hà Nam", "Tỉnh Hà Nam", "ha_nam", 29),
            ("36", "Nam Định", "Tỉnh Nam Định", "nam_dinh", 30),
            ("37", "Ninh Bình", "Tỉnh Ninh Bình", "ninh_binh", 31),
            ("38", "Thanh Hóa", "Tỉnh Thanh Hóa", "thanh_hoa", 32),
            ("40", "Nghệ An", "Tỉnh Nghệ An", "nghe_an", 33),
            ("42", "Hà Tĩnh", "Tỉnh Hà Tĩnh", "ha_tinh", 34),
            ("44", "Quảng Bình", "Tỉnh Quảng Bình", "quang_binh", 35),
            ("45", "Quảng Trị", "Tỉnh Quảng Trị", "quang_tri", 36),
            ("46", "Thừa Thiên Huế", "Tỉnh Thừa Thiên Huế", "thua_thien_hue", 37),
            ("49", "Quảng Nam", "Tỉnh Quảng Nam", "quang_nam", 38),
            ("50", "Quảng Ngãi", "Tỉnh Quảng Ngãi", "quang_ngai", 39),
            ("52", "Bình Định", "Tỉnh Bình Định", "binh_dinh", 40),
            ("54", "Phú Yên", "Tỉnh Phú Yên", "phu_yen", 41),
            ("56", "Khánh Hòa", "Tỉnh Khánh Hòa", "khanh_hoa", 42),
            ("58", "Ninh Thuận", "Tỉnh Ninh Thuận", "ninh_thuan", 43),
            ("60", "Bình Thuận", "Tỉnh Bình Thuận", "binh_thuan", 44),
            ("62", "Kon Tum", "Tỉnh Kon Tum", "kon_tum", 45),
            ("64", "Gia Lai", "Tỉnh Gia Lai", "gia_lai", 46),
            ("66", "Đắk Lắk", "Tỉnh Đắk Lắk", "dak_lak", 47),
            ("67", "Đắk Nông", "Tỉnh Đắk Nông", "dak_nong", 48),
            ("68", "Lâm Đồng", "Tỉnh Lâm Đồng", "lam_dong", 49),
            ("70", "Bình Phước", "Tỉnh Bình Phước", "binh_phuoc", 50),
            ("72", "Tây Ninh", "Tỉnh Tây Ninh", "tay_ninh", 51),
            ("80", "Long An", "Tỉnh Long An", "long_an", 52),
            ("82", "Tiền Giang", "Tỉnh Tiền Giang", "tien_giang", 53),
            ("83", "Bến Tre", "Tỉnh Bến Tre", "ben_tre", 54),
            ("84", "Trà Vinh", "Tỉnh Trà Vinh", "tra_vinh", 55),
            ("86", "Vĩnh Long", "Tỉnh Vĩnh Long", "vinh_long", 56),
            ("87", "Đồng Tháp", "Tỉnh Đồng Tháp", "dong_thap", 57),
            ("89", "An Giang", "Tỉnh An Giang", "an_giang", 58),
            ("91", "Kiên Giang", "Tỉnh Kiên Giang", "kien_giang", 59),
            ("93", "Hậu Giang", "Tỉnh Hậu Giang", "hau_giang", 60),
            ("94", "Sóc Trăng", "Tỉnh Sóc Trăng", "soc_trang", 61),
            ("95", "Bạc Liêu", "Tỉnh Bạc Liêu", "bac_lieu", 62),
            ("96", "Cà Mau", "Tỉnh Cà Mau", "ca_mau", 63)
        };

        foreach (var p in provinceList)
        {
            if (!existingProvinces.ContainsKey(p.Code))
            {
                var prov = new Province
                {
                    Code = p.Code,
                    Name = p.Name,
                    FullName = p.FullName,
                    CodeName = p.CodeName,
                    DisplayOrder = p.Order
                };
                context.Provinces.Add(prov);
                existingProvinces[p.Code] = prov;
            }
        }

        await context.SaveChangesAsync();

        // 2. Districts & Wards for key provinces
        var existingDistricts = await context.Districts.ToDictionaryAsync(d => d.Code);
        var existingWards = await context.Wards.ToDictionaryAsync(w => w.Code);

        var districtDefs = new List<(string Code, string Name, string FullName, string CodeName, string ProvinceCode)>
        {
            // TP. Hồ Chí Minh (79)
            ("760", "Quận 1", "Quận 1", "quan_1", "79"),
            ("769", "Thành phố Thủ Đức", "Thành phố Thủ Đức", "tp_thu_duc", "79"),
            ("770", "Quận 3", "Quận 3", "quan_3", "79"),
            ("771", "Quận 10", "Quận 10", "quan_10", "79"),
            ("774", "Quận 5", "Quận 5", "quan_5", "79"),
            ("778", "Quận 7", "Quận 7", "quan_7", "79"),
            ("765", "Quận Bình Thạnh", "Quận Bình Thạnh", "quan_binh_thanh", "79"),
            ("764", "Quận Gò Vấp", "Quận Gò Vấp", "quan_go_vap", "79"),
            ("766", "Quận Tân Bình", "Quận Tân Bình", "quan_tan_binh", "79"),

            // Hà Nội (01)
            ("001", "Quận Ba Đình", "Quận Ba Đình", "quan_ba_dinh", "01"),
            ("002", "Quận Hoàn Kiếm", "Quận Hoàn Kiếm", "quan_hoan_kiem", "01"),
            ("005", "Quận Cầu Giấy", "Quận Cầu Giấy", "quan_cau_giay", "01"),
            ("006", "Quận Đống Đa", "Quận Đống Đa", "quan_dong_da", "01"),
            ("007", "Quận Hai Bà Trưng", "Quận Hai Bà Trưng", "quan_hai_ba_trung", "01"),
            ("008", "Quận Hoàng Mai", "Quận Hoàng Mai", "quan_hoang_mai", "01"),
            ("009", "Quận Thanh Xuân", "Quận Thanh Xuân", "quan_thanh_xuan", "01"),
            ("019", "Quận Nam Từ Liêm", "Quận Nam Từ Liêm", "quan_nam_tu_liem", "01"),
            ("021", "Quận Bắc Từ Liêm", "Quận Bắc Từ Liêm", "quan_bac_tu_liem", "01"),

            // Đà Nẵng (48)
            ("490", "Quận Hải Châu", "Quận Hải Châu", "quan_hai_chau", "48"),
            ("491", "Quận Thanh Khê", "Quận Thanh Khê", "quan_thanh_khe", "48"),
            ("492", "Quận Sơn Trà", "Quận Sơn Trà", "quan_son_tra", "48"),
            ("493", "Quận Ngũ Hành Sơn", "Quận Ngũ Hành Sơn", "quan_ngu_hanh_son", "48"),
            ("494", "Quận Liên Chiểu", "Quận Liên Chiểu", "quan_lien_chieu", "48"),

            // Hải Phòng (31)
            ("303", "Quận Hồng Bàng", "Quận Hồng Bàng", "quan_hong_bang", "31"),
            ("304", "Quận Ngô Quyền", "Quận Ngô Quyền", "quan_ngo_quyen", "31"),
            ("305", "Quận Lê Chân", "Quận Lê Chân", "quan_le_chan", "31"),

            // Cần Thơ (92)
            ("916", "Quận Ninh Kiều", "Quận Ninh Kiều", "quan_ninh_kieu", "92"),
            ("918", "Quận Cái Răng", "Quận Cái Răng", "quan_cai_rang", "92"),
            ("917", "Quận Bình Thủy", "Quận Bình Thủy", "quan_binh_thuy", "92"),

            // Bình Dương (74)
            ("718", "Thành phố Thủ Dầu Một", "Thành phố Thủ Dầu Một", "tp_thu_dau_mot", "74"),
            ("725", "Thành phố Thuận An", "Thành phố Thuận An", "tp_thuan_an", "74"),
            ("724", "Thành phố Dĩ An", "Thành phố Dĩ An", "tp_di_an", "74"),

            // Đồng Nai (75)
            ("731", "Thành phố Biên Hòa", "Thành phố Biên Hòa", "tp_bien_hoa", "75"),
            ("732", "Thành phố Long Khánh", "Thành phố Long Khánh", "tp_long_khanh", "75"),

            // Bà Rịa - Vũng Tàu (77)
            ("747", "Thành phố Vũng Tàu", "Thành phố Vũng Tàu", "tp_vung_tau", "77"),
            ("748", "Thành phố Bà Rịa", "Thành phố Bà Rịa", "tp_ba_ria", "77"),

            // Bắc Ninh (27)
            ("256", "Thành phố Bắc Ninh", "Thành phố Bắc Ninh", "tp_bac_ninh", "27"),
            ("258", "Thành phố Từ Sơn", "Thành phố Từ Sơn", "tp_tu_son", "27"),

            // Quảng Ninh (22)
            ("193", "Thành phố Hạ Long", "Thành phố Hạ Long", "tp_ha_long", "22"),
            ("194", "Thành phố Cẩm Phả", "Thành phố Cẩm Phả", "tp_cam_pha", "22"),

            // Thừa Thiên Huế (46)
            ("474", "Thành phố Huế", "Thành phố Huế", "tp_hue", "46"),

            // Khánh Hòa (56)
            ("568", "Thành phố Nha Trang", "Thành phố Nha Trang", "tp_nha_trang", "56"),
            ("569", "Thành phố Cam Ranh", "Thành phố Cam Ranh", "tp_cam_ranh", "56"),

            // Lâm Đồng (68)
            ("672", "Thành phố Đà Lạt", "Thành phố Đà Lạt", "tp_da_lat", "68"),
            ("673", "Thành phố Bảo Lộc", "Thành phố Bảo Lộc", "tp_bao_loc", "68")
        };

        // Bổ sung các huyện trung tâm cho tất cả các tỉnh còn lại để đảm bảo mỗi tỉnh đều có ít nhất 1 quận/huyện
        foreach (var p in provinceList)
        {
            if (!districtDefs.Any(d => d.ProvinceCode == p.Code))
            {
                var code = $"D_{p.Code}";
                districtDefs.Add((code, $"Thành phố / Huyện trung tâm {p.Name}", $"Thành phố / Huyện trung tâm {p.Name}", $"huyen_tt_{p.CodeName}", p.Code));
            }
        }

        foreach (var d in districtDefs)
        {
            if (!existingDistricts.ContainsKey(d.Code))
            {
                var dist = new District
                {
                    Code = d.Code,
                    Name = d.Name,
                    FullName = d.FullName,
                    CodeName = d.CodeName,
                    ProvinceCode = d.ProvinceCode
                };
                context.Districts.Add(dist);
                existingDistricts[d.Code] = dist;
            }
        }

        await context.SaveChangesAsync();

        // 3. Wards
        var wardDefs = new List<(string Code, string Name, string FullName, string CodeName, string DistrictCode)>
        {
            // Quận 1 (760)
            ("26734", "Bến Nghé", "Phường Bến Nghé", "phuong_ben_nghe", "760"),
            ("26740", "Bến Thành", "Phường Bến Thành", "phuong_ben_thanh", "760"),
            ("26743", "Cầu Kho", "Phường Cầu Kho", "phuong_cau_kho", "760"),
            ("26746", "Cầu Ông Lãnh", "Phường Cầu Ông Lãnh", "phuong_cau_ong_lanh", "760"),
            ("26749", "Cô Giang", "Phường Cô Giang", "phuong_co_giang", "760"),
            ("26752", "Đa Kao", "Phường Đa Kao", "phuong_da_kao", "760"),
            ("26755", "Nguyễn Cư Trinh", "Phường Nguyễn Cư Trinh", "phuong_nguyen_cu_trinh", "760"),
            ("26758", "Nguyễn Thái Bình", "Phường Nguyễn Thái Bình", "phuong_nguyen_thai_binh", "760"),
            ("26761", "Phạm Ngũ Lão", "Phường Phạm Ngũ Lão", "phuong_pham_ngu_lao", "760"),
            ("26764", "Tân Định", "Phường Tân Định", "phuong_tan_dinh", "760"),

            // TP. Thủ Đức (769)
            ("26829", "Thảo Điền", "Phường Thảo Điền", "phuong_thao_dien", "769"),
            ("26832", "An Phú", "Phường An Phú", "phuong_an_phu", "769"),
            ("26835", "Hiệp Phú", "Phường Hiệp Phú", "phuong_hiep_phu", "769"),
            ("26838", "Linh Trung", "Phường Linh Trung", "phuong_linh_trung", "769"),
            ("26841", "Thủ Thiêm", "Phường Thủ Thiêm", "phuong_thu_thiem", "769"),

            // Quận 3 (770)
            ("26770", "Võ Thị Sáu", "Phường Võ Thị Sáu", "phuong_vo_thi_sau", "770"),
            ("26773", "Phường 1", "Phường 1", "phuong_1", "770"),
            ("26776", "Phường 2", "Phường 2", "phuong_2", "770"),
            ("26779", "Phường 3", "Phường 3", "phuong_3", "770"),

            // Quận 7 (778)
            ("27463", "Tân Phong", "Phường Tân Phong", "phuong_tan_phong", "778"),
            ("27466", "Tân Phú", "Phường Tân Phú", "phuong_tan_phu", "778"),
            ("27469", "Tân Quy", "Phường Tân Quy", "phuong_tan_quy", "778"),

            // Quận Bình Thạnh (765)
            ("26917", "Phường 1", "Phường 1", "phuong_1", "765"),
            ("26920", "Phường 2", "Phường 2", "phuong_2", "765"),
            ("26923", "Phường 19", "Phường 19", "phuong_19", "765"),
            ("26926", "Phường 25", "Phường 25", "phuong_25", "765"),

            // Quận Ba Đình (001)
            ("00001", "Phúc Xá", "Phường Phúc Xá", "phuong_phuc_xa", "001"),
            ("00004", "Trúc Bạch", "Phường Trúc Bạch", "phuong_truc_bach", "001"),
            ("00006", "Vĩnh Phúc", "Phường Vĩnh Phúc", "phuong_vinh_phuc", "001"),
            ("00007", "Cống Vị", "Phường Cống Vị", "phuong_cong_vi", "001"),
            ("00008", "Liễu Giai", "Phường Liễu Giai", "phuong_lieu_giai", "001"),
            ("00010", "Kim Mã", "Phường Kim Mã", "phuong_kim_ma", "001"),
            ("00013", "Giảng Võ", "Phường Giảng Võ", "phuong_giang_vo", "001"),

            // Quận Hoàn Kiếm (002)
            ("00037", "Phúc Tân", "Phường Phúc Tân", "phuong_phuc_tan", "002"),
            ("00040", "Đồng Xuân", "Phường Đồng Xuân", "phuong_dong_xuan", "002"),
            ("00043", "Hàng Mã", "Phường Hàng Mã", "phuong_hang_ma", "002"),
            ("00046", "Hàng Buồm", "Phường Hàng Buồm", "phuong_hang_buom", "002"),
            ("00061", "Tràng Tiền", "Phường Tràng Tiền", "phuong_trang_tien", "002"),

            // Quận Cầu Giấy (005)
            ("00157", "Nghĩa Đô", "Phường Nghĩa Đô", "phuong_nghia_do", "005"),
            ("00160", "Nghĩa Tân", "Phường Nghĩa Tân", "phuong_nghia_tan", "005"),
            ("00163", "Mai Dịch", "Phường Mai Dịch", "phuong_mai_dich", "005"),
            ("00166", "Dịch Vọng", "Phường Dịch Vọng", "phuong_dich_vong", "005"),
            ("00167", "Dịch Vọng Hậu", "Phường Dịch Vọng Hậu", "phuong_dich_vong_hau", "005"),
            ("00169", "Trung Hòa", "Phường Trung Hòa", "phuong_trung_hoa", "005"),
            ("00172", "Yên Hòa", "Phường Yên Hòa", "phuong_yen_hoa", "005"),

            // Quận Đống Đa (006)
            ("00181", "Cát Linh", "Phường Cát Linh", "phuong_cat_linh", "006"),
            ("00184", "Văn Miếu", "Phường Văn Miếu", "phuong_van_mieu", "006"),
            ("00190", "Láng Thượng", "Phường Láng Thượng", "phuong_lang_thuong", "006"),
            ("00193", "Ô Chợ Dừa", "Phường Ô Chợ Dừa", "phuong_o_cho_dua", "006"),

            // Quận Nam Từ Liêm (019)
            ("00595", "Cầu Diễn", "Phường Cầu Diễn", "phuong_cau_dien", "019"),
            ("00598", "Mỹ Đình 1", "Phường Mỹ Đình 1", "phuong_my_dinh_1", "019"),
            ("00601", "Mỹ Đình 2", "Phường Mỹ Đình 2", "phuong_my_dinh_2", "019"),
            ("00604", "Mễ Trì", "Phường Mễ Trì", "phuong_me_tri", "019"),

            // Đà Nẵng - Hải Châu (490)
            ("20194", "Hải Châu 1", "Phường Hải Châu 1", "phuong_hai_chau_1", "490"),
            ("20197", "Hải Châu 2", "Phường Hải Châu 2", "phuong_hai_chau_2", "490"),
            ("20200", "Thạch Thang", "Phường Thạch Thang", "phuong_thach_thang", "490"),
            ("20203", "Thanh Bình", "Phường Thanh Bình", "phuong_thanh_binh", "490"),
            ("20206", "Thuận Phước", "Phường Thuận Phước", "phuong_thuan_phuoc", "490"),

            // Hải Phòng - Hồng Bàng (303)
            ("11377", "Hoàng Văn Thụ", "Phường Hoàng Văn Thụ", "phuong_hoang_van_thu", "303"),
            ("11380", "Minh Khai", "Phường Minh Khai", "phuong_minh_khai", "303"),
            ("11383", "Phan Bội Châu", "Phường Phan Bội Châu", "phuong_phan_boi_chau", "303"),

            // Cần Thơ - Ninh Kiều (916)
            ("31147", "Tân An", "Phường Tân An", "phuong_tan_an", "916"),
            ("31150", "An Cư", "Phường An Cư", "phuong_an_cu", "916"),
            ("31153", "An Khánh", "Phường An Khánh", "phuong_an_khanh", "916"),
            ("31156", "Xuân Khánh", "Phường Xuân Khánh", "phuong_xuan_khanh", "916")
        };

        // Đảm bảo tất cả các district còn lại đều có ít nhất 2 phường/xã đại diện
        foreach (var d in districtDefs)
        {
            if (!wardDefs.Any(w => w.DistrictCode == d.Code))
            {
                wardDefs.Add(($"W1_{d.Code}", "Phường 1 (Trung tâm)", "Phường 1 (Trung tâm)", $"p1_{d.CodeName}", d.Code));
                wardDefs.Add(($"W2_{d.Code}", "Phường 2", "Phường 2", $"p2_{d.CodeName}", d.Code));
            }
        }

        foreach (var w in wardDefs)
        {
            if (!existingWards.ContainsKey(w.Code))
            {
                var ward = new Ward
                {
                    Code = w.Code,
                    Name = w.Name,
                    FullName = w.FullName,
                    CodeName = w.CodeName,
                    DistrictCode = w.DistrictCode
                };
                context.Wards.Add(ward);
                existingWards[w.Code] = ward;
            }
        }

        await context.SaveChangesAsync();
        logger?.LogInformation("Seeded {ProvinceCount} provinces, {DistrictCount} districts, {WardCount} wards.",
            existingProvinces.Count, existingDistricts.Count, existingWards.Count);
    }

    public static async Task SeedSampleAddressesAsync(AppDbContext context, ILogger? logger = null)
    {
        var customer = await context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == "customer@madkstore.vn");
        if (customer == null)
        {
            return;
        }

        var existingAddresses = await context.Addresses.Where(a => a.UserId == customer.Id).ToListAsync();
        if (existingAddresses.Count > 0)
        {
            return;
        }

        var sampleAddresses = new[]
        {
            new Address
            {
                Id = Guid.NewGuid(),
                UserId = customer.Id,
                RecipientName = "Nguyễn Văn Khách",
                PhoneNumber = "0987654321",
                ProvinceCode = "79",
                ProvinceName = "Thành phố Hồ Chí Minh",
                DistrictCode = "760",
                DistrictName = "Quận 1",
                WardCode = "26734",
                WardName = "Phường Bến Nghé",
                DetailedAddress = "Số 123 Lê Duẩn, Tòa nhà Bitexco Diamond",
                IsDefault = true,
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            },
            new Address
            {
                Id = Guid.NewGuid(),
                UserId = customer.Id,
                RecipientName = "Nguyễn Văn Khách (Văn phòng Hà Nội)",
                PhoneNumber = "0987654321",
                ProvinceCode = "01",
                ProvinceName = "Thành phố Hà Nội",
                DistrictCode = "005",
                DistrictName = "Quận Cầu Giấy",
                WardCode = "00166",
                WardName = "Phường Dịch Vọng",
                DetailedAddress = "Tầng 8, Tòa nhà MadK Tower, Số 88 Đường Cầu Giấy",
                IsDefault = false,
                CreatedAt = DateTime.UtcNow.AddDays(-5)
            }
        };

        context.Addresses.AddRange(sampleAddresses);
        await context.SaveChangesAsync();
        logger?.LogInformation("Seeded {Count} sample addresses for customer {Email}", sampleAddresses.Length, customer.Email);
    }
}
