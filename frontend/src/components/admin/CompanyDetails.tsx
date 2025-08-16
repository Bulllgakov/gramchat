import React, { useState, useEffect } from 'react';
import { api } from '../../config/api.config';
import { Loader2, Save, Building2, AlertCircle } from 'lucide-react';

interface CompanyDetailsData {
  companyName: string;
  legalForm?: string;
  inn: string;
  kpp?: string;
  ogrn?: string;
  legalAddress: string;
  postalAddress?: string;
  bankName: string;
  bik: string;
  correspondentAccount?: string;
  settlementAccount: string;
  phone: string;
  email: string;
  website?: string;
  directorName: string;
  directorPosition: string;
  directorBasis: string;
  taxSystem?: string;
  okpo?: string;
  oktmo?: string;
  okved?: string;
  tbankUrl?: string;
}

export const CompanyDetails: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompanyDetailsData>({
    companyName: '',
    legalForm: '',
    inn: '',
    kpp: '',
    ogrn: '',
    legalAddress: '',
    postalAddress: '',
    bankName: '',
    bik: '',
    correspondentAccount: '',
    settlementAccount: '',
    phone: '',
    email: '',
    website: '',
    directorName: '',
    directorPosition: 'Генеральный директор',
    directorBasis: 'Устава',
    taxSystem: '',
    okpo: '',
    oktmo: '',
    okved: '',
    tbankUrl: 'https://026401027275.tb.ru'
  });

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const response = await api.get('/company');
      if (response.data) {
        setFormData(response.data);
      }
    } catch (err) {
      console.error('Error fetching company details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/company', formData);
      setSuccess('Реквизиты успешно сохранены');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка при сохранении реквизитов');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Реквизиты компании</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          {/* Основная информация */}
          <div>
            <h3 className="text-lg font-medium mb-4">Основная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Наименование организации *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Правовая форма
                </label>
                <input
                  type="text"
                  name="legalForm"
                  value={formData.legalForm}
                  onChange={handleChange}
                  placeholder="ООО, ИП, АО"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ИНН *
                </label>
                <input
                  type="text"
                  name="inn"
                  value={formData.inn}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{10}|[0-9]{12}"
                  placeholder="10 или 12 цифр"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  КПП
                </label>
                <input
                  type="text"
                  name="kpp"
                  value={formData.kpp}
                  onChange={handleChange}
                  pattern="[0-9]{9}"
                  placeholder="9 цифр (для юрлиц)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ОГРН/ОГРНИП
                </label>
                <input
                  type="text"
                  name="ogrn"
                  value={formData.ogrn}
                  onChange={handleChange}
                  pattern="[0-9]{13}|[0-9]{15}"
                  placeholder="13 или 15 цифр"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Адреса */}
          <div>
            <h3 className="text-lg font-medium mb-4">Адреса</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Юридический адрес *
                </label>
                <input
                  type="text"
                  name="legalAddress"
                  value={formData.legalAddress}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Почтовый адрес
                </label>
                <input
                  type="text"
                  name="postalAddress"
                  value={formData.postalAddress}
                  onChange={handleChange}
                  placeholder="Если отличается от юридического"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Банковские реквизиты */}
          <div>
            <h3 className="text-lg font-medium mb-4">Банковские реквизиты</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название банка *
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  БИК *
                </label>
                <input
                  type="text"
                  name="bik"
                  value={formData.bik}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{9}"
                  placeholder="9 цифр"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Корр. счет
                </label>
                <input
                  type="text"
                  name="correspondentAccount"
                  value={formData.correspondentAccount}
                  onChange={handleChange}
                  pattern="[0-9]{20}"
                  placeholder="20 цифр"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Расчетный счет *
                </label>
                <input
                  type="text"
                  name="settlementAccount"
                  value={formData.settlementAccount}
                  onChange={handleChange}
                  required
                  pattern="[0-9]{20}"
                  placeholder="20 цифр"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Контактная информация */}
          <div>
            <h3 className="text-lg font-medium mb-4">Контактная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Телефон *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Сайт
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Руководитель */}
          <div>
            <h3 className="text-lg font-medium mb-4">Руководитель</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ФИО директора *
                </label>
                <input
                  type="text"
                  name="directorName"
                  value={formData.directorName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Должность
                </label>
                <input
                  type="text"
                  name="directorPosition"
                  value={formData.directorPosition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Действует на основании
                </label>
                <input
                  type="text"
                  name="directorBasis"
                  value={formData.directorBasis}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Дополнительная информация */}
          <div>
            <h3 className="text-lg font-medium mb-4">Дополнительная информация</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Система налогообложения
                </label>
                <input
                  type="text"
                  name="taxSystem"
                  value={formData.taxSystem}
                  onChange={handleChange}
                  placeholder="УСН, ОСН, ЕНВД"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ОКВЭД
                </label>
                <input
                  type="text"
                  name="okved"
                  value={formData.okved}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ОКПО
                </label>
                <input
                  type="text"
                  name="okpo"
                  value={formData.okpo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ОКТМО
                </label>
                <input
                  type="text"
                  name="oktmo"
                  value={formData.oktmo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ссылка на Тбанк
                </label>
                <input
                  type="url"
                  name="tbankUrl"
                  value={formData.tbankUrl}
                  onChange={handleChange}
                  placeholder="https://026401027275.tb.ru"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Кнопка сохранения */}
          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Сохранить реквизиты
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};