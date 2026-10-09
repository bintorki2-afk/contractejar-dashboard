"use client";

import { useUnwrapPageProps } from "@/src/hooks/use-unwrap-page-props";
import { useMemo, useState } from "react";
import Header from "@/components/home/header";
import PopupContractsTab from "@/components/contract-settings/popup-contracts/popup-contracts-tab";
import PaymentMessagesTab from "@/components/contract-settings/payment-messages/payment-messages-tab";
import InstrumentTypesTab from "@/components/contract-settings/instrument-types/instrument-types-tab";
import SmsSettingsTab from "@/components/contract-settings/sms-settings/sms-settings-tab";
import MeterFeeSettingsTab from "@/components/contract-settings/meter-fees/meter-fee-settings-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Gauge, MessageSquareText, ScrollText, Settings2 } from "lucide-react";
import { usePermissions } from "@/src/hooks/use-permissions";
import { PERMISSION_SECTIONS } from "@/src/lib/permissions";

const CONTRACT_SETTINGS_TABS = [
  {
    value: "popup-contracts",
    label: "محتوى إرشادي للعقود",
    icon: FileText,
    section: PERMISSION_SECTIONS.popup_contracts,
  },
  {
    value: "instrument-types",
    label: "إعدادات أنواع الصكوك",
    icon: ScrollText,
    section: PERMISSION_SECTIONS.instrument_settings,
  },
  {
    value: "sms-settings",
    label: "إعدادات رسائل SMS",
    icon: MessageSquareText,
    section: PERMISSION_SECTIONS.sms,
  },
  {
    value: "meter-fees",
    label: "رسوم العدادات",
    icon: Gauge,
    // No dedicated catalog key yet — stays behind the umbrella settings.view gate.
    section: null,
  },
  {
    value: "payment-messages",
    label: "إعدادات رسايل الدفع",
    icon: Settings2,
    section: PERMISSION_SECTIONS.payment_messages,
  },
];

export default function ContractSettingsPage(props) {
  useUnwrapPageProps(props?.params, props?.searchParams);
  const { can, isReady } = usePermissions();

  const visibleTabs = useMemo(
    () =>
      CONTRACT_SETTINGS_TABS.filter(
        (tab) => isReady && can(tab.section ?? PERMISSION_SECTIONS.settings, "view")
      ),
    [can, isReady]
  );

  const [activeTab, setActiveTab] = useState(CONTRACT_SETTINGS_TABS[0].value);
  const currentTab = visibleTabs.some((tab) => tab.value === activeTab)
    ? activeTab
    : visibleTabs[0]?.value;

  return (
    <div className="flex min-h-screen flex-col gap-6" dir="rtl">
      <Header
        page="welcome"
        title="إعدادات العقود"
        isMain={false}
        first="الرئيــسية"
        firstURL="/home"
        second="إعدادات العقود"
        secondURL="/home/contract-settings"
      />

      <Tabs dir="rtl" value={currentTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 h-auto flex-wrap justify-start gap-3 bg-transparent p-0">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-12 rounded-full bg-[#F3F3F3] px-5 text-sm font-bold text-[#616161] transition-all data-[state=active]:bg-brand-hover data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                <Icon className="ml-2 h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value="popup-contracts" className="mt-0">
          <PopupContractsTab />
        </TabsContent>

        <TabsContent value="instrument-types" className="mt-0">
          <InstrumentTypesTab />
        </TabsContent>

        <TabsContent value="sms-settings" className="mt-0">
          <SmsSettingsTab />
        </TabsContent>

        <TabsContent value="meter-fees" className="mt-0">
          <MeterFeeSettingsTab />
        </TabsContent>

        <TabsContent value="payment-messages" className="mt-0">
          <PaymentMessagesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
