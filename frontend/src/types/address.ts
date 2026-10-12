export interface ProvinceDto {
  code: string;
  name: string;
  fullName: string;
  displayOrder: number;
}

export interface DistrictDto {
  code: string;
  name: string;
  fullName: string;
  provinceCode: string;
}

export interface WardDto {
  code: string;
  name: string;
  fullName: string;
  districtCode: string;
}

export interface AddressDto {
  id: string;
  userId: string;
  recipientName: string;
  phoneNumber: string;
  provinceCode: string;
  provinceName: string;
  districtCode: string;
  districtName: string;
  wardCode: string;
  wardName: string;
  detailedAddress: string;
  fullAddress: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateAddressRequestDto {
  recipientName: string;
  phoneNumber: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  detailedAddress: string;
  isDefault?: boolean;
}

export interface UpdateAddressRequestDto {
  recipientName: string;
  phoneNumber: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  detailedAddress: string;
  isDefault?: boolean;
}
