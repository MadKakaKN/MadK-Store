import React, { useState, useEffect } from 'react';
import { addressApi } from '../../../api/addressApi';
import type { ProvinceDto, DistrictDto, WardDto, AddressDto, CreateAddressRequestDto } from '../../../types/address';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: AddressDto | null;
  userId?: string;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  userId,
}) => {
  // Form fields
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  // Administrative hierarchy state
  const [provinces, setProvinces] = useState<ProvinceDto[]>([]);
  const [districts, setDistricts] = useState<DistrictDto[]>([]);
  const [wards, setWards] = useState<WardDto[]>([]);

  // Loading states
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // Load provinces on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProvinces = async () => {
      try {
        const list = await addressApi.getProvinces();
        if (isMounted) setProvinces(list);
      } catch (err) {
        console.error('L?i khi t?i danh sách t?nh thành:', err);
      }
    };
    fetchProvinces();
    return () => {
      isMounted = false;
    };
  }, []);

  // Populate form when editing or resetting
  useEffect(() => {
    if (initialData) {
      setRecipientName(initialData.recipientName);
      setPhoneNumber(initialData.phoneNumber);
      setProvinceCode(initialData.provinceCode);
      setDistrictCode(initialData.districtCode);
      setWardCode(initialData.wardCode);
      setDetailedAddress(initialData.detailedAddress);
      setIsDefault(initialData.isDefault);

      // Preload districts and wards for existing address
      if (initialData.provinceCode) {
        addressApi.getDistricts(initialData.provinceCode).then((dList) => {
          setDistricts(dList);
          if (initialData.districtCode) {
            addressApi.getWards(initialData.districtCode).then((wList) => {
              setWards(wList);
            });
          }
        });
      }
    } else {
      setRecipientName('');
      setPhoneNumber('');
      setProvinceCode('');
      setDistrictCode('');
      setWardCode('');
      setDetailedAddress('');
      setIsDefault(false);
      setDistricts([]);
      setWards([]);
    }
    setErrors({});
    setServerError(null);
  }, [initialData, isOpen]);

  // Handle Province change -> Load Districts & Reset Ward
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setProvinceCode(code);
    setDistrictCode('');
    setWardCode('');
    setWards([]);
    setDistricts([]);

    if (errors.provinceCode) setErrors((prev) => ({ ...prev, provinceCode: '' }));

    if (code) {
      setIsLoadingLocations(true);
      try {
        const dList = await addressApi.getDistricts(code);
        setDistricts(dList);
      } catch (err) {
        console.error('L?i t?i qu?n/huy?n:', err);
      } finally {
        setIsLoadingLocations(false);
      }
    }
  };

  // Handle District change -> Load Wards
  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setDistrictCode(code);
    setWardCode('');
    setWards([]);

    if (errors.districtCode) setErrors((prev) => ({ ...prev, districtCode: '' }));

    if (code) {
      setIsLoadingLocations(true);
      try {
        const wList = await addressApi.getWards(code);
        setWards(wList);
      } catch (err) {
        console.error('L?i t?i phu?ng/xã:', err);
      } finally {
        setIsLoadingLocations(false);
      }
    }
  };

  // Handle Ward change
  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setWardCode(e.target.value);
    if (errors.wardCode) setErrors((prev) => ({ ...prev, wardCode: '' }));
  };

  // Client-side validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!recipientName.trim()) {
      newErrors.recipientName = 'Vui lòng nh?p h? và tên ngu?i nh?n.';
    } else if (recipientName.trim().length < 2) {
      newErrors.recipientName = 'Tên ngu?i nh?n ph?i có ít nh?t 2 ký t?.';
    }

    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Vui lòng nh?p s? di?n tho?i.';
    } else if (!phoneRegex.test(phoneNumber.trim().replace(/\s+/g, ''))) {
      newErrors.phoneNumber = 'S? di?n tho?i không dúng d?nh d?ng Vi?t Nam (10 ch? s?).';
    }

    if (!provinceCode) {
      newErrors.provinceCode = 'Vui lòng ch?n T?nh/Thành ph?.';
    }

    if (!districtCode) {
      newErrors.districtCode = 'Vui lòng ch?n Qu?n/Huy?n.';
    }

    if (!wardCode) {
      newErrors.wardCode = 'Vui lòng ch?n Phu?ng/Xã.';
    }

    if (!detailedAddress.trim()) {
      newErrors.detailedAddress = 'Vui lòng nh?p s? nhà, tên du?ng ho?c tòa nhà.';
    } else if (detailedAddress.trim().length < 3) {
      newErrors.detailedAddress = 'Ð?a ch? chi ti?t ph?i có ít nh?t 3 ký t?.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const selectedProv = provinces.find((p) => p.code === provinceCode);
      const selectedDist = districts.find((d) => d.code === districtCode);
      const selectedWard = wards.find((w) => w.code === wardCode);

      const payload: CreateAddressRequestDto = {
        recipientName: recipientName.trim(),
        phoneNumber: phoneNumber.trim(),
        provinceCode,
        provinceName: selectedProv?.fullName || selectedProv?.name || "",
 districtCode,
        districtName: selectedDist?.fullName || selectedDist?.name || "",
 wardCode,
        wardName: selectedWard?.fullName || selectedWard?.name || "",
 detailedAddress: detailedAddress.trim(),
 isDefault,
 };

      if (initialData) {
        await addressApi.updateAddress(initialData.id, payload, userId);
      } else {
        await addressApi.createAddress(payload, userId);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có l?i x?y ra khi luu d?a ch?. Vui lòng th? l?i.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="relative transform overflow-hidden rounded-3xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl border border-slate-100">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {initialData ? 'Ch?nh s?a d?a ch? nh?n hàng' : 'Thêm d?a ch? nh?n hàng m?i'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng nh?p d?a ch? chính xác d? nh?n hàng nhanh chóng
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 rounded-full p-1.5 hover:bg-slate-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {serverError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span>??</span>
                <span>{serverError}</span>
              </div>
            )}

            {/* Recipient & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  H? và tên ngu?i nh?n <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => {
                    setRecipientName(e.target.value);
                    if (errors.recipientName) setErrors((prev) => ({ ...prev, recipientName: '' }));
                  }}
                  placeholder="Ví d?: Nguy?n Van A"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                    errors.recipientName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all`}
                />
                {errors.recipientName && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.recipientName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  S? di?n tho?i <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
                  }}
                  placeholder="Ví d?: 0901234567"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                    errors.phoneNumber ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all`}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* Cascading Dropdowns: Level 1 - T?nh/Thành */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                T?nh / Thành ph? <span className="text-rose-500">*</span>
              </label>
              <select
                value={provinceCode}
                onChange={handleProvinceChange}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white ${
                  errors.provinceCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all`}
              >
                <option value="">-- Ch?n T?nh / Thành ph? --</option>
                {provinces.map((prov) => (
                  <option key={prov.code} value={prov.code}>
                    {prov.fullName}
                  </option>
                ))}
              </select>
              {errors.provinceCode && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.provinceCode}</p>
              )}
            </div>

            {/* Cascading Dropdowns: Level 2 & 3 - Qu?n/Huy?n & Phu?ng/Xã */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Qu?n / Huy?n <span className="text-rose-500">*</span>
                </label>
                <select
                  value={districtCode}
                  onChange={handleDistrictChange}
                  disabled={!provinceCode || isLoadingLocations}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white disabled:bg-slate-50 disabled:text-slate-400 ${
                    errors.districtCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all`}
                >
                  <option value="">
                    {!provinceCode ? 'Vui lòng ch?n T?nh/Thành tru?c' : '-- Ch?n Qu?n / Huy?n --'}
                  </option>
                  {districts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.fullName}
                    </option>
                  ))}
                </select>
                {errors.districtCode && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.districtCode}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phu?ng / Xã <span className="text-rose-500">*</span>
                </label>
                <select
                  value={wardCode}
                  onChange={handleWardChange}
                  disabled={!districtCode || isLoadingLocations}
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm border bg-white disabled:bg-slate-50 disabled:text-slate-400 ${
                    errors.wardCode ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all`}
                >
                  <option value="">
                    {!districtCode ? 'Vui lòng ch?n Qu?n/Huy?n tru?c' : '-- Ch?n Phu?ng / Xã --'}
                  </option>
                  {wards.map((w) => (
                    <option key={w.code} value={w.code}>
                      {w.fullName}
                    </option>
                  ))}
                </select>
                {errors.wardCode && (
                  <p className="mt-1 text-xs text-rose-500 font-medium">{errors.wardCode}</p>
                )}
              </div>
            </div>

            {/* Detailed Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ð?a ch? c? th? (S? nhà, Tên du?ng, Tòa nhà) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={detailedAddress}
                onChange={(e) => {
                  setDetailedAddress(e.target.value);
                  if (errors.detailedAddress) setErrors((prev) => ({ ...prev, detailedAddress: '' }));
                }}
                placeholder="Ví d?: Tòa Landmark 81, S? 720A Ði?n Biên Ph?"
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border ${
                  errors.detailedAddress ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                } focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all`}
              />
              {errors.detailedAddress && (
                <p className="mt-1 text-xs text-rose-500 font-medium">{errors.detailedAddress}</p>
              )}
            </div>

            {/* Is Default Checkbox */}
            <div className="flex items-center pt-1">
              <input
                id="is-default-checkbox"
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded cursor-pointer"
              />
              <label htmlFor="is-default-checkbox" className="ml-2 text-xs font-semibold text-slate-700 cursor-pointer">
                Ð?t làm d?a ch? giao hàng m?c d?nh
              </label>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                H?y
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Ðang luu...</span>
                  </>
                ) : (
                  <span>{initialData ? 'C?p nh?t d?a ch?' : 'Thêm d?a ch?'}</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
