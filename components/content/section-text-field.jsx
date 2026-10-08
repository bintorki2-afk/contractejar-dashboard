"use client";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const LABEL_CLASS = {
  md: "text-[14px] font-bold text-black dark:text-white",
  sm: "text-[13px] font-bold text-black dark:text-white",
};

const INPUT_CLASS = {
  md: "h-[52px] rounded-[16px] border-[#EEEEEE] bg-white px-4 dark:border-white/10 dark:bg-white/[0.04]",
  sm: "h-[48px] rounded-[14px] border-[#EEEEEE] bg-white px-4 dark:border-white/10 dark:bg-white/[0.04]",
};

const TEXTAREA_CLASS = {
  md: "min-h-[120px] rounded-[20px] border-[#EEEEEE] bg-white px-4 py-3 leading-7 resize-none dark:border-white/10 dark:bg-white/[0.04]",
  sm: "min-h-[96px] rounded-[16px] border-[#EEEEEE] bg-white px-4 py-3 text-sm leading-6 resize-none dark:border-white/10 dark:bg-white/[0.04]",
};

/**
 * A single text/textarea field wired to react-hook-form with the shared
 * content-admin styling. Pass `className` to override the control classes.
 */
export default function SectionTextField({
  control,
  name,
  label,
  placeholder,
  rules,
  description,
  multiline = false,
  size = "md",
  dir,
  className,
  readOnly = false,
}) {
  const controlClass =
    className || (multiline ? TEXTAREA_CLASS[size] : INPUT_CLASS[size]);
  const Control = multiline ? Textarea : Input;

  return (
    <FormField
      control={control}
      name={name}
      rules={rules}
      render={({ field }) => (
        <FormItem>
          {label ? (
            <FormLabel className={LABEL_CLASS[size]}>{label}</FormLabel>
          ) : null}
          <FormControl>
            <Control
              {...field}
              placeholder={placeholder}
              dir={dir}
              readOnly={readOnly}
              aria-readonly={readOnly || undefined}
              className={readOnly ? `${controlClass} cursor-not-allowed opacity-70` : controlClass}
            />
          </FormControl>
          {description ? (
            <FormDescription className="text-[#8A8A8A] dark:text-white/40">
              {description}
            </FormDescription>
          ) : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
