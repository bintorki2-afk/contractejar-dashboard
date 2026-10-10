"use client"
import { useConfirm } from "@/components/shared/confirm-provider";
import React, { useMemo, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useMutation, useQuery } from '@tanstack/react-query'
import { axiosInstance } from '@/src/utils/axios'
import { Loader2, Plus, TrashIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import ConfirmDialog from "@/components/shared/confirm-dialog"
import ReturnRequestDialog from "./return-request-dialog"
import {
  getOrderContractStatusDisplay,
  getReturnRequestExistsMessage,
  hasReturnRequest,
  isReturnContractStatus,
  normalizeOrderForReturnRequest,
} from "@/components/analysis/returned/refund-contract-utils"
import { openDialogAfterMenuClose } from "@/src/lib/open-dialog-after-menu-close"
import { invalidateOrdersCaches, invalidateContractStatusCaches } from "@/src/lib/invalidate-orders-caches"
import {
  CONTRACT_STATUSES_ACTIVE_API,
  CONTRACT_STATUSES_ACTIVE_QUERY_KEY,
  CONTRACT_STATUSES_API,
  buildContractStatusWritePayload,
  extractContractStatusItems,
} from "@/src/lib/contract-statuses"
import ChangeOrderStatusFieldsDialog, {
  getStatusCaseFields,
  statusRequiresExtraFields,
} from "@/components/realtime-orders/change-order-status-fields-dialog"
import { postOrderStatus } from "@/src/lib/order-status-api"
import { manualStatusOptions } from "@/src/lib/order-status-keys"
import { usePermissions } from "@/src/hooks/use-permissions"
import { PERMISSION_SECTIONS } from "@/src/lib/permissions"

export default function ChangeStatusDialog({ orderId, order, queryKey }) {
  // الحذف النهائي: نفس شرط الخادم (all_requests.delete أو مدير النظام).
  const { isAdmin, can } = usePermissions()
  const confirm = useConfirm()
  const canDeleteOrder = isAdmin || can(PERMISSION_SECTIONS.all_requests, "delete")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [statusFieldsOpen, setStatusFieldsOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color_text: '#000000',
    color: '#000000'
  });
  const queryClient = useQueryClient()
  const returnOrder = normalizeOrderForReturnRequest(order, orderId)
  const currentStatus = getOrderContractStatusDisplay(order ?? returnOrder)

  function getStatus() {
    return axiosInstance(CONTRACT_STATUSES_ACTIVE_API)
  }
  const { data: statusData } = useQuery({
    queryKey: [CONTRACT_STATUSES_ACTIVE_QUERY_KEY],
    queryFn: getStatus
  })

  const statusItems = useMemo(() => {
    // D1/D2: بلا المفاتيح التاريخية، و«مسترجع» معطّل مع تلميح.
    const items = manualStatusOptions(extractContractStatusItems(statusData))
    const currentId = currentStatus?.id

    if (currentId == null || currentId === "") return items

    return items.filter(
      (item) => String(item?.id) !== String(currentId)
    )
  }, [statusData, currentStatus?.id])

  function addStatus() {
    return axiosInstance.post(
      CONTRACT_STATUSES_API,
      buildContractStatusWritePayload(newCategory)
    )
  }
  const { mutate: addStatusMutate, isPending: addStatusPending } = useMutation({
    mutationFn: addStatus,
    onSuccess: (res) => {
      setIsAddModalOpen(false);
      setNewCategory({ name: '', description: '', color_text: '#000000', color: '#000000' });
      invalidateContractStatusCaches(queryClient);
      changeStatusMutate({ statusId: res?.data?.data?.id })
    },
    onError: (error) => {
      toast.error(error.response.data.message);
    }
  })

  function changeStatus({ statusId, extraValues, fields }) {
    return postOrderStatus(orderId, { statusId, extraValues, fields })
  }
  const { mutate: changeStatusMutate, isPending: changeStatusPending } = useMutation({
    mutationFn: changeStatus,
    onSuccess: (res) => {
      setStatusFieldsOpen(false)
      setPendingStatus(null)
      toast.success(res?.data?.message || "تم تغيير حالة الطلب")
      invalidateOrdersCaches(queryClient, { queryKey, orderId })
    },
    onError: (res) => {
      toast.error(res?.response?.data?.message || "حدث خطأ أثناء تغيير حالة الطلب")
    }
  })

  const { mutate: deleteOrder, isPending: isDeleting } = useMutation({
    mutationFn: () => axiosInstance.post(`/admin/orders/${orderId}/delete`),
    onSuccess: (res) => {
      toast.success(res?.data?.data?.message || "نُقل الطلب إلى السلة — يمكن استعادته خلال 30 يوماً")
      invalidateOrdersCaches(queryClient, { queryKey, orderId })
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "حدث خطأ أثناء حذف الطلب")
    },
  })

  const openReturnDialog = () => {
    openDialogAfterMenuClose(() => setReturnDialogOpen(true))
  }

  const handleStatusClick = (status) => {
    if (isReturnContractStatus(status)) {
      if (hasReturnRequest(returnOrder)) {
        toast.info(getReturnRequestExistsMessage(returnOrder))
        return
      }
      openReturnDialog()
      return
    }

    if (statusRequiresExtraFields(status)) {
      setPendingStatus(status)
      openDialogAfterMenuClose(() => setStatusFieldsOpen(true))
      return
    }

    // Confirm a plain status change before applying (guards against misclicks).
    openDialogAfterMenuClose(() => setConfirmStatus(status))
  }

  return (
    <>
    <DropdownMenu dir="rtl" modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="size-8 rounded-lg border border-surface-border-soft flex items-center justify-center bg-white text-status-neutral hover:text-brand-dark hover:border-brand-dark/30 transition-colors"
          aria-label="إجراءات الطلب"
        >
          <i className="fa-solid fa-ellipsis-vertical text-sm"></i>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-64 rounded-2xl shadow-lg border-surface-border p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel>تغيير حالة الطلب</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-neutral-100 my-1" />

        {statusItems.map((item) => (
          <div key={item?.id}>
            <DropdownMenuItem
              onSelect={() => {
                if (item?.manualDisabled) return
                handleStatusClick(item)
              }}
              disabled={changeStatusPending || item?.manualDisabled}
              title={item?.manualHint}
              className="cursor-pointer hover:bg-surface-input rounded-lg p-2"
            >
              <span className="font-medium text-13">
                {item?.name}
                {item?.manualDisabled ? (
                  <span className="block text-10 font-normal leading-4 text-ink-placeholder">{item.manualHint}</span>
                ) : null}
              </span>
              {changeStatusPending ? (
                <Loader2 className="animate-spin mr-auto size-4" />
              ) : (
                <i className="fa-solid fa-chevron-left mr-auto text-ink-placeholder text-10"></i>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-neutral-100 my-1" />
          </div>
        ))}

        <DropdownMenuItem
          onSelect={() => {
            openDialogAfterMenuClose(() => setIsAddModalOpen(true))
          }}
          className="cursor-pointer hover:bg-surface-input rounded-lg p-2"
        >
          <Plus className="size-4" />
          <span className="font-medium text-13">أخـرى</span>
          <i className="fa-solid fa-chevron-left mr-auto text-ink-placeholder text-10"></i>
        </DropdownMenuItem>

        {canDeleteOrder ? (
        <>
        <DropdownMenuSeparator className="bg-neutral-100 my-1" />

        <DropdownMenuItem
          className="cursor-pointer hover:bg-[#FFF5F5] text-red-600 rounded-lg p-2"
          disabled={isDeleting}
          onSelect={(e) => {
            e.stopPropagation?.()
            setTimeout(async () => {
              const ok = await confirm({
                title: "نقل الطلب إلى السلة",
                description: "سيُنقل الطلب إلى السلة ويمكن استعادته خلال 30 يوماً.",
                confirmLabel: "نقل إلى السلة",
                destructive: true,
              })
              if (ok) deleteOrder()
            }, 10)
          }}
        >
          <TrashIcon className='text-red-600 size-4' />
          <span className="font-medium text-13 text-red-600">حذف الطلـب</span>
          {isDeleting ? (
            <Loader2 className="animate-spin mr-auto size-4" />
          ) : (
            <i className="fa-solid fa-chevron-left mr-auto text-red-300 text-10"></i>
          )}
        </DropdownMenuItem>
        </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>

      <ConfirmDialog
        open={Boolean(confirmStatus)}
        onOpenChange={(next) => {
          if (!next) setConfirmStatus(null)
        }}
        title="تغيير حالة الطلب"
        description={
          confirmStatus
            ? `هل تريد تغيير حالة الطلب إلى «${confirmStatus?.name}»؟`
            : ""
        }
        confirmLabel="تغيير الحالة"
        isPending={changeStatusPending}
        onConfirm={() => {
          const status = confirmStatus
          setConfirmStatus(null)
          if (status) changeStatusMutate({ statusId: status.id })
        }}
      />

      <ReturnRequestDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        order={returnOrder}
        orderId={orderId}
        queryKey={queryKey}
      />
      
      <ChangeOrderStatusFieldsDialog
        open={statusFieldsOpen}
        onOpenChange={(next) => {
          setStatusFieldsOpen(next)
          if (!next) setPendingStatus(null)
        }}
        status={pendingStatus}
        isPending={changeStatusPending}
        onSubmit={(extraValues) => {
          if (!pendingStatus) return
          changeStatusMutate({
            statusId: pendingStatus.id,
            extraValues,
            fields: getStatusCaseFields(pendingStatus),
          })
        }}
      />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-8 rounded-[18px] border-0" dir="rtl">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-lg font-black text-[#22302C] border-b border-[#EEF1EF] pb-4">إضافة حالة العقد</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <label className="text-13 font-bold text-black px-1">
                اسم الحالة <span className="text-status-danger mr-1">*</span>
              </label>
              <input
                type="text"
                placeholder="ادخل اسم الحالة هنــا ..."
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                className="w-full h-13.5 bg-surface-input border border-surface-border rounded-2xl px-5 text-15 focus:outline-none focus:border-brand-main focus:bg-white transition-all font-medium text-right"
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-13 font-bold text-black px-1">
                وصف الحالة
              </label>
              <textarea
                placeholder="ادخل وصف الحالة هنا ..."
                value={newCategory.description}
                onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full min-h-[96px] bg-surface-input border border-surface-border rounded-2xl px-5 py-3 text-15 focus:outline-none focus:border-brand-main focus:bg-white transition-all font-medium text-right resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <label className="text-13 font-bold text-black px-1">
                  لون النص <span className="text-status-danger mr-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newCategory.color_text}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color_text: e.target.value }))}
                    className="w-full h-13.5 bg-surface-input border border-surface-border rounded-2xl pr-5 pl-14 text-15 focus:outline-none focus:border-brand-main focus:bg-white transition-all font-bold text-right"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden ring-1 ring-surface-border">
                    <input
                      type="color"
                      value={newCategory.color_text}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color_text: e.target.value }))}
                      className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-13 font-bold text-black px-1">
                  لون الخلفية <span className="text-status-danger mr-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full h-13.5 bg-surface-input border border-surface-border rounded-2xl pr-5 pl-14 text-15 focus:outline-none focus:border-brand-main focus:bg-white transition-all font-bold text-right"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden ring-1 ring-surface-border">
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                      className="absolute inset-[-50%] w-[200%] h-[200%] cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => addStatusMutate()}
              disabled={addStatusPending}
              className="w-full h-13.5 bg-brand-main text-white rounded-2xl font-bold text-base hover:bg-brand-main/90 transition-all shadow-lg shadow-brand-main/25 mt-4"
            >
              {addStatusPending ? <Loader2 className="animate-spin mx-auto" /> : "إضـــافة الحالة"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
