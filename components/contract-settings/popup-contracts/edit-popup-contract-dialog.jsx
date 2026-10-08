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
import { Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import {
  getAvailablePopupInstrumentTypeOptions,
  getPopupInstrumentTypeLabel,
  POPUP_CONTRACTS_API,
  POPUP_CONTRACTS_QUERY_KEY,
  hasPopupContent,
} from "@/src/lib/popup-contracts";
import PopupContractFormFields from "./popup-contract-form-fields";

function mapItemToForm(item) {
  return {
    instrumentType: item?.instrument_type || "",
    popupStatusContract: Boolean(item?.popup_status_contract),
    popupStatusRealestate: Boolean(item?.popup_status_realestate),
    contentPopup: item?.content_popup || "",
    buttonText: item?.button_text || "",
    buttonLink: item?.button_link || "",
  };
}

const NO_USED_INSTRUMENT_TYPES = [];

export default function EditPopupContractDialog({
  item,
  usedInstrumentTypes = NO_USED_INSTRUMENT_TYPES,
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(() => mapItemToForm(item));
  const [contentEditorKey, setContentEditorKey] = useState(0);
  const [prevOpen, setPrevOpen] = useState(false);
  const queryClient = useQueryClient();
  const itemInstrumentType = item?.instrument_type;

  const instrumentOptions = useMemo(() => {
    const availableOptions = getAvailablePopupInstrumentTypeOptions({
      usedTypes: usedInstrumentTypes,
      includeType: itemInstrumentType,
    });

    if (availableOptions.length > 0) {
      return availableOptions;
    }

    if (!itemInstrumentType) return [];

    return [
      {
        value: itemInstrumentType,
        label: getPopupInstrumentTypeLabel(itemInstrumentType),
      },
    ];
  }, [itemInstrumentType, usedInstrumentTypes]);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(mapItemToForm(item));
      setContentEditorKey((current) => current + 1);
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      axiosInstance.post(`${POPUP_CONTRACTS_API}/${item?.id}`, {
        instrument_type: form.instrumentType,
        popup_status_contract: form.popupStatusContract,
        popup_status_realestate: form.popupStatusRealestate,
        content_popup: form.contentPopup,
        button_text: form.buttonText.trim(),
        button_link: form.buttonLink.trim(),
      }),
    onSuccess: (res) => {
      toast.success(res?.data?.message || "تم تعديل المحتوى الإرشادي بنجاح");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [POPUP_CONTRACTS_QUERY_KEY] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء تعديل المحتوى");
    },
  });

  const handleSubmit = () => {
    if (!form.instrumentType || !hasPopupContent(form.contentPopup)) {
      toast.error("يرجى تعبئة نوع الوثيقة ومحتوى البوب أب");
      return;
    }
    mutate();
  };

  return (
    <Dialog dir="rtl" open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-9 rounded-full border-0 bg-[#E6FFE6] text-brand-accent hover:bg-brand-accent hover:text-white"
          title="تعديل"
        >
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent
        closeButton={false}
        className="max-w-lg max-h-[90vh] gap-0 overflow-x-hidden overflow-y-auto rounded-2xl border-[#E6EBE9] p-0 shadow-[0_12px_40px_rgba(11,83,69,0.12)] sm:max-w-lg"
      >
        <DialogHeader className="space-y-0 border-b border-[#EEF1F0] px-5 py-4 text-right">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="text-base font-black text-[#111827]">
              تعديل المحتوى الإرشادي
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
            instrumentOptions={instrumentOptions}
            instrumentTypeDisabled
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
            disabled={isPending}
            onClick={handleSubmit}
            className="h-10 min-w-[96px] rounded-xl bg-[#0B5A3C] px-5 text-[13px] font-bold text-white hover:bg-[#043F38]"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "حفظ"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
