'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import logo from '@/public/images/logo.svg';
import waving from '@/public/images/waving.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from '@/components/ui/form';
import Image from 'next/image';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { axiosInstance, AUTH_ENDPOINTS } from '@/src/utils/axios';
import { useUserStore } from '@/src/stores/user-store';
import { useRouter } from 'next/navigation';
import { setAuthCookie } from '@/src/app/actions/auth';
import { toast } from 'sonner';
import { useIsDark, useToggleTheme } from '@/src/hooks/use-theme-mode';

export default function LoginPage() {
  const { setAuth } = useUserStore();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const isDark = useIsDark();
  const { toggleTheme } = useToggleTheme();

  const FormSchema = z.object({
    email: z.string().email('يرجى إدخال بريد إلكتروني صحيح.'),
    password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل.'),
    remember: z.boolean().optional(),
  });
  
  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });
  

  const {mutate ,isPending}=useMutation({
    mutationFn:async(data)=>{
      const payload = {
        email: data.email,
        password: data.password,
        remember_me: !!data.remember,
      };

      const res = await axiosInstance.post(AUTH_ENDPOINTS.login, payload)
      return res.data
    },
    // Only auto-retry genuine connection failures (no response received) -
    // wrong credentials (4xx with a response) should surface immediately, not retry.
    retry: (failureCount, error) => !error?.response && failureCount < 2,
    retryDelay: (attemptIndex) => (attemptIndex === 0 ? 800 : 1500),
    onSuccess: async (response, variables) => {
      if (response?.success && response?.data?.token) {
        try {
          toast.success(response?.message || "تم تسجيل الدخول بنجاح");
          // Permissions are resolved reactively by usePermissions() once on /home
          // (it fetches the role by role_id if the login payload didn't include them),
          // so we don't block the redirect on an extra round-trip here.
          // Prefer nested `data.user` when present so tokens aren't stored as the user shape.
          const payload = response.data;
          const authUser = payload?.user && typeof payload.user === 'object' ? payload.user : payload;
          setAuth(authUser, payload?.token, variables.remember, payload?.refresh_token ?? null);
          await setAuthCookie(payload?.token, variables.remember);
          router.push('/home');
        } catch (error) {
          console.error('Login post-processing error:', error);
          toast.error('حدث خطأ أثناء إكمال تسجيل الدخول');
        }
        return;
      }

      toast.error(response?.message || 'بيانات الدخول غير صحيحة');
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        (error?.message === 'Network Error'
          ? 'تعذر الاتصال بالخادم، تحقق من اتصالك بالإنترنت'
          : 'حدث خطأ أثناء تسجيل الدخول');
      toast.error(message);
      console.error('Login error:', error);
    }
  })
  const onSubmit = (formdata) => {
    mutate(formdata);
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F4F6F5] p-4 dark:bg-[#0B1411]"
      dir="rtl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 size-[420px] rounded-full bg-brand-main/10 blur-3xl dark:bg-brand-accent/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-20 size-[380px] rounded-full bg-brand-main/8 blur-3xl dark:bg-brand-accent/5"
      />

      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
        className="absolute left-4 top-4 z-20 flex size-11 items-center justify-center rounded-full border border-surface-border-soft bg-white text-brand-main shadow-[0_2px_12px_rgba(11,83,69,0.08)] transition-colors hover:bg-[#E8F5F1] dark:border-white/10 dark:bg-card dark:text-brand-accent dark:hover:bg-[#1A2E24] sm:left-6 sm:top-6"
      >
        {isDark ? (
          <Sun className="size-5 text-amber-300" strokeWidth={1.75} />
        ) : (
          <Moon className="size-5" strokeWidth={1.75} />
        )}
      </button>

      <div className="relative z-10 w-full max-w-[580px] rounded-[40px] border border-surface-border-soft bg-card p-[50px_60px] shadow-[0_4px_24px_rgba(11,83,69,0.08)] dark:border-white/10 dark:bg-card dark:shadow-[0_8px_32px_rgba(0,0,0,0.35)] max-[768px]:p-8 max-[480px]:rounded-3xl max-[480px]:p-6">
        <div className="mb-10 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
            <Image
              src={logo}
              alt="عقدي"
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
              priority
            />
          </Link>
          <Image src={waving} alt="" width={40} height={40} className="mb-4 h-auto w-10 object-contain" aria-hidden />
          <p className="text-lg text-foreground/80 dark:text-white/70">لوحة تحكم الموظفين.</p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
            <FormField name="email" control={form.control} render={({ field }) => (
              <FormItem>
                <div className="flex flex-col gap-2.5">
                  <FormLabel className="flex items-center gap-1 text-sm text-foreground">
                    البريـــد الإلكتـــرونـــي <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                        type="email" 
                        className="h-13.5 rounded-2xl border-border bg-surface-input px-5 text-right text-sm text-foreground placeholder:text-ink-placeholder focus-visible:border-brand-main focus-visible:ring-1 focus-visible:ring-brand-main dark:border-white/10 dark:bg-[#0F1C16] dark:placeholder:text-white/35" 
                        placeholder="... أدخل بريدك الإلكتروني هنا" 
                        {...field} 
                    />
                  </FormControl>
                </div>
                <FormMessage className="mt-1 text-xs text-destructive" />
              </FormItem>
            )} />
            
            <FormField name="password" control={form.control} render={({ field }) => (
              <FormItem>
                <div className="flex flex-col gap-2.5">
                  <FormLabel className="flex items-center gap-1 text-sm text-foreground">
                    كلمة المرور <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input 
                          type={showPassword ? 'text' : 'password'}
                          className="h-13.5 rounded-2xl border-border bg-surface-input px-5 pl-12 text-right text-sm text-foreground placeholder:text-ink-placeholder focus-visible:border-brand-main focus-visible:ring-1 focus-visible:ring-brand-main dark:border-white/10 dark:bg-[#0F1C16] dark:placeholder:text-white/35" 
                          placeholder="... أدخل كلمة المرور هنا"  
                          {...field} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-placeholder transition-colors hover:text-foreground dark:text-white/40 dark:hover:text-white/80"
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      >
                        {showPassword ? (
                          <EyeOff className="size-5" strokeWidth={1.5} />
                        ) : (
                          <Eye className="size-5" strokeWidth={1.5} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                </div>
                <FormMessage className="mt-1 text-xs text-destructive" />
              </FormItem>
            )} />
            
            <FormField name="remember" control={form.control} render={({ field }) => (
              <FormItem>
                <FormControl>
                  <label className="group flex w-fit cursor-pointer items-center gap-2.5">
                    <div className="relative flex size-5 items-center justify-center">
                      <input
                        type="checkbox"
                        className="peer size-5 cursor-pointer appearance-none rounded border-2 border-[#D9D9D9] bg-white transition-all checked:border-brand-main checked:bg-brand-main dark:border-white/20 dark:bg-[#0F1C16] dark:checked:border-brand-accent dark:checked:bg-brand-accent"
                        checked={!!field.value}
                        onChange={field.onChange}
                      />
                      <i className="fa-solid fa-check pointer-events-none absolute text-10 text-white opacity-0 transition-opacity peer-checked:opacity-100" />
                    </div>
                    <span className="text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                      تذكرني
                    </span>
                  </label>
                </FormControl>
              </FormItem>
            )} />
            
            <div className="mt-2">
              <Button
                type="submit"
                className="flex h-[58px] w-full items-center justify-between !rounded-[20px] bg-brand-main px-6 text-base text-white shadow-none transition-all duration-300 hover:bg-brand-main/90 dark:bg-brand-accent dark:text-[#0B1411] dark:hover:bg-brand-accent-hover"
                disabled={isPending}
              >
                <span>{isPending ? 'جار التحقق ...' : 'تسجيل الدخول'}</span>
                {!isPending && (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white dark:bg-[#0B1411]">
                    <ArrowUpRight className="size-5 text-brand-main dark:text-brand-accent" strokeWidth={2.5} />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
