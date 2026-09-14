/**
 * Static, data-free mockup of a template.
 *
 * Used in the template picker grid so the ten cards never render ten live
 * artisan sites at once (expensive). It is a pure CSS sketch driven by the
 * template's `preview` tokens — no artisan data, no images, no API calls.
 */
export default function TemplateMock({ template, className = "" }) {
  const p = template.preview || {};
  const radius = p.radius || "8px";
  const square = radius === "0px";
  const bg = p.bg || "#F4F6FB";
  const surface = p.surface || "#FFFFFF";
  const text = p.text || "#0F1222";
  const muted = p.muted || "#B9C0C9";
  const accent = p.accent || "#111827";
  const accent2 = p.accent2 || "#F59E0B";
  const dark = !!p.darkHero;

  const bar = (w, h, color, opacity = 1, mt = 0) => ({
    width: w,
    height: h,
    background: color,
    opacity,
    borderRadius: 2,
    marginTop: mt,
  });

  return (
    <div
      className={className}
      style={{
        background: bg,
        border: "1px solid rgba(15,18,34,0.10)",
        borderRadius: "10px",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        aspectRatio: "4 / 3",
      }}
      aria-hidden="true"
    >
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 9px", background: surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 13, height: 13, borderRadius: square ? 2 : "50%", background: accent }} />
          <div style={bar(34, 5, text, 0.75)} />
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={bar(15, 4, muted, 0.9)} />
          ))}
        </div>
      </div>

      {/* hero */}
      {p.fullBleedHero ? (
        <div
          style={{
            position: "relative",
            flex: 1,
            background: dark ? "#0F141B" : accent,
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0, background: accent2, opacity: dark ? 0.14 : 0.22 }} />
          <div style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: "72%" }}>
            <div style={bar("88%", 9, "#FFF", 0.95)} />
            <div style={bar("60%", 9, "#FFF", 0.95, 5)} />
            <div style={bar("45%", 5, "#FFF", 0.6, 7)} />
            <div style={{ ...bar(42, 13, accent2, 1, 9), borderRadius: square ? 0 : 3 }} />
          </div>
          {dark && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                borderTop: `2px solid ${accent2}`,
                background: "rgba(255,255,255,0.05)",
              }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ flex: 1, padding: "5px 6px", borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.14)" }}>
                  <div style={bar("55%", 8, "#FFF", 1)} />
                  <div style={{ ...bar("75%", 4, accent2, 1, 4) }} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 9, padding: 10, alignItems: "center" }}>
          <div>
            <div style={bar("92%", 9, text, 0.9)} />
            <div style={bar("72%", 6, text, 0.85, 5)} />
            <div style={bar("85%", 4, muted, 0.9, 7)} />
            <div style={{ ...bar(46, 12, accent, 1, 9), borderRadius: 999 }} />
          </div>
          <div style={{ alignSelf: "stretch", background: muted, opacity: 0.4, borderRadius: square ? 0 : 10 }} />
        </div>
      )}

      {/* reassurance band (Confiance-style templates) */}
      {p.reassuranceBand && (
        <div
          style={{
            display: "flex",
            background: `${accent}0D`,
            borderTop: `1px solid ${muted}55`,
            borderBottom: `1px solid ${muted}55`,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "6px 7px",
                borderLeft: i === 0 ? "none" : `1px solid ${muted}55`,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <div style={{ width: 9, height: 9, borderRadius: "50%", border: `1.5px solid ${accent}`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={bar("60%", 6, accent, 0.9)} />
                <div style={bar("85%", 4, muted, 0.9, 3)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* services strip */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${p.gallery || 4}, 1fr)`, gap: 6, padding: 9, background: bg }}>
        {Array.from({ length: p.gallery || 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: surface,
              border: `1px solid ${muted}55`,
              borderRadius: square ? 0 : 5,
              padding: 5,
              minHeight: 30,
            }}
          >
            <div style={bar("70%", 5, text, 0.7)} />
            <div style={bar("92%", 4, muted, 0.8, 4)} />
            <div style={bar("60%", 4, muted, 0.8, 3)} />
          </div>
        ))}
      </div>
    </div>
  );
}
