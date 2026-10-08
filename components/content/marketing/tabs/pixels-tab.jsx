"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { RotateCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";
import {
  useImportAdSpend,
  useSyncAdSpend,
  useUtmTemplate,
} from "@/src/hooks/use-marketing-integrations";
import SectionCard from "../shared/section-card";
import { StatCardRow } from "../shared/stat-card";
import { TrackingState } from "../shared/tracking-ui";
import { AD_PIXELS, ANALYTICS_SOURCES, TRACKED_EVENTS } from "../shared/mock-data";

const PLATFORM_LABEL_AR = {
  google: "قوقل",
  meta: "ميتا",
  tiktok: "تيك توك",
  snapchat: "سناب",
  twitter: "إكس",
};

export default function PixelsTab() {
  const { can } = usePermissions();
  const canManage = can(PERMISSION_SECTIONS.analytics, "create");

  const utm = useUtmTemplate();
  const syncMutation = useSyncAdSpend();

  const accountStats = useMemo(() => {
    const total = utm.accounts.length;
    const connected = utm.accounts.filter((a) => a.configured).length;
    return [
      { value: total ? `${connected} / ${total}` : "—", label: "حسابات إعلانية مربوطة", tone: "g" },
      { value: String(utm.sources.length || "—"), label: "مصادر UTM معتمدة", tone: "b" },
      { value: String(utm.clickIds.length || "—"), label: "معرّفات نقر متتبَّعة", tone: "e" },
    ];
  }, [utm.accounts, utm.sources, utm.clickIds]);

  const handleSync = (platform) => {
    syncMutation.mutate(
      { days: 30, ...(platform ? { platform } : {}) },
      {
        onSuccess: (data) => {
          const results = Object.entries(data || {});
          const synced = results.reduce((sum, [, r]) => sum + (r?.synced || 0), 0);
          const skipped = results.filter(([, r]) => r?.skipped).map(([p]) => PLATFORM_LABEL_AR[p] || p);
          if (synced > 0) toast.success(`تمت مزامنة ${synced} صف من صرف الإعلانات`);
          else if (skipped.length)
            toast.message("لا توجد حسابات إعلانية مُهيّأة", {
              description: `بحاجة إلى إعداد: ${skipped.join("، ")}`,
            });
          else toast.success("اكتملت المزامنة — لا جديد");
        },
        onError: (err) =>
          toast.error(err?.response?.data?.message || "تعذّرت مزامنة صرف الإعلانات"),
      }
    );
  };

  return (
    <div>
      <StatCardRow items={accountStats} />

      {/* Ad accounts — live from utm-template `accounts[]` */}
      <SectionCard
        title="الحسابات الإعلانية ومزامنة الصرف"
        className="mt-[14px]"
        action={
          canManage ? (
            <button
              type="button"
              className="mk-mini inline-flex items-center gap-1.5"
              onClick={() => handleSync()}
              disabled={syncMutation.isPending}
            >
              <RotateCw className={cn("size-3.5", syncMutation.isPending && "animate-spin")} />
              {syncMutation.isPending ? "جارٍ المزامنة…" : "مزامنة الكل"}
            </button>
          ) : null
        }
      >
        <TrackingState
          isLoading={utm.isLoading}
          error={utm.error}
          isEmpty={!utm.isLoading && utm.accounts.length === 0}
          onRetry={utm.refetch}
          emptyText="تعذّر تحميل حالة الحسابات الإعلانية."
        >
          <div className="mkt-pixgrid">
            {utm.accounts.map((acc) => (
              <div key={acc.platform} className={cn("mkt-pixcard", !acc.configured && "off")}>
                <div className="mkt-pixtop">
                  <div className="mkt-pixname">
                    <i className={cn("mkt-pixdot", acc.configured && "on")} />
                    {acc.label || acc.platform}
                  </div>
                  <span className={cn("ncnt", acc.configured ? "s-done" : "s-arch")}>
                    {acc.configured ? "مربوط" : "غير مُهيّأ"}
                  </span>
                </div>
                <div className="mkt-pixid">utm_source: {acc.utm_source || acc.platform}</div>
                {!acc.configured && acc.missing?.length ? (
                  <p className="mkt-pixlast" style={{ marginBottom: 8 }} dir="ltr">
                    مفقود: {acc.missing.join(", ")}
                  </p>
                ) : null}
                {canManage ? (
                  <button
                    type="button"
                    className="mk-mini"
                    style={{ marginTop: 8, width: "100%" }}
                    onClick={() => handleSync(acc.platform)}
                    disabled={syncMutation.isPending || !acc.configured}
                    title={!acc.configured ? "الحساب غير مُهيّأ على الخادم" : undefined}
                  >
                    مزامنة هذا الحساب
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </TrackingState>
      </SectionCard>

      {canManage ? <ManualSpendCard /> : null}

      {/* UTM builder — live from utm-template */}
      <UtmBuilderCard utm={utm} />

      {/* Pixel / analytics inventory — presentation only, no backend endpoint yet */}
      <SectionCard title="بكسلات الإعلانات ومصادر التحليلات" className="mt-[14px]">
        <p className="mkt-synchint" style={{ marginTop: 0 }}>
          هذه القائمة عرض توضيحي — لا يوجد بعد مسار خادم لإدارة البكسلات وربطها.
        </p>
        <div className="mkt-pixgrid">
          {[...AD_PIXELS, ...ANALYTICS_SOURCES].map((item) => (
            <div key={item.name} className={cn("mkt-pixcard", !item.connected && "off")}>
              <div className="mkt-pixtop">
                <div className="mkt-pixname">
                  <i className={cn("mkt-pixdot", item.connected && "on")} />
                  {item.name}
                </div>
              </div>
              <div className="mkt-pixid">{item.id ? `ID: ${item.id}` : "حالة الربط غير متاحة من اللوحة بعد"}</div>
              {item.events?.length ? (
                <div className="mkt-pixev">
                  {item.events.map((event) => (
                    <span key={event}>{event}</span>
                  ))}
                </div>
              ) : null}
              {item.connected && item.lastEvent ? (
                <div className="mkt-pixlast">{item.lastEvent}</div>
              ) : null}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="الأحداث المتتبَّعة وقيمتها" className="mt-[14px]">
        <div className="tblwrap">
          <table className="mkt-tbl">
            <thead>
              <tr>
                <th>الحدث</th>
                <th>المعنى</th>
                <th>القيمة المُسنَدة</th>
                <th>المنصات</th>
              </tr>
            </thead>
            <tbody>
              {TRACKED_EVENTS.map((row) => (
                <tr key={row.event}>
                  <td className="mkt-kw" style={{ direction: "ltr", textAlign: "center" }}>
                    {row.event}
                  </td>
                  <td>{row.meaning}</td>
                  <td className={row.highlight ? "mk-pos" : ""}>{row.value}</td>
                  <td>{row.platforms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

function ManualSpendCard() {
  const importMutation = useImportAdSpend();
  const [row, setRow] = useState({
    spent_on: "",
    platform: "google",
    campaign_name: "",
    spend: "",
    impressions: "",
    clicks: "",
  });

  const set = (key) => (e) => setRow((prev) => ({ ...prev, [key]: e.target.value }));
  const valid = row.spent_on && row.platform && Number(row.spend) > 0;

  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    importMutation.mutate(
      [
        {
          spent_on: row.spent_on,
          platform: row.platform,
          campaign_id: row.campaign_name || "manual",
          campaign_name: row.campaign_name || "إدخال يدوي",
          spend: Number(row.spend),
          currency: "SAR",
          impressions: Number(row.impressions) || 0,
          clicks: Number(row.clicks) || 0,
        },
      ],
      {
        onSuccess: (data) => {
          toast.success(`تم استيراد ${data?.synced ?? 1} صف`);
          setRow((prev) => ({ ...prev, campaign_name: "", spend: "", impressions: "", clicks: "" }));
        },
        onError: (err) =>
          toast.error(err?.response?.data?.message || "تعذّر استيراد صرف الإعلانات"),
      }
    );
  };

  return (
    <SectionCard title="إدخال صرف إعلاني يدوي" className="mt-[14px]">
      <form
        onSubmit={submit}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 10,
          alignItems: "end",
        }}
      >
        <Field label="التاريخ">
          <input type="date" className="mk-mini" value={row.spent_on} onChange={set("spent_on")} required />
        </Field>
        <Field label="المنصة">
          <select className="mk-mini" dir="rtl" value={row.platform} onChange={set("platform")}>
            {Object.entries(PLATFORM_LABEL_AR).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="اسم الحملة">
          <input type="text" className="mk-mini" value={row.campaign_name} onChange={set("campaign_name")} />
        </Field>
        <Field label="الصرف (﷼)">
          <input type="number" min="0" step="0.01" className="mk-mini" value={row.spend} onChange={set("spend")} required />
        </Field>
        <Field label="ظهور">
          <input type="number" min="0" className="mk-mini" value={row.impressions} onChange={set("impressions")} />
        </Field>
        <Field label="نقرات">
          <input type="number" min="0" className="mk-mini" value={row.clicks} onChange={set("clicks")} />
        </Field>
        <button type="submit" className="xbtn" disabled={!valid || importMutation.isPending}>
          {importMutation.isPending ? "جارٍ الحفظ…" : "استيراد"}
        </button>
      </form>
    </SectionCard>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: "#4a5b54" }}>{label}</span>
      {children}
    </label>
  );
}

function UtmBuilderCard({ utm }) {
  // `edits` holds only fields the user has explicitly changed; everything else
  // falls back to `seed` derived from the template response (no setState-in-effect).
  const [edits, setEdits] = useState({});

  const seed = useMemo(() => {
    const base = { url: "", source: utm.sources[0]?.source || "", medium: "cpc", campaign: "", content: "", term: "" };
    if (!utm.example) return base;
    try {
      const u = new URL(utm.example);
      return {
        ...base,
        url: `${u.origin}${u.pathname}`,
        source: u.searchParams.get("utm_source") || base.source,
        medium: u.searchParams.get("utm_medium") || "cpc",
      };
    } catch {
      return base;
    }
  }, [utm.example, utm.sources]);

  const values = { ...seed, ...edits };

  const params = new URLSearchParams();
  if (values.source) params.set("utm_source", values.source);
  if (values.medium) params.set("utm_medium", values.medium);
  if (values.campaign) params.set("utm_campaign", values.campaign);
  if (values.term) params.set("utm_term", values.term);
  if (values.content) params.set("utm_content", values.content);
  const qs = params.toString();
  const tagged = values.url ? `${values.url}${qs ? `?${qs}` : ""}` : "";

  const set = (key) => (e) => {
    const { value } = e.target;
    setEdits((prev) => ({ ...prev, [key]: value }));
  };

  const copy = () => {
    if (tagged && navigator?.clipboard) navigator.clipboard.writeText(tagged).catch(() => {});
    toast.success("تم نسخ الرابط");
  };

  return (
    <SectionCard title="مولّد روابط UTM لوسم الحملات" className="mt-[14px]">
      <TrackingState
        isLoading={utm.isLoading}
        error={utm.error}
        isEmpty={false}
        onRetry={utm.refetch}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Field label="الرابط">
            <input type="text" className="mk-mini" dir="ltr" value={values.url} onChange={set("url")} placeholder="https://contractejar.com" />
          </Field>
          <Field label="المصدر (source)">
            <select className="mk-mini" dir="rtl" value={values.source} onChange={set("source")}>
              <option value="">—</option>
              {utm.sources.map((s) => (
                <option key={s.source} value={s.source}>
                  {s.label_ar ? `${s.source} — ${s.label_ar}` : s.source}
                </option>
              ))}
            </select>
          </Field>
          <Field label="الوسيط (medium)">
            <input type="text" className="mk-mini" dir="ltr" value={values.medium} onChange={set("medium")} />
          </Field>
          <Field label="الحملة (campaign)">
            <input type="text" className="mk-mini" dir="ltr" value={values.campaign} onChange={set("campaign")} />
          </Field>
          <Field label="المحتوى (content)">
            <input type="text" className="mk-mini" dir="ltr" value={values.content} onChange={set("content")} />
          </Field>
          <Field label="الكلمة (term)">
            <input type="text" className="mk-mini" dir="ltr" value={values.term} onChange={set("term")} />
          </Field>
        </div>

        {utm.template ? (
          <p className="mkt-synchint" dir="ltr" style={{ textAlign: "left" }}>
            القالب المعتمد: <code>{utm.template}</code>
          </p>
        ) : null}

        <button type="button" className="mk-mini" onClick={copy} style={{ marginBottom: 12 }} disabled={!tagged}>
          نسخ الرابط الموسوم
        </button>

        <div
          style={{
            border: "1px solid #e5eee9",
            borderRadius: 10,
            background: "#f7fbf9",
            padding: "10px 12px",
            fontSize: 12,
            fontWeight: 600,
            color: "#2c3a34",
            direction: "ltr",
            textAlign: "left",
            wordBreak: "break-all",
            minHeight: 20,
          }}
        >
          {tagged || "أدخل الرابط والمصدر لتوليد الرابط الموسوم"}
        </div>

        {utm.clickIds?.length ? (
          <p className="mkt-synchint" style={{ marginTop: 10 }} dir="ltr">
            معرّفات النقر المتتبَّعة تلقائيًا: {utm.clickIds.join(", ")}
          </p>
        ) : null}
      </TrackingState>
    </SectionCard>
  );
}
