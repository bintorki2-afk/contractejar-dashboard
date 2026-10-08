/**
 * مدة قصيرة مقروءة بالعربية من الدقائق: «45 د» · «3 س و 20 د» · «57 يوم و 13 س».
 * (د6: «متوسط مدة الإنجاز» كان يُقص عند الساعات الكبيرة مثل «1381 س و …».)
 */
export function formatDurationMinutes(value) {
  const minutes = Math.max(0, Math.round(Number(value) || 0));
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;
  if (hours < 24) return restMinutes ? `${hours} س و ${restMinutes} د` : `${hours} س`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days} يوم و ${restHours} س` : `${days} يوم`;
}

/** نفس التنسيق من ساعات (عشرية) — null ⇒ «—». */
export function formatDurationHours(value) {
  if (value == null || value === "") return "—";
  return formatDurationMinutes(Number(value) * 60);
}
