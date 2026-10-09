"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { axiosInstance } from "@/src/utils/axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  getAvailablePopupInstrumentTypeOptions,
  POPUP_CONTRACTS_API,
  POPUP_CONTRACTS_QUERY_KEY,
  hasPopupContent,
} from "@/src/lib/popup-contracts";
import PopupContractFormFields from "./popup-contract-form-fields";

const initialFormState = {
  instrumentType: "",
  popupStatusContract: true,
  popupStatusRealestate: false,
  contentPopup: "",
  buttonText: "",
  buttonLink: "",
};

export default function AddPopupContractDialog({ usedInstrumentTypes = [] }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [contentEditorKey, setContentEditorKey] = useState(0);
  const queryClient = useQueryClient();

  const availableInstrumentOptions = useMemo(
    () => getAvailablePopupInstrumentTypeOptions({ usedTypes: usedInstrumentTypes }),
    [usedInstrumentTypes]
  );

  const canAddMore = availableInstrumentOptions.length > 0;

  const resetForm = () => {
    setForm(initialFormState);
    setContentEditorKey((current) => current + 1);
  };

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      axiosInstance.post(POPUP_CONTRACTS_API, {
        instrument_type: form.instrumentType,
        popup_status_contract: form.popupStatusContract,
        popup_status_realestate: form.popupStatusRealestate,
        content_popup: form.contentPopup,
        button_text: form.buttonText.trim(),
        button_link: form.buttonLink.trim(),
      }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم إضافة المحتوى الإرشادي بنجاح");
      setOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: [POPUP_CONTRACTS_QUERY_KEY] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء إضافة المحتوى");
    },
  });

  const handleSubmit = () => {
    if (!canAddMore) {
      toast.error("تم إضافة محتوى لجميع أنواع الوثائق المتاحة");
      return;
    }

    if (!form.instrumentType || !hasPopupContent(form.contentPopup)) {
      toast.error("يرجى تعبئة نوع الوثيقة ومحتوى البوب أب");
      return;
    }

    if (usedInstrumentTypes.includes(form.instrumentType)) {
      toast.error("يوجد محتوى إرشادي لهذا النوع بالفعل");
      return;
    }

    mutate();
  };

  return (
    <Dialog
      dir="rtl"
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button
          disabled={!canAddMore}
          className="flex h-11 items-center gap-2 rounded-xl bg-[#0B5A3C] px-5 text-13 font-bold text-white shadow-sm transition-colors hover:bg-[#043F38] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="size-4" />
          <span>إضافة محتوى جديد</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        closeButton={false}
        className="max-w-lg max-h-[90vh] gap-0 overflow-x-hidden overflow-y-auto rounded-2xl border-[#E6EBE9] p-0 shadow-[0_12px_40px_rgba(11,83,69,0.12)] sm:max-w-lg"
      >
        <DialogHeader className="space-y-0 border-b border-[#EEF1F0] px-5 py-4 text-right">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-black text-[#111827]">
              إضافة محتوى إرشادي
            </DialogTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-neutral-500 hover:bg-neutral-100"
              aria-label="إغلاق"
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="min-w-0 max-w-full overflow-hidden px-5 py-4">
          <PopupContractFormFields
            instrumentOptions={availableInstrumentOptions}
            instrumentType={form.instrumentType}
            onInstrumentTypeChange={(value) =>
              setForm((current) => ({ ...current, instrumentType: value }))
            }
            popupStatusContract={form.popupStatusContract}
            onPopupStatusContractChange={(value) =>
              setForm((current) => ({ ...current, popupStatusContract: value }))
            }
            popupStatusRealestate={form.popupStatusRealestate}
            onPopupStatusRealestateChange={(value) =>
              setForm((current) => ({ ...current, popupStatusRealestate: value }))
            }
            contentPopup={form.contentPopup}
            contentEditorKey={contentEditorKey}
            onContentPopupChange={(value) =>
              setForm((current) => ({ ...current, contentPopup: value }))
            }
            buttonText={form.buttonText}
            onButtonTextChange={(value) =>
              setForm((current) => ({ ...current, buttonText: value }))
            }
            buttonLink={form.buttonLink}
            onButtonLinkChange={(value) =>
              setForm((current) => ({ ...current, buttonLink: value }))
            }
          />
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
            disabled={isPending || !canAddMore}
            onClick={handleSubmit}
            className="h-10 min-w-[96px] rounded-xl bg-[#0B5A3C] px-5 text-[13px] font-bold text-white hover:bg-[#043F38]"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "إضافة"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
