import { useEditor, EditorContent } from '@tiptap/react';
import { mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Paragraph from '@tiptap/extension-paragraph';
import { useEffect } from 'react';
import {
    HiBold, HiItalic, HiUnderline, HiLink, HiPhoto,
    HiBars3, HiBars3CenterLeft, HiBars3BottomRight,
    HiNumberedList, HiListBullet, HiMinus, HiArrowPath,
    HiHashtag,
} from 'react-icons/hi2';

/**
 * Custom Paragraph extension that renders <div> instead of <p>.
 * This is important for email clients — many strip or mangle <p> tags.
 */
const DivParagraph = Paragraph.extend({
    name: 'paragraph',
    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-paragraph': '' }),
            0,
        ];
    },
    parseHTML() {
        return [
            { tag: 'div[data-paragraph]' },
        ];
    },
});

const ToolbarButton = ({ icon: Icon, onClick, isActive, title }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={`p-2 rounded transition-colors ${
            isActive
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
        }`}
    >
        <Icon className="h-4 w-4" />
    </button>
);

const Divider = () => <div className="w-px h-6 bg-gray-200 mx-1" />;

export default function WysiwygEditor({ value, onChange, placeholder = 'Start writing...' }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                paragraph: false, // disable default <p> paragraph
                link: false,     // we add Link separately with custom config
                underline: false, // we add Underline separately
            }),
            DivParagraph,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-indigo-600 underline' },
            }),
            Image.configure({
                inline: false,
                HTMLAttributes: { class: 'max-w-full rounded' },
            }),
            TextAlign.configure({
                types: ['paragraph'],
            }),
            Underline,
        ],
        content: value || '',
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none',
                'data-placeholder': placeholder,
            },
        },
    });

    // Sync external value changes (e.g. form resets)
    useEffect(() => {
        if (editor && value !== undefined && value !== editor.getHTML()) {
            editor.commands.setContent(value || '', false);
        }
    }, [value, editor]);

    if (!editor) {
        return (
            <div className="border border-gray-300 rounded-md min-h-[360px] flex items-center justify-center text-gray-400">
                Loading editor...
            </div>
        );
    }

    const setLink = () => {
        const url = window.prompt('Enter URL:');
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addImage = () => {
        const url = window.prompt('Image URL:');
        if (url) editor.chain().focus().setImage({ src: url }).run();
    };

    return (
        <div className="border border-gray-300 rounded-md overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
                <ToolbarButton
                    icon={HiBold}
                    title="Bold"
                    isActive={editor.isActive('bold')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                />
                <ToolbarButton
                    icon={HiItalic}
                    title="Italic"
                    isActive={editor.isActive('italic')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                />
                <ToolbarButton
                    icon={HiUnderline}
                    title="Underline"
                    isActive={editor.isActive('underline')}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                />
                <Divider />
                <ToolbarButton
                    icon={HiHashtag}
                    title="Heading"
                    isActive={editor.isActive('heading', { level: 2 })}
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                />
                <ToolbarButton
                    icon={HiListBullet}
                    title="Bullet List"
                    isActive={editor.isActive('bulletList')}
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                />
                <ToolbarButton
                    icon={HiNumberedList}
                    title="Numbered List"
                    isActive={editor.isActive('orderedList')}
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                />
                <Divider />
                <ToolbarButton
                    icon={HiBars3}
                    title="Align Left"
                    isActive={editor.isActive({ textAlign: 'left' })}
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                />
                <ToolbarButton
                    icon={HiBars3CenterLeft}
                    title="Align Center"
                    isActive={editor.isActive({ textAlign: 'center' })}
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                />
                <ToolbarButton
                    icon={HiBars3BottomRight}
                    title="Align Right"
                    isActive={editor.isActive({ textAlign: 'right' })}
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                />
                <Divider />
                <ToolbarButton
                    icon={HiLink}
                    title="Add Link"
                    isActive={editor.isActive('link')}
                    onClick={setLink}
                />
                <ToolbarButton
                    icon={HiPhoto}
                    title="Insert Image"
                    onClick={addImage}
                />
                <ToolbarButton
                    icon={HiMinus}
                    title="Horizontal Rule"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                />
                <ToolbarButton
                    icon={HiArrowPath}
                    title="Clear Formatting"
                    onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
                />
            </div>

            {/* Editor area */}
            <EditorContent editor={editor} />

            {/* HTML source preview toggle */}
            <div className="border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                Tip: Use the toolbar above to format your email. Content renders with {'<div>'} tags for maximum email client compatibility.
            </div>
        </div>
    );
}
