import Display from '@/Components/Typography/Display';
import Eyebrow from '@/Components/Typography/Eyebrow';
import Marginalia from '@/Components/Typography/Marginalia';

type Props = {
    eyebrow?: React.ReactNode;
    title: React.ReactNode;
    /** Trailing italic ink-2 clause appended to the title. */
    italic?: React.ReactNode;
    lead?: React.ReactNode;
};

/** Eyebrow + display H1 (+ optional italic clause) + lead marginalia. */
export default function PageHeader({ eyebrow, title, italic, lead }: Props) {
    return (
        <div style={{ marginBottom: 36 }}>
            {eyebrow && <Eyebrow style={{ marginBottom: 14 }}>{eyebrow}</Eyebrow>}
            <Display size="lg" as="h1">
                {title}
                {italic && <em style={{ fontWeight: 300, color: 'var(--ink-2)' }}> {italic}</em>}
            </Display>
            {lead && (
                <Marginalia style={{ fontSize: 18, marginTop: 14, maxWidth: 640 }}>{lead}</Marginalia>
            )}
        </div>
    );
}
