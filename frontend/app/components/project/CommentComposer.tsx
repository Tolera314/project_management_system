'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, AtSign, Smile, Paperclip } from 'lucide-react';

interface CommentComposerProps {
    onPost: (content: string) => Promise<void>;
    members: any[]; // Project/Workspace members for mentions
    placeholder?: string;
    onFileAttach?: (file: File) => void; // Optional file attach handler
}

export default function CommentComposer({ onPost, members, placeholder = "Write a comment...", onFileAttach }: CommentComposerProps) {
    const [content, setContent] = useState('');
    const [isMentionOpen, setIsMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [cursorPosition, setCursorPosition] = useState<{ top: number; left: number } | null>(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    const composerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Filter members for mentions
    const filteredMembers = members.filter(m => {
        const user = m.organizationMember?.user || m.user; // Handle different member structures
        if (!user) return false;
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(mentionQuery.toLowerCase());
    }).slice(0, 5); // Limit to 5 suggestions

    const handleInput = useCallback(() => {
        if (!composerRef.current) return;
        const text = composerRef.current.innerText; // Basic text for now, but valid HTML handles mentions
        setContent(text);

        // Detect @ cursor position
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);

        // Simple detection: check if last char before cursor is @
        // This is tricky in contentEditable. 
        // We will simplify: If check text content ends with @ or @something
        // For production, we need robust cursor tracking.

        // Let's rely on KeyUp for simpler logic for this MVP prompt
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (isMentionOpen) {
                insertMention(filteredMembers[mentionIndex]);
            } else {
                handleSubmit();
            }
        }

        if (isMentionOpen) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex(prev => (prev + 1) % filteredMembers.length);
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
            }
            if (e.key === 'Escape') {
                setIsMentionOpen(false);
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                insertMention(filteredMembers[mentionIndex]);
            }
        }
    };

    const handleKeyUp = () => {
        // basic @ detection
        const selection = window.getSelection();
        if (!selection || !selection.rangeCount) return;
        const range = selection.getRangeAt(0);
        const textToCaret = range.startContainer.textContent?.slice(0, range.startOffset) || '';

        // Match @word at end of string
        const match = textToCaret.match(/@(\w*)$/);
        if (match) {
            const rect = range.getBoundingClientRect();
            // Calculate relative position to composer
            const composerRect = composerRef.current?.getBoundingClientRect();
            if (composerRect) {
                setCursorPosition({
                    top: rect.bottom - composerRect.top,
                    left: rect.left - composerRect.left
                });
                setMentionQuery(match[1]);
                setIsMentionOpen(true);
                setMentionIndex(0);
            }
        } else {
            setIsMentionOpen(false);
        }
    };

    const insertMention = (member: any) => {
        if (!member) return;
        const user = member.organizationMember?.user || member.user;
        const displayName = `${user.firstName} ${user.lastName}`;
        const userId = user.id;

        // Create span for mention
        const span = document.createElement('span');
        span.className = 'text-primary font-bold bg-primary/10 px-1 rounded mx-0.5 select-none';
        span.contentEditable = 'false';
        span.dataset.userId = userId;
        span.dataset.displayName = displayName;
        span.innerText = `@${displayName}`;

        const selection = window.getSelection();
        if (selection && selection.rangeCount) {
            const range = selection.getRangeAt(0);

            // Delete the @query text
            // We need to traverse back from cursor to find @
            // For MVP, simplistic replacement of current text node content if it matches
            if (range.startContainer.nodeType === Node.TEXT_NODE) {
                const text = range.startContainer.textContent || '';
                const match = text.slice(0, range.startOffset).match(/@(\w*)$/);
                if (match) {
                    const before = text.slice(0, match.index);
                    const after = text.slice(range.startOffset);
                    range.startContainer.textContent = before;

                    // Insert mention
                    range.insertNode(span);

                    // Insert space after
                    const space = document.createTextNode('\u00A0');
                    range.collapse(false); // Move to end of span
                    range.insertNode(space);

                    // Restore remainder of text if any (simple case usually at end)
                    if (after) {
                        const afterNode = document.createTextNode(after);
                        range.collapse(false);
                        range.insertNode(afterNode);
                    }

                    // Move cursor to end
                    range.setStartAfter(space);
                    range.setEndAfter(space);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }

        setIsMentionOpen(false);
        if (composerRef.current) setContent(composerRef.current.innerText); // trigger update
    };

    const handleSubmit = async () => {
        if (!composerRef.current || !composerRef.current.innerText.trim()) return;
        setIsLoading(true);

        // Convert DOM to Markdown format @[Name](id)
        let processedContent = '';

        // We iterate child nodes to build the string
        composerRef.current.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                processedContent += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                if (el.dataset.userId) {
                    processedContent += `@[${el.dataset.displayName}](${el.dataset.userId})`;
                } else {
                    // Handle <br> or other elements
                    if (el.tagName === 'BR') processedContent += '\n';
                    else processedContent += el.innerText;
                }
            }
        });

        // Fallback cleanup
        processedContent = processedContent.replace(/\u00A0/g, ' ');

        try {
            await onPost(processedContent);
            if (composerRef.current) composerRef.current.innerHTML = '';
            setContent('');
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative">
            <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <AtSign size={14} className="text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                    <div className="relative bg-background border border-border rounded-xl transition-all focus-within:ring-2 focus-within:ring-primary/50 focus-within:border-transparent">
                        <div
                            ref={composerRef}
                            contentEditable={!isLoading}
                            onInput={handleInput}
                            onKeyDown={handleKeyDown}
                            onKeyUp={handleKeyUp}
                            className="w-full p-4 text-sm text-text-primary focus:outline-none min-h-[80px] max-h-[200px] overflow-y-auto whitespace-pre-wrap"
                            data-placeholder={placeholder}
                        />
                        {!content && (
                            <div className="absolute top-4 left-4 text-text-secondary/50 text-sm pointer-events-none">
                                {placeholder}
                            </div>
                        )}

                        {/* Hidden file input */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && onFileAttach) {
                                    onFileAttach(file);
                                }
                                e.target.value = ''; // Reset for same file selection
                            }}
                            className="hidden"
                        />

                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-foreground/[0.02]">
                            <div className="flex gap-2">
                                <button className="p-1.5 hover:bg-foreground/10 rounded text-text-secondary hover:text-text-primary transition-colors" title="Mention (@)">
                                    <AtSign size={16} />
                                </button>
                                {onFileAttach && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-1.5 hover:bg-foreground/10 rounded text-text-secondary hover:text-text-primary transition-colors"
                                        title="Attach file"
                                    >
                                        <Paperclip size={16} />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={!content.trim() || isLoading}
                                className="px-4 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isLoading ? 'Posting...' : 'Post'}
                                <Send size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mention Dropdown */}
            {isMentionOpen && filteredMembers.length > 0 && (
                <div
                    className="absolute z-50 w-64 bg-[#0F0F0F] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col"
                    style={{
                        top: (cursorPosition?.top || 0) + 40, // Offset
                        left: (cursorPosition?.left || 0) + 50
                    }}
                >
                    <div className="px-3 py-2 bg-white/5 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                        Suggested Members
                    </div>
                    {filteredMembers.map((member, idx) => {
                        const user = member.organizationMember?.user || member.user;
                        if (!user) return null;
                        return (
                            <button
                                key={member.id}
                                onClick={() => insertMention(member)}
                                className={`flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${idx === mentionIndex ? 'bg-primary/20 text-white' : 'hover:bg-white/5 text-slate-300'}`}
                            >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border border-white/10">
                                    {user.firstName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold truncate">{user.firstName} {user.lastName}</div>
                                    <div className="text-[10px] text-white/50 truncate flex items-center gap-1">
                                        {member.role?.name || 'Member'}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
