/**
 * تهيئة نص البحث قبل إرساله للخادم.
 * الجوال يُخزَّن بصيغ مختلفة (009665…، 9665…، 05…، 5…) والخادم يبحث بمطابقة جزئية،
 * فالبحث بـ «05XXXXXXXX» (الصيغة التي يكتبها الموظف عادة) لا يجد المحفوظ بـ 00966.
 * لذلك نحوّل أي جوال سعودي إلى الجزء المشترك بين كل الصيغ «5XXXXXXXX»،
 * ونحوّل الأرقام العربية/الفارسية إلى لاتينية. أي نص آخر يُرسل كما هو.
 */
export function normalizeAdminSearch(raw) {
  let term = String(raw ?? "").trim();
  if (!term) return "";

  term = term
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));

  const compact = term.replace(/[\s\-()]/g, "");
  const mobile = compact.match(/^(?:\+966|00966|966|0)?(5\d{8})$/);
  if (mobile) return mobile[1];

  return term;
}
