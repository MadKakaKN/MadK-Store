import apiClient from './apiClient';
import type {
  ProvinceDto,
  DistrictDto,
  WardDto,
  AddressDto,
  CreateAddressRequestDto,
  UpdateAddressRequestDto,
} from '../types/address';
import type { ApiEnvelope } from '../types/auth';

// Nguồn dữ liệu mở: Tổng cục Thống kê Việt Nam (GSO - gso.gov.vn)
export const VIETNAM_OPEN_DATA_PROVINCES: ProvinceDto[] = [
  { code: '01', name: 'Hà Nội', fullName: 'Thành phố Hà Nội', displayOrder: 1 },
  { code: '79', name: 'Hồ Chí Minh', fullName: 'Thành phố Hồ Chí Minh', displayOrder: 2 },
  { code: '48', name: 'Đà Nẵng', fullName: 'Thành phố Đà Nẵng', displayOrder: 3 },
  { code: '31', name: 'Hải Phòng', fullName: 'Thành phố Hải Phòng', displayOrder: 4 },
  { code: '92', name: 'Cần Thơ', fullName: 'Thành phố Cần Thơ', displayOrder: 5 },
  { code: '74', name: 'Bình Dương', fullName: 'Tỉnh Bình Dương', displayOrder: 6 },
  { code: '75', name: 'Đồng Nai', fullName: 'Tỉnh Đồng Nai', displayOrder: 7 },
  { code: '77', name: 'Bà Rịa - Vũng Tàu', fullName: 'Tỉnh Bà Rịa - Vũng Tàu', displayOrder: 8 },
  { code: '27', name: 'Bắc Ninh', fullName: 'Tỉnh Bắc Ninh', displayOrder: 9 },
  { code: '22', name: 'Quảng Ninh', fullName: 'Tỉnh Quảng Ninh', displayOrder: 10 },
  { code: '02', name: 'Hà Giang', fullName: 'Tỉnh Hà Giang', displayOrder: 11 },
  { code: '04', name: 'Cao Bằng', fullName: 'Tỉnh Cao Bằng', displayOrder: 12 },
  { code: '06', name: 'Bắc Kạn', fullName: 'Tỉnh Bắc Kạn', displayOrder: 13 },
  { code: '08', name: 'Tuyên Quang', fullName: 'Tỉnh Tuyên Quang', displayOrder: 14 },
  { code: '10', name: 'Lào Cai', fullName: 'Tỉnh Lào Cai', displayOrder: 15 },
  { code: '11', name: 'Điện Biên', fullName: 'Tỉnh Điện Biên', displayOrder: 16 },
  { code: '12', name: 'Lai Châu', fullName: 'Tỉnh Lai Châu', displayOrder: 17 },
  { code: '14', name: 'Sơn La', fullName: 'Tỉnh Sơn La', displayOrder: 18 },
  { code: '15', name: 'Yên Bái', fullName: 'Tỉnh Yên Bái', displayOrder: 19 },
  { code: '17', name: 'Hoà Bình', fullName: 'Tỉnh Hoà Bình', displayOrder: 20 },
  { code: '19', name: 'Thái Nguyên', fullName: 'Tỉnh Thái Nguyên', displayOrder: 21 },
  { code: '20', name: 'Lạng Sơn', fullName: 'Tỉnh Lạng Sơn', displayOrder: 22 },
  { code: '24', name: 'Bắc Giang', fullName: 'Tỉnh Bắc Giang', displayOrder: 23 },
  { code: '25', name: 'Phú Thọ', fullName: 'Tỉnh Phú Thọ', displayOrder: 24 },
  { code: '26', name: 'Vĩnh Phúc', fullName: 'Tỉnh Vĩnh Phúc', displayOrder: 25 },
  { code: '30', name: 'Hải Dương', fullName: 'Tỉnh Hải Dương', displayOrder: 26 },
  { code: '33', name: 'Hưng Yên', fullName: 'Tỉnh Hưng Yên', displayOrder: 27 },
  { code: '34', name: 'Thái Bình', fullName: 'Tỉnh Thái Bình', displayOrder: 28 },
  { code: '35', name: 'Hà Nam', fullName: 'Tỉnh Hà Nam', displayOrder: 29 },
  { code: '36', name: 'Nam Định', fullName: 'Tỉnh Nam Định', displayOrder: 30 },
  { code: '37', name: 'Ninh Bình', fullName: 'Tỉnh Ninh Bình', displayOrder: 31 },
  { code: '38', name: 'Thanh Hóa', fullName: 'Tỉnh Thanh Hóa', displayOrder: 32 },
  { code: '40', name: 'Nghệ An', fullName: 'Tỉnh Nghệ An', displayOrder: 33 },
  { code: '42', name: 'Hà Tĩnh', fullName: 'Tỉnh Hà Tĩnh', displayOrder: 34 },
  { code: '44', name: 'Quảng Bình', fullName: 'Tỉnh Quảng Bình', displayOrder: 35 },
  { code: '45', name: 'Quảng Trị', fullName: 'Tỉnh Quảng Trị', displayOrder: 36 },
  { code: '46', name: 'Thừa Thiên Huế', fullName: 'Tỉnh Thừa Thiên Huế', displayOrder: 37 },
  { code: '49', name: 'Quảng Nam', fullName: 'Tỉnh Quảng Nam', displayOrder: 38 },
  { code: '50', name: 'Quảng Ngãi', fullName: 'Tỉnh Quảng Ngãi', displayOrder: 39 },
  { code: '52', name: 'Bình Định', fullName: 'Tỉnh Bình Định', displayOrder: 40 },
  { code: '54', name: 'Phú Yên', fullName: 'Tỉnh Phú Yên', displayOrder: 41 },
  { code: '56', name: 'Khánh Hòa', fullName: 'Tỉnh Khánh Hòa', displayOrder: 42 },
  { code: '58', name: 'Ninh Thuận', fullName: 'Tỉnh Ninh Thuận', displayOrder: 43 },
  { code: '60', name: 'Bình Thuận', fullName: 'Tỉnh Bình Thuận', displayOrder: 44 },
  { code: '62', name: 'Kon Tum', fullName: 'Tỉnh Kon Tum', displayOrder: 45 },
  { code: '64', name: 'Gia Lai', fullName: 'Tỉnh Gia Lai', displayOrder: 46 },
  { code: '66', name: 'Đắk Lắk', fullName: 'Tỉnh Đắk Lắk', displayOrder: 47 },
  { code: '67', name: 'Đắk Nông', fullName: 'Tỉnh Đắk Nông', displayOrder: 48 },
  { code: '68', name: 'Lâm Đồng', fullName: 'Tỉnh Lâm Đồng', displayOrder: 49 },
  { code: '70', name: 'Bình Phước', fullName: 'Tỉnh Bình Phước', displayOrder: 50 },
  { code: '72', name: 'Tây Ninh', fullName: 'Tỉnh Tây Ninh', displayOrder: 51 },
  { code: '80', name: 'Long An', fullName: 'Tỉnh Long An', displayOrder: 52 },
  { code: '82', name: 'Tiền Giang', fullName: 'Tỉnh Tiền Giang', displayOrder: 53 },
  { code: '83', name: 'Bến Tre', fullName: 'Tỉnh Bến Tre', displayOrder: 54 },
  { code: '84', name: 'Trà Vinh', fullName: 'Tỉnh Trà Vinh', displayOrder: 55 },
  { code: '86', name: 'Vĩnh Long', fullName: 'Tỉnh Vĩnh Long', displayOrder: 56 },
  { code: '87', name: 'Đồng Tháp', fullName: 'Tỉnh Đồng Tháp', displayOrder: 57 },
  { code: '89', name: 'An Giang', fullName: 'Tỉnh An Giang', displayOrder: 58 },
  { code: '91', name: 'Kiên Giang', fullName: 'Tỉnh Kiên Giang', displayOrder: 59 },
  { code: '93', name: 'Hậu Giang', fullName: 'Tỉnh Hậu Giang', displayOrder: 60 },
  { code: '94', name: 'Sóc Trăng', fullName: 'Tỉnh Sóc Trăng', displayOrder: 61 },
  { code: '95', name: 'Bạc Liêu', fullName: 'Tỉnh Bạc Liêu', displayOrder: 62 },
  { code: '96', name: 'Cà Mau', fullName: 'Tỉnh Cà Mau', displayOrder: 63 },
];

export const VIETNAM_OPEN_DATA_DISTRICTS: Record<string, DistrictDto[]> = {
  // TP. Hồ Chí Minh (79)
  '79': [
    { code: '760', name: 'Quận 1', fullName: 'Quận 1', provinceCode: '79' },
    { code: '769', name: 'TP. Thủ Đức', fullName: 'Thành phố Thủ Đức', provinceCode: '79' },
    { code: '770', name: 'Quận 3', fullName: 'Quận 3', provinceCode: '79' },
    { code: '771', name: 'Quận 10', fullName: 'Quận 10', provinceCode: '79' },
    { code: '774', name: 'Quận 5', fullName: 'Quận 5', provinceCode: '79' },
    { code: '778', name: 'Quận 7', fullName: 'Quận 7', provinceCode: '79' },
    { code: '765', name: 'Quận Bình Thạnh', fullName: 'Quận Bình Thạnh', provinceCode: '79' },
    { code: '764', name: 'Quận Gò Vấp', fullName: 'Quận Gò Vấp', provinceCode: '79' },
    { code: '766', name: 'Quận Tân Bình', fullName: 'Quận Tân Bình', provinceCode: '79' },
  ],
  // Hà Nội (01)
  '01': [
    { code: '001', name: 'Quận Ba Đình', fullName: 'Quận Ba Đình', provinceCode: '01' },
    { code: '002', name: 'Quận Hoàn Kiếm', fullName: 'Quận Hoàn Kiếm', provinceCode: '01' },
    { code: '005', name: 'Quận Cầu Giấy', fullName: 'Quận Cầu Giấy', provinceCode: '01' },
    { code: '006', name: 'Quận Đống Đa', fullName: 'Quận Đống Đa', provinceCode: '01' },
    { code: '007', name: 'Quận Hai Bà Trưng', fullName: 'Quận Hai Bà Trưng', provinceCode: '01' },
    { code: '008', name: 'Quận Hoàng Mai', fullName: 'Quận Hoàng Mai', provinceCode: '01' },
    { code: '009', name: 'Quận Thanh Xuân', fullName: 'Quận Thanh Xuân', provinceCode: '01' },
    { code: '019', name: 'Quận Nam Từ Liêm', fullName: 'Quận Nam Từ Liêm', provinceCode: '01' },
    { code: '021', name: 'Quận Bắc Từ Liêm', fullName: 'Quận Bắc Từ Liêm', provinceCode: '01' },
  ],
  // Đà Nẵng (48)
  '48': [
    { code: '490', name: 'Quận Hải Châu', fullName: 'Quận Hải Châu', provinceCode: '48' },
    { code: '491', name: 'Quận Thanh Khê', fullName: 'Quận Thanh Khê', provinceCode: '48' },
    { code: '492', name: 'Quận Sơn Trà', fullName: 'Quận Sơn Trà', provinceCode: '48' },
    { code: '493', name: 'Quận Ngũ Hành Sơn', fullName: 'Quận Ngũ Hành Sơn', provinceCode: '48' },
    { code: '494', name: 'Quận Liên Chiểu', fullName: 'Quận Liên Chiểu', provinceCode: '48' },
  ],
  // Hải Phòng (31)
  '31': [
    { code: '303', name: 'Quận Hồng Bàng', fullName: 'Quận Hồng Bàng', provinceCode: '31' },
    { code: '304', name: 'Quận Ngô Quyền', fullName: 'Quận Ngô Quyền', provinceCode: '31' },
    { code: '305', name: 'Quận Lê Chân', fullName: 'Quận Lê Chân', provinceCode: '31' },
  ],
  // Cần Thơ (92)
  '92': [
    { code: '916', name: 'Quận Ninh Kiều', fullName: 'Quận Ninh Kiều', provinceCode: '92' },
    { code: '918', name: 'Quận Cái Răng', fullName: 'Quận Cái Răng', provinceCode: '92' },
    { code: '917', name: 'Quận Bình Thủy', fullName: 'Quận Bình Thủy', provinceCode: '92' },
  ],
  // Bình Dương (74)
  '74': [
    { code: '718', name: 'TP. Thủ Dầu Một', fullName: 'Thành phố Thủ Dầu Một', provinceCode: '74' },
    { code: '725', name: 'TP. Thuận An', fullName: 'Thành phố Thuận An', provinceCode: '74' },
    { code: '724', name: 'TP. Dĩ An', fullName: 'Thành phố Dĩ An', provinceCode: '74' },
  ],
  // Đồng Nai (75)
  '75': [
    { code: '731', name: 'TP. Biên Hòa', fullName: 'Thành phố Biên Hòa', provinceCode: '75' },
    { code: '732', name: 'TP. Long Khánh', fullName: 'Thành phố Long Khánh', provinceCode: '75' },
  ],
};

export const VIETNAM_OPEN_DATA_WARDS: Record<string, WardDto[]> = {
  // Quận 1 (760)
  '760': [
    { code: '26734', name: 'Bến Nghé', fullName: 'Phường Bến Nghé', districtCode: '760' },
    { code: '26740', name: 'Bến Thành', fullName: 'Phường Bến Thành', districtCode: '760' },
    { code: '26743', name: 'Cầu Kho', fullName: 'Phường Cầu Kho', districtCode: '760' },
    { code: '26746', name: 'Cầu Ông Lãnh', fullName: 'Phường Cầu Ông Lãnh', districtCode: '760' },
    { code: '26749', name: 'Cô Giang', fullName: 'Phường Cô Giang', districtCode: '760' },
    { code: '26752', name: 'Đa Kao', fullName: 'Phường Đa Kao', districtCode: '760' },
    { code: '26755', name: 'Nguyễn Cư Trinh', fullName: 'Phường Nguyễn Cư Trinh', districtCode: '760' },
    { code: '26758', name: 'Nguyễn Thái Bình', fullName: 'Phường Nguyễn Thái Bình', districtCode: '760' },
    { code: '26761', name: 'Phạm Ngũ Lão', fullName: 'Phường Phạm Ngũ Lão', districtCode: '760' },
    { code: '26764', name: 'Tân Định', fullName: 'Phường Tân Định', districtCode: '760' },
  ],
  // TP Thủ Đức (769)
  '769': [
    { code: '26829', name: 'Thảo Điền', fullName: 'Phường Thảo Điền', districtCode: '769' },
    { code: '26832', name: 'An Phú', fullName: 'Phường An Phú', districtCode: '769' },
    { code: '26835', name: 'Hiệp Phú', fullName: 'Phường Hiệp Phú', districtCode: '769' },
    { code: '26838', name: 'Linh Trung', fullName: 'Phường Linh Trung', districtCode: '769' },
    { code: '26841', name: 'Thủ Thiêm', fullName: 'Phường Thủ Thiêm', districtCode: '769' },
  ],
  // Quận 3 (770)
  '770': [
    { code: '26770', name: 'Võ Thị Sáu', fullName: 'Phường Võ Thị Sáu', districtCode: '770' },
    { code: '26773', name: 'Phường 1', fullName: 'Phường 1', districtCode: '770' },
    { code: '26776', name: 'Phường 2', fullName: 'Phường 2', districtCode: '770' },
    { code: '26779', name: 'Phường 3', fullName: 'Phường 3', districtCode: '770' },
  ],
  // Cầu Giấy (005)
  '005': [
    { code: '00157', name: 'Nghĩa Đô', fullName: 'Phường Nghĩa Đô', districtCode: '005' },
    { code: '00160', name: 'Nghĩa Tân', fullName: 'Phường Nghĩa Tân', districtCode: '005' },
    { code: '00163', name: 'Mai Dịch', fullName: 'Phường Mai Dịch', districtCode: '005' },
    { code: '00166', name: 'Dịch Vọng', fullName: 'Phường Dịch Vọng', districtCode: '005' },
    { code: '00167', name: 'Dịch Vọng Hậu', fullName: 'Phường Dịch Vọng Hậu', districtCode: '005' },
    { code: '00169', name: 'Trung Hòa', fullName: 'Phường Trung Hòa', districtCode: '005' },
    { code: '00172', name: 'Yên Hòa', fullName: 'Phường Yên Hòa', districtCode: '005' },
  ],
  // Ba Đình (001)
  '001': [
    { code: '00001', name: 'Phúc Xá', fullName: 'Phường Phúc Xá', districtCode: '001' },
    { code: '00004', name: 'Trúc Bạch', fullName: 'Phường Trúc Bạch', districtCode: '001' },
    { code: '00008', name: 'Liễu Giai', fullName: 'Phường Liễu Giai', districtCode: '001' },
    { code: '00010', name: 'Kim Mã', fullName: 'Phường Kim Mã', districtCode: '001' },
    { code: '00013', name: 'Giảng Võ', fullName: 'Phường Giảng Võ', districtCode: '001' },
  ],
  // Hải Châu (490)
  '490': [
    { code: '20194', name: 'Hải Châu 1', fullName: 'Phường Hải Châu 1', districtCode: '490' },
    { code: '20197', name: 'Hải Châu 2', fullName: 'Phường Hải Châu 2', districtCode: '490' },
    { code: '20200', name: 'Thạch Thang', fullName: 'Phường Thạch Thang', districtCode: '490' },
  ],
};

// Fallback helper for missing districts/wards
function getFallbackDistricts(provinceCode: string): DistrictDto[] {
  const prov = VIETNAM_OPEN_DATA_PROVINCES.find((p) => p.code === provinceCode);
  const name = prov ? prov.name : 'Địa phương';
  return [
    { code: `D_${provinceCode}_1`, name: `TP. ${name}`, fullName: `Thành phố ${name}`, provinceCode },
    { code: `D_${provinceCode}_2`, name: `Huyện Trung Tâm`, fullName: `Huyện Trung Tâm ${name}`, provinceCode },
  ];
}

function getFallbackWards(districtCode: string): WardDto[] {
  return [
    { code: `W_${districtCode}_1`, name: 'Phường 1 (Trung tâm)', fullName: 'Phường 1 (Trung tâm)', districtCode },
    { code: `W_${districtCode}_2`, name: 'Phường 2', fullName: 'Phường 2', districtCode },
    { code: `W_${districtCode}_3`, name: 'Xã Nông Thôn Mới', fullName: 'Xã Nông Thôn Mới', districtCode },
  ];
}

// Local mock storage key
const getStorageKey = (userId?: string) => `madk_addresses_${userId || 'default_user'}`;

function getLocalAddresses(userId?: string): AddressDto[] {
  const raw = localStorage.getItem(getStorageKey(userId));
  if (!raw) {
    // Initial sample addresses
    const initial: AddressDto[] = [
      {
        id: 'addr-seed-001',
        userId: userId || 'customer-001',
        recipientName: 'Nguyễn Văn Khách',
        phoneNumber: '0987654321',
        provinceCode: '79',
        provinceName: 'Thành phố Hồ Chí Minh',
        districtCode: '760',
        districtName: 'Quận 1',
        wardCode: '26734',
        wardName: 'Phường Bến Nghé',
        detailedAddress: 'Số 123 Lê Duẩn, Tòa nhà Bitexco Diamond',
        fullAddress: 'Số 123 Lê Duẩn, Tòa nhà Bitexco Diamond, Phường Bến Nghé, Quận 1, Thành phố Hồ Chí Minh',
        isDefault: true,
        createdAt: new Date(Date.now() - 864000000).toISOString(),
      },
      {
        id: 'addr-seed-002',
        userId: userId || 'customer-001',
        recipientName: 'Nguyễn Văn Khách (Văn phòng)',
        phoneNumber: '0987654321',
        provinceCode: '01',
        provinceName: 'Thành phố Hà Nội',
        districtCode: '005',
        districtName: 'Quận Cầu Giấy',
        wardCode: '00166',
        wardName: 'Phường Dịch Vọng',
        detailedAddress: 'Tầng 8, Tòa nhà MadK Tower, Số 88 Đường Cầu Giấy',
        fullAddress: 'Tầng 8, Tòa nhà MadK Tower, Số 88 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Thành phố Hà Nội',
        isDefault: false,
        createdAt: new Date(Date.now() - 432000000).toISOString(),
      },
    ];
    localStorage.setItem(getStorageKey(userId), JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalAddresses(addresses: AddressDto[], userId?: string) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(addresses));
}

export const addressApi = {
  // 1. Đơn vị hành chính Việt Nam (Public)
  async getProvinces(): Promise<ProvinceDto[]> {
    try {
      const response = await apiClient.get<ApiEnvelope<ProvinceDto[]>>('/api/v1/addresses/provinces');
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback open data
    }
    return VIETNAM_OPEN_DATA_PROVINCES;
  },

  async getDistricts(provinceCode: string): Promise<DistrictDto[]> {
    if (!provinceCode) return [];
    try {
      const response = await apiClient.get<ApiEnvelope<DistrictDto[]>>(
        `/api/v1/addresses/provinces/${provinceCode}/districts`
      );
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback open data
    }
    return VIETNAM_OPEN_DATA_DISTRICTS[provinceCode] || getFallbackDistricts(provinceCode);
  },

  async getWards(districtCode: string): Promise<WardDto[]> {
    if (!districtCode) return [];
    try {
      const response = await apiClient.get<ApiEnvelope<WardDto[]>>(
        `/api/v1/addresses/districts/${districtCode}/wards`
      );
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback open data
    }
    return VIETNAM_OPEN_DATA_WARDS[districtCode] || getFallbackWards(districtCode);
  },

  // 2. Sổ địa chỉ người dùng (Authenticated, chống IDOR)
  async getMyAddresses(userId?: string): Promise<AddressDto[]> {
    try {
      const response = await apiClient.get<ApiEnvelope<AddressDto[]>>('/api/v1/users/me/addresses');
      if (response.data?.isSuccess && response.data.data) {
        saveLocalAddresses(response.data.data, userId);
        return response.data.data;
      }
    } catch {
      // Fallback local mock storage
    }
    return getLocalAddresses(userId);
  },

  async createAddress(data: CreateAddressRequestDto, userId?: string): Promise<AddressDto> {
    try {
      const response = await apiClient.post<ApiEnvelope<AddressDto>>('/api/v1/users/me/addresses', data);
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback local mock storage
    }

    const current = getLocalAddresses(userId);
    const prov = VIETNAM_OPEN_DATA_PROVINCES.find((p) => p.code === data.provinceCode);
    const districts = VIETNAM_OPEN_DATA_DISTRICTS[data.provinceCode] || getFallbackDistricts(data.provinceCode);
    const dist = districts.find((d) => d.code === data.districtCode);
    const wards = VIETNAM_OPEN_DATA_WARDS[data.districtCode] || getFallbackWards(data.districtCode);
    const ward = wards.find((w) => w.code === data.wardCode);

    const isDefault = data.isDefault || current.length === 0;

    if (isDefault) {
      current.forEach((a) => (a.isDefault = false));
    }

    const provName = prov?.fullName || 'Tỉnh/Thành';
    const distName = dist?.fullName || 'Quận/Huyện';
    const wardName = ward?.fullName || 'Phường/Xã';

    const newAddr: AddressDto = {
      id: 'addr-' + Date.now(),
      userId: userId || 'customer-001',
      recipientName: data.recipientName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      provinceCode: data.provinceCode,
      provinceName: provName,
      districtCode: data.districtCode,
      districtName: distName,
      wardCode: data.wardCode,
      wardName: wardName,
      detailedAddress: data.detailedAddress.trim(),
      fullAddress: `${data.detailedAddress.trim()}, ${wardName}, ${distName}, ${provName}`,
      isDefault,
      createdAt: new Date().toISOString(),
    };

    current.unshift(newAddr);
    saveLocalAddresses(current, userId);
    return newAddr;
  },

  async updateAddress(id: string, data: UpdateAddressRequestDto, userId?: string): Promise<AddressDto> {
    try {
      const response = await apiClient.put<ApiEnvelope<AddressDto>>(`/api/v1/users/me/addresses/${id}`, data);
      if (response.data?.isSuccess && response.data.data) {
        return response.data.data;
      }
    } catch {
      // Fallback local mock storage
    }

    const current = getLocalAddresses(userId);
    const idx = current.findIndex((a) => a.id === id);
    if (idx === -1) {
      throw new Error('Không tìm thấy địa chỉ.');
    }

    const prov = VIETNAM_OPEN_DATA_PROVINCES.find((p) => p.code === data.provinceCode);
    const districts = VIETNAM_OPEN_DATA_DISTRICTS[data.provinceCode] || getFallbackDistricts(data.provinceCode);
    const dist = districts.find((d) => d.code === data.districtCode);
    const wards = VIETNAM_OPEN_DATA_WARDS[data.districtCode] || getFallbackWards(data.districtCode);
    const ward = wards.find((w) => w.code === data.wardCode);

    let isDefault = !!data.isDefault;
    if (!isDefault && current[idx].isDefault && current.length === 1) {
      isDefault = true;
    }

    if (isDefault) {
      current.forEach((a) => {
        if (a.id !== id) a.isDefault = false;
      });
    }

    const provName = prov?.fullName || current[idx].provinceName;
    const distName = dist?.fullName || current[idx].districtName;
    const wardName = ward?.fullName || current[idx].wardName;

    const updated: AddressDto = {
      ...current[idx],
      recipientName: data.recipientName.trim(),
      phoneNumber: data.phoneNumber.trim(),
      provinceCode: data.provinceCode,
      provinceName: provName,
      districtCode: data.districtCode,
      districtName: distName,
      wardCode: data.wardCode,
      wardName: wardName,
      detailedAddress: data.detailedAddress.trim(),
      fullAddress: `${data.detailedAddress.trim()}, ${wardName}, ${distName}, ${provName}`,
      isDefault,
      updatedAt: new Date().toISOString(),
    };

    current[idx] = updated;
    saveLocalAddresses(current, userId);
    return updated;
  },

  async deleteAddress(id: string, userId?: string): Promise<void> {
    try {
      await apiClient.delete<ApiEnvelope<void>>(`/api/v1/users/me/addresses/${id}`);
      return;
    } catch {
      // Fallback local mock storage
    }

    const current = getLocalAddresses(userId);
    const target = current.find((a) => a.id === id);
    const remaining = current.filter((a) => a.id !== id);

    if (target?.isDefault && remaining.length > 0) {
      remaining[0].isDefault = true;
    }

    saveLocalAddresses(remaining, userId);
  },

  async setDefaultAddress(id: string, userId?: string): Promise<void> {
    try {
      await apiClient.put<ApiEnvelope<void>>(`/api/v1/users/me/addresses/${id}/default`);
      return;
    } catch {
      // Fallback local mock storage
    }

    const current = getLocalAddresses(userId);
    current.forEach((a) => {
      a.isDefault = a.id === id;
    });
    saveLocalAddresses(current, userId);
  },
};
