export const PRIMARY_TABS = [
  { id: "general", label: "الإعدادات العامة" },
  { id: "contracts", label: "إعدادات العقود" },
];

// `section` is null for meter-fees — no dedicated catalog key yet, stays behind the umbrella
// settings.view gate (see docs/backend-permission-sections-request.md).
export const CONTRACT_SUB_TABS = [
  { id: "popup-contracts", label: "محتوى إرشادي للعقود", section: "popup_contracts" },
  { id: "instrument-types", label: "أنواع الصكوك", section: "instrument_settings" },
  { id: "sms-settings", label: "إعدادات رسائل SMS", section: "sms" },
  { id: "meter-fees", label: "رسوم العدادات", section: null },
  { id: "payment-messages", label: "إعدادات رسائل الدفع", section: "payment_messages" },
];

/** Legacy `?sub=` values from the pre-wiring mock tabs. */
export const CONTRACT_SUB_TAB_ALIASES = {
  guidance: "popup-contracts",
  sms: "sms-settings",
};

// `section` matches a PERMISSION_SECTIONS key — see config/permissions.php (backend) → screens /
// duplicate_screens for the authoritative mapping.
export const SYSTEM_CATEGORIES = [
  { id: "app-status", label: "حالة التطبيق والإصدارات", subtitle: "تشغيل/إيقاف · إصدارات الجوال", href: "/home/settings/app-status", section: "settings" },
  { id: "unit-types", label: "أنواع الوحدات", subtitle: "قائمة بقيم · 10 عنصر", href: "/home/settings/unit-types", section: "property_reference" },
  { id: "unit-usage", label: "استخدام الوحدة", subtitle: "قائمة بقيم · 5 عنصر", href: "/home/settings/unit-usage", section: "property_reference" },
  { id: "regions", label: "المناطق", subtitle: "قائمة · 8 عنصر", href: "/home/settings/regions", section: "regions" },
  { id: "cities", label: "المدن", subtitle: "قائمة بقيم · 10 عنصر", href: "/home/settings/cities", section: "cities" },
  { id: "property-types", label: "أنواع العقار", subtitle: "قائمة بقيم · 10 عنصر", href: "/home/settings/property-types", section: "property_reference" },
  { id: "property-usage", label: "استخدام العقار", subtitle: "قائمة بقيم · 5 عنصر", href: "/home/settings/property-usage", section: "property_reference" },
  { id: "order-duration", label: "مدة الطلب", subtitle: "سجلات · 4 عنصر", href: "/home/settings/order-duration", section: "contract_periods" },
  { id: "message-sections", label: "أقسام الرسائل", subtitle: "سجلات · 5 عنصر", href: "/home/settings/message-sections", section: "message_alerts" },
  { id: "message-section-items", label: "بنود أقسام الرسائل", subtitle: "قائمة بقيم · 3 عنصر", href: "/home/settings/message-section-items", section: "message_alerts" },
  { id: "customer-app-messages", label: "الرسائل التطبيقية للعميل", subtitle: "رسائل موجّهة · 2 عنصر", href: "/home/settings/customer-app-messages", section: "app_content" },
  { id: "message-for-employee", label: "رسائل توضيحية للموظفين", subtitle: "رسائل موجّهة · 1 عنصر", href: "/home/settings/message-for-employee", section: "message_alerts" },
  { id: "message-for-property", label: "رسائل توضيحية للعقار", subtitle: "رسائل موجّهة · 1 عنصر", href: "/home/settings/message-for-property", section: "message_alerts" },
  { id: "coupons", label: "الخصومات (الكوبونات)", subtitle: "كوبونات · 5 عنصر", href: "/home/settings/coupons", section: "coupons" },
  { id: "blogs", label: "المدونة", subtitle: "رابط", href: "/home/settings/blogs", section: "blogs" },
  { id: "faqs", label: "الأسئلة الشائعة", subtitle: "أسئلة وأجوبة · 2 عنصر", href: "/home/settings/faqs", section: "faqs" },
  { id: "terms", label: "الشروط والأحكام", subtitle: "محتوى نصّي", href: "/home/settings/terms", section: "app_content" },
  { id: "privacy", label: "سياسة الخصوصية", subtitle: "محتوى نصّي", href: "/home/settings/privacy", section: "app_content" },
  { id: "notifications", label: "الإشعارات", subtitle: "إرسال إشعار", href: "/home/settings/notifications", section: "notifications" },
  { id: "payments", label: "المدفوعات", subtitle: "سجل المدفوعات", href: "/home/settings/payments", section: "payments" },
  { id: "payment-types", label: "طرق الدفع", subtitle: "سجلات · 5 عنصر", href: "/home/settings/payment-types", section: "app_content" },
  { id: "tenant-roles", label: "صلاحيات المستأجر", subtitle: "سجلات · 3 عنصر", href: "/home/settings/tenant-roles", section: "tenant_roles" },
  { id: "paperworks", label: "أوراق العمل", subtitle: "سجلات · 4 عنصر", href: "/home/settings/paperworks", section: "paperworks" },
];

export const DOCUMENT_TYPES = [
  "ورقة مبايعة",
  "صك ملكية ورقي",
  "صك ملكية إلكتروني من وزارة العدل",
  "صك ملكية إلكتروني من وزارة العدل والسجل العيني",
  "صك ملكية إلكتروني من السجل العقاري",
  "صك ملكية والمالك متوفى",
  "حجة استحكام",
  "عقد إيجار من الباطن",
  "تجديد عقد إيجار",
];

export const MOCK_GUIDANCE_ROWS = [
  {
    id: 1,
    documentType: "ورقة مبايعة",
    contractPopup: true,
    propertyPopup: false,
    content: "محتوى إرشادي لورقة المبايعة",
    buttonText: "واتساب",
    buttonLink: "",
  },
  {
    id: 2,
    documentType: "صك ملكية ورقي",
    contractPopup: true,
    propertyPopup: true,
    content: "يحتاج الصك الورقي معالجة إضافية قبل الإدخال",
    buttonText: "start",
    buttonLink: "https://aqdi.sa/start",
  },
  {
    id: 3,
    documentType: "صك ملكية إلكتروني من وزارة العدل",
    contractPopup: true,
    propertyPopup: false,
    content:
      "عميلنا العزيز، نود تنبيهك بأن الصك الإلكتروني يُستخرج مباشرة من وزارة العدل، ويُفضّل التأكد من صحة البيانات قبل المتابعة.",
    buttonText: "واتساب",
    buttonLink: "https://aqdi.sa/wa",
  },
];

export const MOCK_INSTRUMENT_TYPES = [
  { id: 1, name: "صك ملكية إلكتروني من وزارة العدل", label: "صك إلكتروني", showInProperty: true, showInContract: true },
  { id: 2, name: "صك ملكية ورقي", label: "صك ورقي", showInProperty: true, showInContract: true },
  { id: 3, name: "ورقة مبايعة", label: "ورقة مبايعة", showInProperty: false, showInContract: true },
  { id: 4, name: "حجة استحكام", label: "حجة استحكام", showInProperty: true, showInContract: false },
  { id: 5, name: "عقد إيجار من الباطن", label: "إيجار من الباطن", showInProperty: false, showInContract: true },
  { id: 6, name: "تجديد عقد إيجار", label: "تجديد إيجار", showInProperty: false, showInContract: true },
];

export const MOCK_SMS_SETTINGS = {
  sms_user: "مرحباً، تم استلام طلبك بنجاح وسيتم التواصل معك قريباً.",
  sms_owner: "تم تسجيل طلب جديد على عقارك. يمكنك متابعة الحالة من لوحة المالك.",
  sms_employee: "تم إسناد طلب جديد إليك. يرجى مراجعته واستكمال الإجراءات.",
};

export const SMS_FIELDS = [
  { key: "sms_user", label: "رسالة للمستخدم", description: "رسالة SMS عامة للمستخدم على مستوى المشروع" },
  { key: "sms_owner", label: "رسالة للمالك", description: "رسالة SMS عامة للمالك على مستوى المشروع" },
  { key: "sms_employee", label: "رسالة للموظف", description: "رسالة SMS عامة للموظف على مستوى المشروع" },
];

export const MOCK_METER_FEES = {
  electricity_meter_fee_commercial_tenant: "150",
  electricity_meter_fee_housing_tenant: "80",
  water_meter_fee_commercial_tenant: "90",
  water_meter_fee_housing_tenant: "45",
};

export const METER_FEE_FIELDS = [
  { key: "electricity_meter_fee_commercial_tenant", label: "رسوم العداد الكهربائي تجاري للمستأجر" },
  { key: "electricity_meter_fee_housing_tenant", label: "رسوم العداد الكهربائي منزلي للمستأجر" },
  { key: "water_meter_fee_commercial_tenant", label: "رسوم عداد المياه تجاري للمستأجر" },
  { key: "water_meter_fee_housing_tenant", label: "رسوم عداد المياه منزلي للمستأجر" },
];

export const MOCK_PAYMENT_MESSAGES = [
  {
    type: "success",
    label: "رسالة نجاح الدفع",
    description: "تظهر للعميل بعد إتمام عملية الدفع بنجاح",
    message: "تم الدفع بنجاح. شكراً لثقتك في «عقد إيجار».",
    buttonText: "عرض العقد",
    buttonLink: "https://aqdi.sa/contract",
    buttonText2: "الرئيسية",
    buttonLink2: "https://aqdi.sa",
  },
  {
    type: "failed",
    label: "رسالة فشل الدفع",
    description: "تظهر للعميل عند فشل عملية الدفع",
    message: "تعذر إتمام عملية الدفع. يرجى المحاولة مرة أخرى أو اختيار وسيلة دفع أخرى.",
    buttonText: "إعادة المحاولة",
    buttonLink: "https://aqdi.sa/pay",
    buttonText2: "الدعم",
    buttonLink2: "https://aqdi.sa/support",
  },
];
