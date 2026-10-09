'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Code2,
  Eraser,
  Highlighter,
  ImageIcon,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { compressImageFile } from '@/src/lib/editor-image';

// يضغط الصورة (≤ ٣٠٠ ك.ب) ثم يدرجها؛ عند الفشل يظهر خطأ واضح بدل إدراج صورة ضخمة.
async function insertCompressedImage(editor, file, pos) {
  if (!editor || !file) return;
  const toastId = toast.loading('جارٍ تجهيز الصورة...');
  try {
    const src = await compressImageFile(file);
    const chain = editor.chain().focus();
    if (typeof pos === 'number') {
      chain.insertContentAt(pos, { type: 'image', attrs: { src } }).run();
    } else {
      chain.setImage({ src }).run();
    }
    toast.dismiss(toastId);
  } catch (error) {
    toast.error(error?.message || 'تعذّر إدراج الصورة', { id: toastId });
  }
}

const imageFilesOf = (fileList) =>
  Array.from(fileList || []).filter((file) => String(file.type || '').startsWith('image/'));

const FontSize = Extension.create({
  name: 'fontSize',

  addOptions() {
    return {
      types: ['textStyle'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) return {};
              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: size }).run(),

      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

const ToolbarButton = ({ onClick, isActive, disabled, title, children, compact }) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'inline-flex shrink-0 items-center justify-center rounded-md transition-colors',
      compact ? 'size-7' : 'size-8',
      isActive
        ? 'bg-[#0B5A3C] text-white dark:bg-emerald-500 dark:text-[#0B1411]'
        : 'text-[#4B5563] hover:bg-[#E8F5F1] hover:text-[#0B5A3C] dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-emerald-300',
      disabled && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-[#4B5563] dark:hover:text-white/65'
    )}
  >
    {children}
  </button>
);

const ToolbarDivider = ({ compact }) => (
  <div
    className={cn(
      'mx-0.5 w-px shrink-0 bg-[#E5E7EB] dark:bg-white/15',
      compact ? 'h-5' : 'h-6'
    )}
  />
);

const ToolbarSelect = ({ compact, className, ...props }) => (
  <select
    {...props}
    className={cn(
      'shrink-0 appearance-none rounded-md border border-[#E6EBE9] bg-white text-[#374151] outline-none transition-colors',
      'focus:border-[#0B5A3C] focus:ring-1 focus:ring-[#0B5A3C]/20',
      'dark:bg-[#0F1C16] dark:border-white/10 dark:text-white dark:[color-scheme:dark]',
      compact ? 'h-7 px-2 text-[11px]' : 'h-8 px-2.5 text-xs',
      className
    )}
  />
);

const ColorSwatch = ({ title, value, onChange, compact }) => (
  <label
    title={title}
    className={cn(
      'relative inline-flex shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-[#E6EBE9] bg-white dark:border-white/10 dark:bg-white/[0.04]',
      compact ? 'size-7' : 'size-8'
    )}
  >
    <span
      className="absolute inset-x-1 bottom-1 h-1.5 rounded-sm"
      style={{ backgroundColor: value }}
    />
    <input
      type="color"
      value={value}
      onChange={onChange}
      className="absolute inset-0 cursor-pointer opacity-0"
    />
  </label>
);

function Toolbar({ editor, compact = false }) {
  const [color, setColor] = useState('#111827');
  const [highlightColor, setHighlightColor] = useState('#fef08a');
  const iconSize = compact ? 14 : 15;

  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      insertCompressedImage(editor, file);
    };

    input.click();
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('أدخل الرابط:', previousUrl || 'https://');

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const btn = { compact };
  const headingValue = editor.isActive('heading', { level: 1 })
    ? '1'
    : editor.isActive('heading', { level: 2 })
      ? '2'
      : editor.isActive('heading', { level: 3 })
        ? '3'
        : editor.isActive('heading', { level: 4 })
          ? '4'
          : editor.isActive('heading', { level: 5 })
            ? '5'
            : editor.isActive('heading', { level: 6 })
              ? '6'
              : 'paragraph';

  return (
    <div
      className={cn(
        'flex w-full min-w-0 max-w-full flex-wrap items-center border-b border-[#EEF1F0] bg-[#F8FAF9] dark:border-white/10 dark:bg-white/[0.03]',
        compact ? 'gap-0.5 px-1.5 py-1.5' : 'gap-1 p-2'
      )}
      dir="rtl"
    >
      <ToolbarButton
        {...btn}
        title="تراجع"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        {...btn}
        title="إعادة"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo2 size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider compact={compact} />

      <ToolbarSelect
        compact={compact}
        className={compact ? 'w-[4.75rem] max-w-[30%]' : 'min-w-[104px]'}
        value={
          compact && ['4', '5', '6'].includes(headingValue) ? '3' : headingValue
        }
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'paragraph') {
            editor.chain().focus().setParagraph().run();
          } else {
            editor.chain().focus().toggleHeading({ level: Number(value) }).run();
          }
        }}
      >
        <option value="paragraph">فقرة</option>
        <option value="1">عنوان 1</option>
        <option value="2">عنوان 2</option>
        <option value="3">عنوان 3</option>
        {!compact && (
          <>
            <option value="4">عنوان 4</option>
            <option value="5">عنوان 5</option>
            <option value="6">عنوان 6</option>
          </>
        )}
      </ToolbarSelect>

      <ToolbarSelect
        compact={compact}
        className={compact ? 'w-[3.5rem] max-w-[22%]' : 'min-w-[88px]'}
        defaultValue="default"
        onChange={(e) => {
          const size = e.target.value;
          if (size === 'default') {
            editor.chain().focus().unsetFontSize().run();
          } else {
            editor.chain().focus().setFontSize(size).run();
          }
        }}
      >
        <option value="default">الحجم</option>
        <option value="12px">12</option>
        <option value="14px">14</option>
        <option value="16px">16</option>
        <option value="18px">18</option>
        <option value="20px">20</option>
        <option value="24px">24</option>
        {!compact && (
          <>
            <option value="28px">28</option>
            <option value="32px">32</option>
          </>
        )}
      </ToolbarSelect>

      <ToolbarDivider compact={compact} />

      <ToolbarButton
        {...btn}
        title="عريض"
        isActive={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        {...btn}
        title="مائل"
        isActive={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        {...btn}
        title="تحته خط"
        isActive={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        {...btn}
        title="يتوسطه خط"
        isActive={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={iconSize} />
      </ToolbarButton>
      {!compact && (
        <ToolbarButton
          {...btn}
          title="كود"
          isActive={editor.isActive('code')}
          onClick={() => editor.chain().focus().toggleCode().run()}
        >
          <Code size={iconSize} />
        </ToolbarButton>
      )}

      <ToolbarDivider compact={compact} />

      <ToolbarButton
        {...btn}
        title="محاذاة لليمين"
        isActive={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        {...btn}
        title="محاذاة للوسط"
        isActive={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        {...btn}
        title="محاذاة لليسار"
        isActive={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft size={iconSize} />
      </ToolbarButton>
      {!compact && (
        <ToolbarButton
          {...btn}
          title="ضبط"
          isActive={editor.isActive({ textAlign: 'justify' })}
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        >
          <AlignJustify size={iconSize} />
        </ToolbarButton>
      )}

      <ToolbarDivider compact={compact} />

      <ToolbarButton
        {...btn}
        title="قائمة نقطية"
        isActive={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        {...btn}
        title="قائمة مرقمة"
        isActive={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered size={iconSize} />
      </ToolbarButton>
      {!compact && (
        <>
          <ToolbarButton
            {...btn}
            title="اقتباس"
            isActive={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            {...btn}
            title="كتلة كود"
            isActive={editor.isActive('codeBlock')}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 size={iconSize} />
          </ToolbarButton>
          <ToolbarButton
            {...btn}
            title="خط فاصل"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={iconSize} />
          </ToolbarButton>
        </>
      )}

      <ToolbarDivider compact={compact} />

      <ToolbarButton
        {...btn}
        title="رابط"
        isActive={editor.isActive('link')}
        onClick={setLink}
      >
        <Link2 size={iconSize} />
      </ToolbarButton>
      <ToolbarButton
        {...btn}
        title="إزالة الرابط"
        disabled={!editor.isActive('link')}
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Link2Off size={iconSize} />
      </ToolbarButton>
      <ToolbarButton {...btn} title="صورة" onClick={addImage}>
        <ImageIcon size={iconSize} />
      </ToolbarButton>

      <ToolbarDivider compact={compact} />

      <ToolbarButton
        {...btn}
        title="تمييز"
        isActive={editor.isActive('highlight')}
        onClick={() =>
          editor.chain().focus().toggleHighlight({ color: highlightColor }).run()
        }
      >
        <Highlighter size={iconSize} />
      </ToolbarButton>
      <ColorSwatch
        compact={compact}
        title="لون التمييز"
        value={highlightColor}
        onChange={(e) => {
          setHighlightColor(e.target.value);
          if (editor.isActive('highlight')) {
            editor.chain().focus().toggleHighlight({ color: e.target.value }).run();
          }
        }}
      />
      <ColorSwatch
        compact={compact}
        title="لون النص"
        value={color}
        onChange={(e) => {
          setColor(e.target.value);
          editor.chain().focus().setColor(e.target.value).run();
        }}
      />
      <ToolbarButton
        {...btn}
        title="إزالة التنسيق"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
      >
        <Eraser size={iconSize} />
      </ToolbarButton>
    </div>
  );
}

export default function TextEditor({
  initialContent = '',
  onChange,
  dir = 'rtl',
  placeholder = 'اكتب هنا...',
  compact = false,
  className = '',
}) {
  const editorRef = useRef(null);
  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontSize,
      // allowBase64: المقالات القديمة فيها صور base64 — بدونه تُحذف عند فتحها وتضيع عند الحفظ.
      Image.configure({ allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-brand-main underline',
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],

    content: initialContent,

    editorProps: {
      attributes: {
        dir,
        class: compact
          ? 'min-h-[160px] p-3 outline-none prose prose-sm max-w-none'
          : 'min-h-[300px] p-4 outline-none prose prose-sm max-w-none',
      },
      // لصق/سحب ملف صورة: يُضغط قبل الإدراج بدل حفظه بحجمه الأصلي.
      handlePaste: (view, event) => {
        const files = imageFilesOf(event.clipboardData?.files);
        if (!files.length) return false;
        event.preventDefault();
        files.forEach((file) => insertCompressedImage(editorRef.current, file));
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = imageFilesOf(event.dataTransfer?.files);
        if (!files.length) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        files.forEach((file) => insertCompressedImage(editorRef.current, file, pos));
        return true;
      },
    },

    onUpdate: ({ editor: currentEditor }) => {
      onChange?.({
        html: currentEditor.getHTML(),
        text: currentEditor.getText(),
      });
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        'w-full min-w-0 max-w-full overflow-hidden bg-white dark:bg-[#0F1C16]',
        compact ? 'rounded-none border-0' : 'rounded-lg border',
        className
      )}
    >
      <Toolbar editor={editor} compact={compact} />
      <div className="min-w-0 max-w-full overflow-x-auto">
        <EditorContent editor={editor} />
      </div>
      <div
        className={cn(
          'border-t border-[#EEF1F0] text-left text-[11px] text-[#9CA3AF] dark:border-white/10 dark:text-white/40',
          compact ? 'px-3 py-1.5' : 'px-4 py-2'
        )}
        dir="ltr"
      >
        {editor.storage.characterCount.characters()} characters
      </div>
    </div>
  );
}
