import { Head, Link, useForm } from '@inertiajs/react';
import AppShell from '@/Components/Layout/AppShell';
import Page from '@/Components/Layout/Page';
import SectionHeader from '@/Components/Layout/SectionHeader';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';
import { Ico } from '@/Components/Common/icons';

type ErrorTargeted = { type: string; span_text: string; suggested_fix: string; note: string };
type PreviousRewrite = { id: number; rewrite: string; feedback: { improved: boolean; notes: string } | null; date: string };

type Props = {
    submission_id: number;
    original_paragraph: string;
    errors_targeted: ErrorTargeted[];
    previous_rewrites: PreviousRewrite[];
};

export default function Rewrite({ submission_id, original_paragraph, errors_targeted, previous_rewrites }: Props) {
    const form = useForm({
        original_paragraph,
        rewritten_paragraph: '',
        errors_targeted,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/submissions/${submission_id}/rewrite`, {
            onSuccess: () => form.setData('rewritten_paragraph', ''),
        });
    }

    return (
        <AppShell>
            <Head title="Rewrite" />
            <Page>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                    <Link
                        href={`/submissions/${submission_id}`}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', fontFamily: 'var(--serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--ink-3)' }}
                    >
                        <Ico.arrowLeft /> back to feedback
                    </Link>
                    <Eyebrow>Rewrite practice</Eyebrow>
                </div>

                {/* Errors being targeted */}
                {errors_targeted.length > 0 && (
                    <div className="card" style={{ padding: 20, marginBottom: 32, background: 'var(--signal-wash)', borderColor: 'var(--signal-soft)' }}>
                        <Eyebrow style={{ color: 'var(--signal)', marginBottom: 12 }}>Fix these in your rewrite</Eyebrow>
                        <div className="col" style={{ gap: 10 }}>
                            {errors_targeted.map((e, i) => (
                                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                                    <span style={{ fontFamily: 'var(--serif)', fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)' }}>
                                        "{e.span_text}"
                                    </span>
                                    <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--serif)' }}>→</span>
                                    <span style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--signal)' }}>
                                        {e.suggested_fix}
                                    </span>
                                    <span className="label-mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{e.type}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'flex-start', marginBottom: 40 }}>
                    {/* Original */}
                    <div>
                        <SectionHeader label="Original paragraph" />
                        <div className="card" style={{ padding: 20 }}>
                            <p style={{ margin: 0, fontFamily: 'var(--serif)', fontSize: 16, lineHeight: 1.7, color: 'var(--ink-2)', fontStyle: 'italic' }}>
                                {original_paragraph}
                            </p>
                        </div>
                    </div>

                    {/* Rewrite form */}
                    <div>
                        <SectionHeader label="Your rewrite" />
                        <form onSubmit={submit}>
                            <textarea
                                value={form.data.rewritten_paragraph}
                                onChange={(e) => form.setData('rewritten_paragraph', e.target.value)}
                                placeholder="Rewrite the paragraph, fixing the patterns listed above…"
                                rows={8}
                                style={{
                                    width: '100%', padding: '16px', fontSize: 16,
                                    fontFamily: 'var(--serif)', lineHeight: 1.7,
                                    color: 'var(--ink)', background: 'var(--paper)',
                                    border: '1px solid var(--hairline)', borderRadius: 'var(--r-2)',
                                    outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                                }}
                            />
                            {form.errors.rewritten_paragraph && (
                                <p style={{ fontSize: 13, color: 'var(--signal)', fontFamily: 'var(--serif)', margin: '4px 0' }}>
                                    {form.errors.rewritten_paragraph}
                                </p>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                <button
                                    type="submit"
                                    className="btn"
                                    disabled={form.processing || form.data.rewritten_paragraph.length < 20}
                                >
                                    Submit rewrite <Ico.arrow />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Previous rewrites */}
                {previous_rewrites.length > 0 && (
                    <section>
                        <SectionHeader label="Previous attempts" />
                        <div className="col" style={{ gap: 16 }}>
                            {previous_rewrites.map((r) => (
                                <div key={r.id} className="card" style={{ padding: 20 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <span className="label-mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>{r.date}</span>
                                        {r.feedback && (
                                            <span style={{
                                                fontSize: 11, fontFamily: 'var(--serif)', fontStyle: 'italic',
                                                color: r.feedback.improved ? 'var(--progress)' : 'var(--signal)',
                                            }}>
                                                {r.feedback.improved ? '↑ improved' : '→ needs work'}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ margin: '0 0 12px', fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 1.6, fontStyle: 'italic', color: 'var(--ink-2)' }}>
                                        {r.rewrite}
                                    </p>
                                    {r.feedback?.notes && (
                                        <Marginalia style={{ fontSize: 13, borderTop: '0.5px solid var(--hairline)', paddingTop: 10, marginTop: 0 }}>
                                            {r.feedback.notes}
                                        </Marginalia>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </Page>
        </AppShell>
    );
}
