"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SETTINGS_EDIT_TRIGGER_CLASS, SettingsAddTrigger } from "@/components/system-settings/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/src/utils/axios";
import { ChevronLeft, Loader2, MessageSquareText, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-11 rounded-xl border-[#E6EBE9] bg-white text-[13px] font-semibold focus:ring-0 focus:border-[#0B5A3C] data-[placeholder]:text-[#9CA3AF]";

export default function AddNewMessageForPropertyDialog({ isEdit, messageAlert }) {
  const [open, setOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [message, setMessage] = useState("");

  const queryClient = useQueryClient();

  const [prevOpen, setPrevOpen] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedSection(messageAlert?.message_alert_section_id?.toString() || "");
      setSelectedItem(messageAlert?.message_alert_section_item_id?.toString() || "");
      setMessage(messageAlert?.message || "");
    }
  }

  const { data: sectionsData, isLoading: sectionsLoading } = useQuery({
    queryKey: ["message-alert-sections-property"],
    queryFn: () =>
      axiosInstance.get("admin/message-alert-sections/property/options/list").then((res) => res.data),
    enabled: open,
  });
  const sections = sectionsData?.data?.items || sectionsData?.data || [];

  const { data: itemsData, isLoading: itemsLoading } = useQuery({
    queryKey: ["message-alert-section-items-property", selectedSection],
    queryFn: () =>
      axiosInstance
        .get(
          `/admin/message-alert-section-items?type=property&message_alert_section_id=${selectedSection}`
        )
        .then((res) => res.data),
    enabled: open && !!selectedSection,
  });

  const currentSectionObj = sections.find((s) => s.id?.toString() === selectedSection);
  const items = currentSectionObj?.items || itemsData?.data?.items || itemsData?.data || [];
  const currentItemObj = items.find((item) => item.id?.toString() === selectedItem);

  const sectionLabel = currentSectionObj?.name_ar || currentSectionObj?.name_en;
  const itemLabel = currentItemObj?.name_ar || currentItemObj?.name_en;

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (isEdit && messageAlert?.id) {
        return axiosInstance.post(`/admin/message-alerts/property/${messageAlert.id}`, payload);
      }
      return axiosInstance.post("/admin/message-alerts/property", payload);
    },
    onSuccess: (res) => {
      toast.success(
        res?.data?.message || (isEdit ? "تم تعديل الرسالة بنجاح" : "تم إضافة الرسالة بنجاح")
      );
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["message-alerts-property"] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "حدث خطأ ما");
    },
  });

  const handleSubmit = () => {
    if (!selectedSection || !selectedItem || !message.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    mutation.mutate({
      message_alert_section_id: Number(selectedSection),
      message_alert_section_item_id: Number(selectedItem),
      message: message.trim(),
    });
  };

  return (
    <Dialog dir="rtl" open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <button type="button" className={SETTINGS_EDIT_TRIGGER_CLASS}>
            تعديل
          </button>
        ) : (
          <SettingsAddTrigger>إضافة</SettingsAddTrigger>
        )}
      </DialogTrigger>

      <DialogContent
        closeButton={false}
        className="max-w-lg max-h-[90vh] gap-0 overflow-x-hidden overflow-y-auto rounded-2xl border-[#E6EBE9] p-0 shadow-[0_12px_40px_rgba(11,83,69,0.12)] sm:max-w-lg"
      >
        <DialogHeader className="space-y-0 border-b border-[#EEF1F0] px-5 py-4 text-right">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3 text-right">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F5F1] text-[#0B5A3C]">
                <MessageSquareText className="size-4" />
              </span>
              <div className="min-w-0">
                <DialogTitle className="text-base font-black text-[#111827]">
                  {isEdit ? "تعديل رسالة العقار" : "إضافة رسالة عقار"}
                </DialogTitle>
                <p className="mt-1 text-[12px] font-medium text-[#6B7280]">
                  اربط الرسالة بقسم وبند، ثم اكتب النص المتعلق بالعقار.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div dir="rtl" className="flex min-w-0 max-w-full flex-col gap-4 overflow-hidden px-5 py-4 text-right">
          {(sectionLabel || itemLabel) && (
            <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#DCEEE8] bg-[#F4FBF8] px-3 py-2.5 text-[12px] font-bold text-[#0B5A3C]">
              <span className={cn(!sectionLabel && "text-[#9CA3AF]")}>
                {sectionLabel || "القسم"}
              </span>
              <ChevronLeft className="size-3.5 shrink-0 text-[#8AADA3]" />
              <span className={cn(!itemLabel && "text-[#9CA3AF]")}>
                {itemLabel || "بند القسم"}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-[#111827]">
                القسم <span className="text-red-500">*</span>
              </span>
              <Select
                dir="rtl"
                value={selectedSection}
                onValueChange={(val) => {
                  setSelectedSection(val);
                  setSelectedItem("");
                }}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue
                    placeholder={sectionsLoading ? "جاري التحميل..." : "اختر القسم"}
                  />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {sections.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id?.toString()}>
                      {sec.name_ar || sec.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-bold text-[#111827]">
                بند القسم <span className="text-red-500">*</span>
              </span>
              <Select
                dir="rtl"
                value={selectedItem}
                onValueChange={setSelectedItem}
                disabled={!selectedSection}
              >
                <SelectTrigger className={cn(fieldClass, !selectedSection && "opacity-60")}>
                  <SelectValue
                    placeholder={
                      !selectedSection
                        ? "اختر القسم أولاً"
                        : itemsLoading
                          ? "جاري التحميل..."
                          : "اختر البند"
                    }
                  />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id?.toString()}>
                      {item.name_ar || item.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-bold text-[#111827]">
              نص الرسالة <span className="text-red-500">*</span>
            </span>
            <Textarea
              placeholder="اكتب الرسالة التوضيحية المتعلقة بالعقار..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="min-h-[120px] resize-none rounded-xl border-[#E6EBE9] bg-white text-[13px] font-medium leading-relaxed focus-visible:border-[#0B5A3C] focus-visible:ring-0"
            />
            <span className="text-[11px] font-semibold text-[#9CA3AF]">
              {message.trim().length} حرف
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#EEF1F0] px-5 py-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="h-10 rounded-xl border-[#0B5A3C]/30 px-4 text-[13px] font-bold text-[#0B5A3C] hover:bg-[#E8F5F1]"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            disabled={mutation.isPending}
            onClick={handleSubmit}
            className="h-10 min-w-[104px] rounded-xl bg-[#0B5A3C] px-5 text-[13px] font-bold text-white hover:bg-[#043F38]"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isEdit ? (
              "حفظ التعديل"
            ) : (
              "إضافة الرسالة"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
