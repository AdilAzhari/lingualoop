// Concentric breathing rings — the grading-screen loader. This IS the loader;
// do not add a skeleton/shimmer (handoff §7.2, §11). The `breathe` keyframe is
// defined globally in app.css.
export default function Pulse() {
    const delays = [0, 0.8, 1.6, 2.4];
    return (
        <div style={{ position: 'relative', width: 180, height: 180 }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
                {delays.map((delay, i) => (
                    <circle
                        key={i}
                        cx="90"
                        cy="90"
                        r="20"
                        fill="none"
                        stroke="var(--ink)"
                        strokeWidth="0.6"
                        style={{
                            transformOrigin: '90px 90px',
                            animation: `breathe 3.2s ease-out ${delay}s infinite`,
                        }}
                    />
                ))}
                <circle cx="90" cy="90" r="6" fill="var(--signal)" />
            </svg>
        </div>
    );
}
